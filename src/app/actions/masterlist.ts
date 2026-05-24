"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { logActivity } from "@/src/lib/audit";
import type { ParsedSection, ParsedMasterlist } from "@/src/lib/csvParser";
import { getUTCMidnight } from "@/src/lib/date";

export async function getMasterlist() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const students = await prisma.student.findMany({
    include: {
      user: true,
      section: true,
      enrolledSubjects: { include: { subject: true } },
    },
    orderBy: { studentId: "asc" },
  });

  const sections = await prisma.section.findMany({
    include: {
      teacher: { include: { user: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  const subjects = await prisma.subject.findMany({
    include: {
      teacher: { include: { user: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: "asc" },
  });

  const teachers = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return { students, sections, subjects, teachers };
}

export async function getSectionMasterlist(sectionId: string, date?: Date) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { teacher: { include: { user: true } } },
  });

  if (!section) throw new Error("Section not found");

  const students = await prisma.student.findMany({
    where: { sectionId },
    include: {
      user: true,
      enrolledSubjects: { include: { subject: { include: { teacher: { include: { user: true } } } } } },
    },
    orderBy: { studentId: "asc" },
  });

  const sections = await prisma.section.findMany({ orderBy: { name: "asc" } });

  return { section, students, sections };
}

export async function getSubjectMasterlist(subjectId: string, date?: Date) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { teacher: { include: { user: true } } },
  });

  if (!subject) throw new Error("Subject not found");

  const selectedDate = getUTCMidnight(date || new Date());
  const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);

  const enrollments = await prisma.studentSubject.findMany({
    where: { subjectId },
    include: {
      student: {
        include: {
          user: true,
          attendances: {
            where: { date: { gte: selectedDate, lt: nextDay }, subjectId },
          },
        },
      },
    },
    orderBy: { student: { studentId: "asc" } },
  });

  const students = enrollments.map((e) => e.student);
  const subjects = await prisma.subject.findMany({ orderBy: { code: "asc" } });

  return { subject, students, subjects };
}

export async function addStudent(data: {
  name: string;
  email: string;
  studentId: string;
  sectionId: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  // Check for duplicates
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    return { success: false, message: "A user with this email already exists." };
  }

  const existingId = await prisma.student.findUnique({
    where: { studentId: data.studentId },
  });
  if (existingId) {
    return { success: false, message: "A student with this ID already exists." };
  }

  const bcrypt = require("bcryptjs");
  const hashedPassword = bcrypt.hashSync(data.studentId, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: UserRole.STUDENT,
      },
    });

    await tx.student.create({
      data: {
        studentId: data.studentId,
        qrToken: crypto.randomUUID(),
        userId: user.id,
        sectionId: data.sectionId,
      },
    });
  });

  await logActivity("STUDENT_ADD", `Enrolled student: ${data.name} (${data.studentId})`, { 
    studentId: data.studentId, 
    name: data.name, 
    sectionId: data.sectionId 
  });

  revalidatePath("/admin/masterlist");
  return { success: true, message: `${data.name} (${data.studentId}) added successfully.` };
}

export async function removeStudent(studentDbId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentDbId },
    include: { user: true },
  });

  if (!student) {
    return { success: false, message: "Student not found." };
  }

  // Delete in order: appeals -> attendance -> enrollments -> student -> user
  await prisma.$transaction(async (tx) => {
    await tx.appeal.deleteMany({ where: { studentId: studentDbId } });
    await tx.attendance.deleteMany({ where: { studentId: studentDbId } });
    await tx.studentSubject.deleteMany({ where: { studentId: studentDbId } });
    await tx.student.delete({ where: { id: studentDbId } });
    await tx.user.delete({ where: { id: student.userId } });
  });

  await logActivity("STUDENT_REMOVE", `Removed student: ${student.user.name} (${student.studentId})`, {
    studentId: student.studentId,
    name: student.user.name
  });

  revalidatePath("/admin/masterlist");
  return { success: true, message: `${student.user.name} removed from the system.` };
}

export async function addSection(name: string, teacherId?: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.section.findUnique({ where: { name } });
  if (existing) {
    return { success: false, message: `Section "${name}" already exists.` };
  }

  await prisma.section.create({
    data: {
      name,
      teacherId: teacherId || null,
    },
  });

  await logActivity("SECTION_ADD", `Created new section: ${name}`, { name, teacherId });

  revalidatePath("/admin/masterlist");
  return { success: true, message: `Section "${name}" created.` };
}

export async function updateSection(sectionId: string, data: { name?: string; teacherId?: string | null }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  if (data.name) {
    const existing = await prisma.section.findUnique({ where: { name: data.name } });
    if (existing && existing.id !== sectionId) {
      return { success: false, message: `Section name "${data.name}" already in use.` };
    }
  }

  await prisma.section.update({
    where: { id: sectionId },
    data,
  });

  await logActivity("SECTION_UPDATE", `Updated section: ${data.name || sectionId}`, { sectionId, ...data });

  revalidatePath("/admin/masterlist");
  return { success: true, message: "Section updated successfully." };
}

export async function removeSection(sectionId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      _count: { select: { students: true } },
    },
  });

  if (!section) return { success: false, message: "Section not found." };

  if (section._count.students > 0) {
    return {
      success: false,
      message: "Cannot delete section. It still has enrolled students.",
    };
  }

  await prisma.section.delete({ where: { id: sectionId } });

  await logActivity("SECTION_REMOVE", `Removed section: ${section.name}`, { sectionId, name: section.name });

  revalidatePath("/admin/masterlist");
  return { success: true, message: "Section deleted successfully." };
}

export async function updateStudent(
  studentDbId: string,
  data: { name: string; email: string; studentId: string; sectionId: string }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentDbId },
    include: { user: true },
  });

  if (!student) return { success: false, message: "Student not found." };

  if (data.email !== student.user.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) return { success: false, message: "Email already in use." };
  }

  if (data.studentId !== student.studentId) {
    const existingId = await prisma.student.findUnique({ where: { studentId: data.studentId } });
    if (existingId) return { success: false, message: "Student ID already in use." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: student.userId },
      data: { name: data.name, email: data.email },
    });
    await tx.student.update({
      where: { id: studentDbId },
      data: { studentId: data.studentId, sectionId: data.sectionId || null },
    });
  });

  await logActivity("STUDENT_UPDATE", `Updated student info: ${data.name}`, { 
    studentDbId, 
    ...data 
  });

  revalidatePath("/admin/masterlist");
  return { success: true, message: "Student updated successfully." };
}

export async function adminUpdateAttendance(
  studentId: string,
  subjectId: string,
  date: Date,
  status: "PRESENT" | "ABSENT" | "LATE",
  timeString?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const targetDate = getUTCMidnight(date);

  let updatedAt: Date | undefined;
  if (timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    updatedAt = new Date(targetDate);
    updatedAt.setUTCHours(hours, minutes, 0, 0);
  }

  const attendance = await prisma.attendance.upsert({
    where: {
      studentId_date_subjectId: { studentId, date: targetDate, subjectId },
    },
    update: {
      status,
      ...(updatedAt ? { updatedAt } : {}),
    },
    create: {
      studentId,
      date: targetDate,
      subjectId,
      status,
      ...(updatedAt ? { updatedAt } : {}),
    },
  });

  await logActivity("ATTENDANCE_ADMIN_EDIT", `Admin updated attendance for student ${studentId}`, {
    studentId,
    subjectId,
    status,
    date: targetDate,
  });

  revalidatePath("/admin/masterlist");
  revalidatePath("/student/dashboard");
  return { success: true, message: "Attendance updated.", attendance };
}

export async function deleteAttendance(studentId: string, subjectId: string, date: Date) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const targetDate = getUTCMidnight(date);

  const existing = await prisma.attendance.findUnique({
    where: { studentId_date_subjectId: { studentId, date: targetDate, subjectId } },
  });

  if (!existing) {
    return { success: false, message: "No attendance record found." };
  }

  await prisma.attendance.delete({
    where: { studentId_date_subjectId: { studentId, date: targetDate, subjectId } },
  });

  await logActivity("ATTENDANCE_DELETE", `Admin deleted attendance for student ${studentId}`, {
    studentId,
    subjectId,
    date: targetDate,
  });

  revalidatePath("/admin/masterlist");
  revalidatePath("/student/dashboard");
  return { success: true, message: "Attendance record cleared." };
}

export async function resetStudentPasswordToTemp(studentDbId: string, tempPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentDbId },
    include: { user: true },
  });

  if (!student) return { success: false, message: "Student not found." };

  if (!tempPassword || tempPassword.length < 6) {
    return { success: false, message: "Temporary password is too short." };
  }

  const bcrypt = require("bcryptjs");
  const hashedPassword = bcrypt.hashSync(tempPassword, 10);

  await prisma.user.update({
    where: { id: student.userId },
    data: { password: hashedPassword },
  });

  await logActivity("STUDENT_PASSWORD_RESET", `Admin set temporary password for student ${student.user.name}`, {
    studentDbId,
    studentId: student.studentId,
  });

  revalidatePath("/admin/masterlist");
  return { success: true, message: `Password updated for ${student.user.name}.` };
}

export async function regenerateQrToken(studentDbId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentDbId },
    include: { user: true },
  });

  if (!student) return { success: false, message: "Student not found." };

  const newToken = crypto.randomUUID();

  await prisma.student.update({
    where: { id: studentDbId },
    data: { qrToken: newToken },
  });

  await logActivity("STUDENT_QR_REGEN", `Admin regenerated QR token for student ${student.user.name}`, {
    studentDbId,
    studentId: student.studentId,
  });

  revalidatePath("/admin/masterlist");
  return { success: true, message: `QR token regenerated for ${student.user.name}.` };
}

export async function getAttendanceRange(subjectId: string, from: Date, to: Date) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    ((session.user as any).role !== UserRole.ADMIN &&
      (session.user as any).role !== UserRole.TEACHER)
  ) {
    throw new Error("Unauthorized");
  }

  // Teachers can only export their own subjects
  if ((session.user as any).role === UserRole.TEACHER) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: (session.user as any).id },
      include: { subjects: true },
    });
    const ownsSubject = teacher?.subjects.some((s) => s.id === subjectId);
    if (!ownsSubject) throw new Error("Unauthorized");
  }

  const fromUTC = getUTCMidnight(from);
  const toUTC = new Date(getUTCMidnight(to).getTime() + 24 * 60 * 60 * 1000);

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { teacher: { include: { user: true } } },
  });

  const enrollments = await prisma.studentSubject.findMany({
    where: { subjectId },
    include: {
      student: {
        include: {
          user: true,
          attendances: {
            where: { date: { gte: fromUTC, lt: toUTC }, subjectId },
            orderBy: { date: "asc" },
          },
        },
      },
    },
    orderBy: { student: { studentId: "asc" } },
  });

  const students = enrollments.map((e) => e.student);

  return { subject, students, fromUTC, toUTC };
}

export async function addSubject(data: {
  code: string;
  name: string;
  units?: number;
  scheduleDay?: string;
  scheduleTime?: string;
  teacherId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.subject.findUnique({ where: { code: data.code } });
  if (existing) return { success: false, message: `Subject code "${data.code}" already exists.` };

  await prisma.subject.create({
    data: {
      code: data.code,
      name: data.name,
      units: data.units || null,
      scheduleDay: data.scheduleDay || null,
      scheduleTime: data.scheduleTime || null,
      teacherId: data.teacherId || null,
    },
  });

  await logActivity("SUBJECT_ADD", `Created subject: ${data.code} - ${data.name}`, data);
  revalidatePath("/admin/masterlist");
  return { success: true, message: `Subject "${data.code} - ${data.name}" created.` };
}

export async function updateSubject(
  subjectId: string,
  data: { code?: string; name?: string; units?: number | null; scheduleDay?: string | null; scheduleTime?: string | null; teacherId?: string | null }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  if (data.code) {
    const existing = await prisma.subject.findUnique({ where: { code: data.code } });
    if (existing && existing.id !== subjectId)
      return { success: false, message: `Subject code "${data.code}" already in use.` };
  }

  await prisma.subject.update({ where: { id: subjectId }, data });
  await logActivity("SUBJECT_UPDATE", `Updated subject ${subjectId}`, { subjectId, ...data });
  revalidatePath("/admin/masterlist");
  return { success: true, message: "Subject updated successfully." };
}

export async function removeSubject(subjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { _count: { select: { enrollments: true, attendances: true } } },
  });

  if (!subject) return { success: false, message: "Subject not found." };

  if (subject._count.enrollments > 0 || subject._count.attendances > 0) {
    return { success: false, message: "Cannot delete subject with enrolled students or attendance records." };
  }

  await prisma.subject.delete({ where: { id: subjectId } });
  await logActivity("SUBJECT_REMOVE", `Removed subject: ${subject.code}`, { subjectId });
  revalidatePath("/admin/masterlist");
  return { success: true, message: "Subject deleted successfully." };
}

export async function enrollStudentInSubject(studentDbId: string, subjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) throw new Error("Unauthorized");

  const existing = await prisma.studentSubject.findUnique({
    where: { studentId_subjectId: { studentId: studentDbId, subjectId } },
  });
  if (existing) return { success: false, message: "Student is already enrolled in this subject." };

  await prisma.studentSubject.create({ data: { studentId: studentDbId, subjectId } });
  revalidatePath("/admin/masterlist");
  return { success: true, message: "Student enrolled in subject." };
}

export async function unenrollStudentFromSubject(studentDbId: string, subjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) throw new Error("Unauthorized");

  await prisma.studentSubject.deleteMany({
    where: { studentId: studentDbId, subjectId },
  });
  revalidatePath("/admin/masterlist");
  return { success: true, message: "Student unenrolled from subject." };
}

export interface ImportResult {
  success: boolean;
  message: string;
  summary: {
    sectionsCreated: number;
    sectionsExisting: number;
    subjectsCreated: number;
    subjectsExisting: number;
    teachersCreated: number;
    teachersExisting: number;
    studentsCreated: number;
    studentsUpdated: number;
    enrollmentsCreated: number;
    errors: { studentId: string; message: string }[];
  };
}

export async function importMasterlist(parsed: ParsedMasterlist): Promise<ImportResult> {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const bcrypt = require("bcryptjs");

  // Pre-compute all password hashes BEFORE the transaction
  // bcrypt.hashSync is slow (~100ms each) and would exhaust the default 5s transaction timeout
  const teacherPasswordHash = bcrypt.hashSync("teacher123", 10);
  const studentPasswordMap = new Map<string, string>();
  for (const s of parsed.students) {
    studentPasswordMap.set(s.studentId, bcrypt.hashSync(s.studentId, 10));
  }

  const summary = {
    sectionsCreated: 0,
    sectionsExisting: 0,
    subjectsCreated: 0,
    subjectsExisting: 0,
    teachersCreated: 0,
    teachersExisting: 0,
    studentsCreated: 0,
    studentsUpdated: 0,
    enrollmentsCreated: 0,
    errors: [] as { studentId: string; message: string }[],
  };

  const upsertTeacher = async (name: string, email: string) => {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { teacher: true },
    });
    if (existingUser) {
      summary.teachersExisting++;
      if (existingUser.teacher) return existingUser.teacher;
      return prisma.teacher.create({ data: { userId: existingUser.id } });
    }
    const newUser = await prisma.user.create({
      data: { name, email, password: teacherPasswordHash, role: UserRole.TEACHER },
    });
    summary.teachersCreated++;
    return prisma.teacher.create({ data: { userId: newUser.id } });
  };

  try {
      // --- Upsert Sections (with advisers) ---
      for (const sectionData of parsed.sections) {
        const adviserRecord = await upsertTeacher(sectionData.adviserName, sectionData.adviserEmail);

        const existing = await prisma.section.findUnique({ where: { name: sectionData.sectionName } });
        if (existing) {
          if (existing.teacherId !== adviserRecord.id) {
            await prisma.section.update({ where: { id: existing.id }, data: { teacherId: adviserRecord.id } });
          }
          summary.sectionsExisting++;
        } else {
          await prisma.section.create({ data: { name: sectionData.sectionName, teacherId: adviserRecord.id } });
          summary.sectionsCreated++;
        }
      }

      // --- Upsert Subjects (with subject teachers) ---
      for (const subjectData of parsed.subjects) {
        const subjectTeacher = await upsertTeacher(subjectData.teacherName, subjectData.teacherEmail);

        const existing = await prisma.subject.findUnique({ where: { code: subjectData.code } });
        if (existing) {
          await prisma.subject.update({
            where: { id: existing.id },
            data: { name: subjectData.name, teacherId: subjectTeacher.id, units: subjectData.units ?? null, scheduleDay: subjectData.scheduleDay ?? null, scheduleTime: subjectData.scheduleTime ?? null },
          });
          summary.subjectsExisting++;
        } else {
          await prisma.subject.create({
            data: { code: subjectData.code, name: subjectData.name, units: subjectData.units ?? null, scheduleDay: subjectData.scheduleDay ?? null, scheduleTime: subjectData.scheduleTime ?? null, teacherId: subjectTeacher.id },
          });
          summary.subjectsCreated++;
        }
      }

      // --- Upsert Students + Enrollments ---
      for (const studentData of parsed.students) {
        try {
          const sectionRecord = studentData.sectionName
            ? await prisma.section.findUnique({ where: { name: studentData.sectionName } })
            : null;

          let studentRecord = await prisma.student.findUnique({
            where: { studentId: studentData.studentId },
            include: { user: true },
          });

          if (studentRecord) {
            if (sectionRecord && studentRecord.sectionId !== sectionRecord.id) {
              await prisma.student.update({ where: { id: studentRecord.id }, data: { sectionId: sectionRecord.id } });
            }
            if (studentData.studentName && studentData.studentName !== studentRecord.user.name) {
              await prisma.user.update({ where: { id: studentRecord.userId }, data: { name: studentData.studentName } });
            }
            summary.studentsUpdated++;
          } else {
            const existingEmail = studentData.studentEmail
              ? await prisma.user.findUnique({ where: { email: studentData.studentEmail } })
              : null;

            if (existingEmail) {
              summary.errors.push({ studentId: studentData.studentId, message: `Email "${studentData.studentEmail}" already in use.` });
              continue;
            }

            const newUser = await prisma.user.create({
              data: {
                name: studentData.studentName,
                email: studentData.studentEmail || null,
                password: studentPasswordMap.get(studentData.studentId) ?? bcrypt.hashSync(studentData.studentId, 10),
                role: UserRole.STUDENT,
              },
            });
            studentRecord = await prisma.student.create({
              data: { studentId: studentData.studentId, qrToken: crypto.randomUUID(), userId: newUser.id, sectionId: sectionRecord?.id ?? null },
              include: { user: true },
            });
            summary.studentsCreated++;
          }

          // Enroll in subjects
          for (const subjectCode of studentData.subjectCodes) {
            const subject = await prisma.subject.findUnique({ where: { code: subjectCode } });
            if (!subject) continue;
            const alreadyEnrolled = await prisma.studentSubject.findUnique({
              where: { studentId_subjectId: { studentId: studentRecord.id, subjectId: subject.id } },
            });
            if (!alreadyEnrolled) {
              await prisma.studentSubject.create({ data: { studentId: studentRecord.id, subjectId: subject.id } });
              summary.enrollmentsCreated++;
            }
          }
        } catch (err: any) {
          summary.errors.push({ studentId: studentData.studentId, message: err?.message || "Unknown error." });
        }
      }

    const parts: string[] = [];
    if (summary.sectionsCreated > 0) parts.push(`${summary.sectionsCreated} section(s) created`);
    if (summary.subjectsCreated > 0) parts.push(`${summary.subjectsCreated} subject(s) created`);
    if (summary.teachersCreated > 0) parts.push(`${summary.teachersCreated} teacher(s) created`);
    if (summary.studentsCreated > 0) parts.push(`${summary.studentsCreated} student(s) created`);
    if (summary.studentsUpdated > 0) parts.push(`${summary.studentsUpdated} student(s) updated`);
    if (summary.enrollmentsCreated > 0) parts.push(`${summary.enrollmentsCreated} enrollment(s) created`);
    if (summary.errors.length > 0) parts.push(`${summary.errors.length} error(s)`);

    const message = parts.length > 0 ? `Import complete: ${parts.join(", ")}.` : "Import complete. No changes needed.";

    await logActivity("MASTERLIST_IMPORT", message, { ...summary });
    revalidatePath("/admin/masterlist");
    return { success: true, message, summary };
  } catch (err: any) {
    return { success: false, message: `Import failed: ${err?.message || "Unknown error"}`, summary };
  }
}
