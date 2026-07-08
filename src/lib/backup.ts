import { prisma } from "@/src/lib/prisma";
import { UserRole } from "@prisma/client";

// Shared backup collector used by the admin "Export" action (after an auth check)
// and by the scheduled cron route (after a secret check). Passwords are never
// included. Kept out of the "use server" surface so it is not itself callable.
export async function collectBackupData() {
  const [
    admins, teachers, students, sections, subjects,
    enrollments, attendance, attendanceAudit, appeals, systemSettings, terms,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.user.findMany({
      where: { role: UserRole.TEACHER },
      select: { id: true, name: true, email: true, role: true, teacher: { select: { id: true } } },
    }),
    prisma.student.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, username: true, role: true } },
        section: { select: { id: true, name: true } },
      },
    }),
    prisma.section.findMany({ include: { teacher: { select: { id: true, userId: true } } } }),
    prisma.subject.findMany({ include: { teacher: { select: { id: true, userId: true } } } }),
    prisma.studentSubject.findMany(),
    prisma.attendance.findMany({ orderBy: { date: "asc" } }),
    prisma.attendanceAudit.findMany({ orderBy: { timestamp: "asc" } }),
    prisma.appeal.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.systemSetting.findMany(),
    prisma.term.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.1",
    data: {
      terms, admins, teachers, students, sections, subjects,
      enrollments, attendance, attendanceAudit, appeals, systemSettings,
    },
  };
}
