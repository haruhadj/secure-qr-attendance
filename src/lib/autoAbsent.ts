import { prisma } from "@/src/lib/prisma";
import { getUTCMidnight } from "@/src/lib/date";
import { manilaNowParts, parseScheduleDays, absentCutoffForDay } from "@/src/lib/schedule";
import { getActiveTermId } from "@/src/lib/term";

export interface AutoAbsentResult {
  enabled: boolean;
  checkedSubjects: number;
  markedAbsent: number;
}

/**
 * Sweep subjects whose class session has ended for today (start-of-day
 * schedule, minus the grace window) and create ABSENT attendance rows for
 * enrolled students who never scanned in. Idempotent by design — it only
 * ever creates a row where none exists yet, so re-running it (the cron can
 * fire every few minutes) never overwrites a scan, a manual edit, or an
 * appeal-approved status. A student can still contest an auto-marked ABSENT
 * through the existing appeal flow, same as a manual one.
 */
export async function runAutoAbsentSweep(now: Date = new Date()): Promise<AutoAbsentResult> {
  const enabledSetting = await prisma.systemSetting.findUnique({ where: { key: "auto_absent_enabled" } });
  const enabled = enabledSetting ? enabledSetting.value !== "false" : true;
  if (!enabled) {
    return { enabled: false, checkedSubjects: 0, markedAbsent: 0 };
  }

  const graceSetting = await prisma.systemSetting.findUnique({ where: { key: "late_grace_minutes" } });
  const graceMinutes = graceSetting ? parseInt(graceSetting.value, 10) : 15;

  const { dow, minutes } = manilaNowParts(now);
  const today = getUTCMidnight(now);
  const activeTermId = await getActiveTermId();

  const subjects = await prisma.subject.findMany({
    where: { scheduleDay: { not: null }, scheduleTime: { not: null } },
  });

  let checkedSubjects = 0;
  let markedAbsent = 0;

  for (const subject of subjects) {
    if (!parseScheduleDays(subject.scheduleDay).has(dow)) continue;

    const cutoff = absentCutoffForDay(subject, dow, graceMinutes);
    if (cutoff === null || minutes <= cutoff) continue;

    checkedSubjects++;

    const enrollments = await prisma.studentSubject.findMany({
      where: { subjectId: subject.id, termId: activeTermId },
      select: { studentId: true },
    });
    if (enrollments.length === 0) continue;

    const studentIds = enrollments.map((e) => e.studentId);
    const existing = await prisma.attendance.findMany({
      where: { subjectId: subject.id, date: today, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const alreadyRecorded = new Set(existing.map((e) => e.studentId));
    const missing = studentIds.filter((id) => !alreadyRecorded.has(id));

    for (const studentId of missing) {
      try {
        await prisma.$transaction(async (tx) => {
          const attendance = await tx.attendance.create({
            data: { studentId, date: today, subjectId: subject.id, status: "ABSENT", termId: activeTermId },
          });
          await tx.attendanceAudit.create({
            data: {
              attendanceId: attendance.id,
              changedBy: "SYSTEM",
              newStatus: "ABSENT",
              reason: "Auto-marked absent — no scan by class end",
            },
          });
        });
        markedAbsent++;
      } catch (err: unknown) {
        // Student scanned in concurrently between the check and the create —
        // the unique (studentId, date, subjectId) constraint caught it, skip.
        if ((err as { code?: string })?.code !== "P2002") throw err;
      }
    }
  }

  return { enabled: true, checkedSubjects, markedAbsent };
}
