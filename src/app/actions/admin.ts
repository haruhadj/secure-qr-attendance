"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/src/lib/audit";
import { getUTCMidnight, parseUTCDate } from "@/src/lib/date";
import { getActiveTermId } from "@/src/lib/term";
import { normalizeEmail } from "@/src/lib/username";
import { collectBackupData } from "@/src/lib/backup";

// Authorization helper
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAdminDashboardStats() {
  await requireAdmin();

  const totalStudents = await prisma.student.count();
  const totalTeachers = await prisma.teacher.count();
  const totalSections = await prisma.section.count();

  // Today's attendance rate
  const today = getUTCMidnight();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const totalPresentToday = await prisma.attendance.count({
    where: {
      date: { gte: today, lt: tomorrow },
      status: "PRESENT",
    },
  });

  const attendanceRate = totalStudents > 0 
    ? Math.round((totalPresentToday / totalStudents) * 100) 
    : 0;

  const pendingAppeals = await prisma.appeal.count({
    where: { status: "PENDING" },
  });

  const recentAudits = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    totalStudents,
    totalTeachers,
    totalSections,
    attendanceRate,
    pendingAppeals,
    recentAudits,
  };
}

// ---------------------------------------------------------------------------
// Date-based attendance browsing. Lets an admin pull up any subject's roster
// for any past (or future) date — a PeopleCore-style "jump to a date" view.
// The roster is the union of students enrolled in the active term and anyone
// who has an attendance record on that day, so historical records still show
// even after a student's enrollment changes across school years.
// ---------------------------------------------------------------------------
export async function getAttendanceForDate(dateStr?: string, subjectId?: string) {
  await requireAdmin();

  const selectedDate = dateStr ? parseUTCDate(dateStr) : getUTCMidnight();
  const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);

  const subjects = await prisma.subject.findMany({
    orderBy: { code: "asc" },
    include: { teacher: { include: { user: true } } },
  });

  const emptySummary = { present: 0, late: 0, absent: 0, unmarked: 0, total: 0 };

  if (subjects.length === 0) {
    return {
      subjects: [],
      selectedSubject: null,
      students: [],
      summary: emptySummary,
      selectedDateISO: selectedDate.toISOString(),
    };
  }

  const selectedSubject =
    (subjectId && subjects.find((s) => s.id === subjectId)) || subjects[0];

  const activeTermId = await getActiveTermId();

  // Base roster: students enrolled in this subject for the active term.
  const enrollments = await prisma.studentSubject.findMany({
    where: { subjectId: selectedSubject.id, termId: activeTermId },
    include: { student: { include: { user: true } } },
  });

  // Attendance for the selected day — covers historical records even if a
  // student is no longer enrolled in the active term.
  const attendances = await prisma.attendance.findMany({
    where: { subjectId: selectedSubject.id, date: { gte: selectedDate, lt: nextDay } },
    include: { student: { include: { user: true } } },
  });

  // Merge enrolled students with anyone who has a record that day (dedup by id).
  const byId = new Map<string, { id: string; studentId: string; name: string }>();
  for (const e of enrollments) {
    byId.set(e.student.id, {
      id: e.student.id,
      studentId: e.student.studentId,
      name: e.student.user.name || "Unknown",
    });
  }
  for (const a of attendances) {
    if (!byId.has(a.student.id)) {
      byId.set(a.student.id, {
        id: a.student.id,
        studentId: a.student.studentId,
        name: a.student.user.name || "Unknown",
      });
    }
  }

  const attByStudent = new Map(attendances.map((a) => [a.studentId, a]));

  const students = Array.from(byId.values())
    .map((s) => {
      const att = attByStudent.get(s.id);
      return {
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        status: att?.status ?? null,
        subjectId: selectedSubject.id,
        attendanceTime: att?.updatedAt?.toISOString() ?? null,
      };
    })
    .sort((a, b) => a.studentId.localeCompare(b.studentId));

  const summary = {
    present: students.filter((s) => s.status === "PRESENT").length,
    late: students.filter((s) => s.status === "LATE").length,
    absent: students.filter((s) => s.status === "ABSENT").length,
    unmarked: students.filter((s) => s.status === null).length,
    total: students.length,
  };

  return {
    subjects: subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      scheduleDay: s.scheduleDay,
      scheduleTime: s.scheduleTime,
    })),
    selectedSubject: {
      id: selectedSubject.id,
      code: selectedSubject.code,
      name: selectedSubject.name,
      teacherName: selectedSubject.teacher?.user?.name ?? null,
    },
    students,
    summary,
    selectedDateISO: selectedDate.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// School year / term management
// ---------------------------------------------------------------------------
export async function getTerms() {
  await requireAdmin();
  return prisma.term.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true, attendances: true } } },
  });
}

export async function createTerm(name: string, startDate?: string, endDate?: string) {
  await requireAdmin();
  const trimmed = name?.trim();
  if (!trimmed) return { success: false, message: "Please enter a name for the school year/term." };

  const existing = await prisma.term.findUnique({ where: { name: trimmed } });
  if (existing) return { success: false, message: `A term named "${trimmed}" already exists.` };

  const term = await prisma.term.create({
    data: {
      name: trimmed,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  await logActivity("TERM_CREATE", `Created school year/term: ${trimmed}`, { termId: term.id });
  revalidatePath("/admin/dashboard");
  return { success: true, message: `"${trimmed}" created.`, termId: term.id };
}

export async function setActiveTerm(termId: string) {
  await requireAdmin();
  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term) return { success: false, message: "Term not found." };

  // Exactly one active term at a time.
  await prisma.$transaction([
    prisma.term.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.term.update({ where: { id: termId }, data: { isActive: true } }),
  ]);

  await logActivity("TERM_ACTIVATE", `Activated school year/term: ${term.name}`, { termId });
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/masterlist");
  revalidatePath("/teacher/roster");
  return { success: true, message: `"${term.name}" is now the active school year.` };
}

/** Create a new term and immediately make it active — the normal "new year" path. */
export async function startNewSchoolYear(name: string, startDate?: string, endDate?: string) {
  const created = await createTerm(name, startDate, endDate);
  if (!created.success || !created.termId) return created;
  const activated = await setActiveTerm(created.termId);
  if (!activated.success) return activated;
  return { success: true, message: `New school year "${name.trim()}" started and activated. Import this year's masterlist to enroll students.` };
}

export async function getSystemSettings() {
  await requireAdmin();
  const settings = await prisma.systemSetting.findMany();
  
  // Provide defaults if they don't exist yet
  const defaultSettings = [
    { key: "attendance_lock_hours", value: "24", description: "Hours before attendance edits are locked for teachers (0 for unlimited)" },
    { key: "late_grace_minutes", value: "30", description: "Minutes after a class start time before a QR scan is marked LATE instead of PRESENT. Also used as the auto-absent cutoff for subjects with no end time." },
    { key: "auto_absent_enabled", value: "false", description: "Automatically mark ABSENT when a student has no attendance record after class ends (true/false)" },
  ];

  for (const ds of defaultSettings) {
    if (!settings.find((s) => s.key === ds.key)) {
      const created = await prisma.systemSetting.create({ data: ds });
      settings.push(created);
    }
  }

  return settings;
}

export async function updateSystemSetting(key: string, value: string) {
  await requireAdmin();

  // The numeric settings (…_hours, …_minutes) must be non-negative integers,
  // otherwise the downstream parseInt silently degrades behavior.
  if (/_(hours|minutes)$/.test(key)) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      return { success: false, message: "Value must be a whole number of zero or more." };
    }
  }

  if (/_enabled$/.test(key) && value !== "true" && value !== "false") {
    return { success: false, message: 'Value must be "true" or "false".' };
  }

  await prisma.systemSetting.update({
    where: { key },
    data: { value },
  });

  await logActivity("SETTING_UPDATE", `Updated system setting: ${key}`, { key, value });

  revalidatePath("/admin/dashboard");
  return { success: true, message: `Setting updated.` };
}

export async function getStaff() {
  await requireAdmin();
  
  return prisma.user.findMany({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.TEACHER] },
    },
    include: {
      teacher: { include: { sections: true, subjects: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function addStaff(name: string, rawEmail: string, role: UserRole) {
  await requireAdmin();

  if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
    return { success: false, message: "Invalid role specified." };
  }

  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { success: false, message: "A valid email is required." };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, message: "User with this email already exists." };
  }

  const bcrypt = require("bcryptjs");
  const defaultPassword = role === UserRole.TEACHER ? "teacher123" : "password123";
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        mustChangePassword: true, // default password — force a change on first login
      },
    });

    if (role === UserRole.TEACHER) {
      await tx.teacher.create({
        data: { userId: user.id },
      });
    }
  });

  await logActivity("STAFF_ADD", `Added new staff: ${name} (${role})`, { name, email, role });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/dashboard");
  return { success: true, message: `${name} added as ${role}.` };
}

export async function resetStaffPasswordToTemp(userId: string, tempPassword: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, message: "User not found." };

  if (!tempPassword || tempPassword.length < 8) {
    return { success: false, message: "Temporary password must be at least 8 characters." };
  }

  const bcrypt = require("bcryptjs");
  const hashedPassword = bcrypt.hashSync(tempPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, mustChangePassword: true },
  });

  await logActivity("STUDENT_PASSWORD_RESET", `Admin set temporary password for ${user.name} (${user.role})`, {
    userId,
    role: user.role,
  });

  revalidatePath("/admin/staff");
  return { success: true, message: `Password updated for ${user.name}.` };
}

export async function exportAllData() {
  await requireAdmin();
  return collectBackupData();
}

// ---------------------------------------------------------------------------
// Restore counterpart to exportAllData. Upserts every entity by its ORIGINAL id
// in FK-safe order, so a backup JSON can be re-applied onto an empty (or partial)
// database. Passwords are never in the export, so accounts that don't already
// exist are recreated with their documented default password and flagged to
// force a change on first login. Existing users are never re-passworded.
// ---------------------------------------------------------------------------
interface RestoreResult {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}

export async function importAllData(backup: any): Promise<RestoreResult> {
  await requireAdmin();

  const data = backup?.data;
  if (!data || typeof data !== "object") {
    return { success: false, message: "Invalid backup file — missing data section." };
  }

  const bcrypt = require("bcryptjs");
  const counts: Record<string, number> = {};
  const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);

  // studentId per userId, so a recreated student user gets its default password.
  const studentIdByUserId = new Map<string, string>();
  for (const s of data.students ?? []) {
    if (s.user?.id) studentIdByUserId.set(s.user.id, s.studentId);
  }

  const defaultPasswordFor = (role: UserRole, userId: string): string => {
    if (role === UserRole.STUDENT) return studentIdByUserId.get(userId) ?? "changeme01";
    if (role === UserRole.TEACHER) return "teacher123";
    return "password123";
  };

  const upsertUser = async (tx: any, u: { id: string; name?: string | null; email?: string | null; username?: string | null; role: UserRole }) => {
    await tx.user.upsert({
      where: { id: u.id },
      update: { name: u.name ?? null, email: u.email ?? null, username: u.username ?? null, role: u.role },
      create: {
        id: u.id,
        name: u.name ?? null,
        email: u.email ?? null,
        username: u.username ?? null,
        role: u.role,
        password: bcrypt.hashSync(defaultPasswordFor(u.role, u.id), 10),
        mustChangePassword: true,
      },
    });
    bump("users");
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        // 0. Terms (no FK deps). Enrollments require a termId, so ensure at least
        // one exists and pick a fallback for legacy backups that predate terms.
        for (const tm of data.terms ?? []) {
          await tx.term.upsert({
            where: { id: tm.id },
            update: { name: tm.name, isActive: tm.isActive, startDate: tm.startDate ? new Date(tm.startDate) : null, endDate: tm.endDate ? new Date(tm.endDate) : null },
            create: { id: tm.id, name: tm.name, isActive: tm.isActive ?? false, startDate: tm.startDate ? new Date(tm.startDate) : null, endDate: tm.endDate ? new Date(tm.endDate) : null },
          });
          bump("terms");
        }
        let fallbackTerm = await tx.term.findFirst({ where: { isActive: true } }) ?? await tx.term.findFirst();
        if (!fallbackTerm) {
          const year = new Date().getFullYear();
          fallbackTerm = await tx.term.create({ data: { name: `AY ${year}-${year + 1}`, isActive: true } });
        }
        const fallbackTermId = fallbackTerm.id;

        // 1. Users (admins, teacher users, student users)
        for (const a of data.admins ?? []) await upsertUser(tx, a);
        for (const t of data.teachers ?? []) await upsertUser(tx, t);
        for (const s of data.students ?? []) if (s.user) await upsertUser(tx, s.user);

        // 2. Teacher records
        for (const t of data.teachers ?? []) {
          if (!t.teacher?.id) continue;
          await tx.teacher.upsert({
            where: { id: t.teacher.id },
            update: { userId: t.id },
            create: { id: t.teacher.id, userId: t.id },
          });
          bump("teachers");
        }

        // 3. Sections
        for (const sec of data.sections ?? []) {
          await tx.section.upsert({
            where: { id: sec.id },
            update: { name: sec.name, teacherId: sec.teacherId ?? null },
            create: { id: sec.id, name: sec.name, teacherId: sec.teacherId ?? null },
          });
          bump("sections");
        }

        // 4. Subjects
        for (const sub of data.subjects ?? []) {
          const fields = {
            code: sub.code, name: sub.name, units: sub.units ?? null,
            scheduleDay: sub.scheduleDay ?? null, scheduleTime: sub.scheduleTime ?? null,
            teacherId: sub.teacherId ?? null,
          };
          await tx.subject.upsert({ where: { id: sub.id }, update: fields, create: { id: sub.id, ...fields } });
          bump("subjects");
        }

        // 5. Students
        for (const s of data.students ?? []) {
          const fields = {
            studentId: s.studentId, qrToken: s.qrToken, userId: s.userId,
            sectionId: s.sectionId ?? null, yearLevel: s.yearLevel ?? null,
          };
          await tx.student.upsert({ where: { id: s.id }, update: fields, create: { id: s.id, ...fields } });
          bump("students");
        }

        // 6. Enrollments (termId required — fall back for legacy backups)
        for (const e of data.enrollments ?? []) {
          await tx.studentSubject.upsert({
            where: { id: e.id },
            update: { termId: e.termId ?? fallbackTermId },
            create: { id: e.id, studentId: e.studentId, subjectId: e.subjectId, termId: e.termId ?? fallbackTermId },
          });
          bump("enrollments");
        }

        // 7. Attendance
        for (const at of data.attendance ?? []) {
          const fields = { date: new Date(at.date), status: at.status, studentId: at.studentId, subjectId: at.subjectId, termId: at.termId ?? fallbackTermId };
          await tx.attendance.upsert({ where: { id: at.id }, update: fields, create: { id: at.id, ...fields } });
          bump("attendance");
        }

        // 8. Attendance audit
        for (const au of data.attendanceAudit ?? []) {
          await tx.attendanceAudit.upsert({
            where: { id: au.id },
            update: {},
            create: {
              id: au.id, attendanceId: au.attendanceId, changedBy: au.changedBy,
              oldStatus: au.oldStatus ?? null, newStatus: au.newStatus ?? null,
              timestamp: new Date(au.timestamp), reason: au.reason ?? null,
            },
          });
          bump("attendanceAudit");
        }

        // 9. Appeals
        for (const ap of data.appeals ?? []) {
          const fields = {
            studentId: ap.studentId, subjectId: ap.subjectId ?? null,
            date: ap.date ? new Date(ap.date) : null, imageUrl: ap.imageUrl ?? null,
            description: ap.description, status: ap.status,
            reviewedBy: ap.reviewedBy ?? null, reviewedAt: ap.reviewedAt ? new Date(ap.reviewedAt) : null,
            createdAt: new Date(ap.createdAt),
          };
          await tx.appeal.upsert({ where: { id: ap.id }, update: fields, create: { id: ap.id, ...fields } });
          bump("appeals");
        }

        // 10. System settings
        for (const st of data.systemSettings ?? []) {
          await tx.systemSetting.upsert({
            where: { key: st.key },
            update: { value: st.value, description: st.description ?? null },
            create: { key: st.key, value: st.value, description: st.description ?? null },
          });
          bump("settings");
        }
      },
      { timeout: 120_000, maxWait: 20_000 }
    );
  } catch (err: any) {
    return { success: false, message: `Restore failed: ${err?.message || "Unknown error"}` };
  }

  await logActivity("DATA_RESTORE", "Restored data from a backup file.", { counts });
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/masterlist");
  revalidatePath("/admin/staff");
  return { success: true, message: "Backup restored.", counts };
}

export async function resetAllData() {
  const session = await requireAdmin();
  const adminId = (session.user as any).id;

  await prisma.$transaction(async (tx) => {
    await tx.attendanceAudit.deleteMany();
    await tx.attendance.deleteMany();
    await tx.appeal.deleteMany();
    await tx.studentSubject.deleteMany();
    await tx.activityLog.deleteMany();
    await tx.student.deleteMany();
    await tx.subject.deleteMany();
    await tx.section.deleteMany();
    await tx.teacher.deleteMany();
    await tx.user.deleteMany({
      where: { role: { in: [UserRole.STUDENT, UserRole.TEACHER] } },
    });
  });

  // Log the reset after the transaction so the admin user still exists
  await logActivity("DATA_RESET", "Full data reset performed — all students, teachers, sections, subjects, and attendance records deleted. Admin accounts preserved.", {
    performedBy: adminId,
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/staff");
  revalidatePath("/admin/masterlist");
  return { success: true, message: "All data has been reset. Admin accounts are preserved." };
}

export async function removeStaff(userId: string) {
  const session = await requireAdmin();

  if (userId === (session.user as any).id) {
    return { success: false, message: "You cannot remove yourself." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true },
  });

  if (!user) return { success: false, message: "User not found." };

  if (user.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      return { success: false, message: "Cannot remove the last Admin." };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (user.teacher) {
      // Remove teacher assignments from sections and subjects
      await tx.section.updateMany({
        where: { teacherId: user.teacher.id },
        data: { teacherId: null },
      });
      await tx.subject.updateMany({
        where: { teacherId: user.teacher.id },
        data: { teacherId: null },
      });
      await tx.teacher.delete({ where: { id: user.teacher.id } });
    }
    await tx.user.delete({ where: { id: userId } });
  });

  await logActivity("STAFF_REMOVE", `Removed staff member: ${user.name}`, { 
    userId: user.id, 
    name: user.name, 
    role: user.role 
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/dashboard");
  return { success: true, message: `Staff member removed.` };
}
