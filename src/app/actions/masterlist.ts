"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { logActivity } from "@/src/lib/audit";
import type { ParsedSection } from "@/src/lib/csvParser";
import { getUTCMidnight } from "@/src/lib/date";

export async function getMasterlist() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const today = getUTCMidnight();
  const nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const students = await prisma.student.findMany({
    include: {
      user: true,
      section: true,
      attendances: {
        where: {
          date: {
            gte: today,
            lt: nextDay,
          },
        },
      },
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

  const teachers = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return { students, sections, teachers };
}

export async function getSectionMasterlist(sectionId: string, date?: Date) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      teacher: { include: { user: true } },
    },
  });

  if (!section) {
    throw new Error("Section not found");
  }

  const selectedDate = getUTCMidnight(date || new Date());
  const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);

  const students = await prisma.student.findMany({
    where: { sectionId },
    include: {
      user: true,
      section: true,
      attendances: {
        where: {
          date: {
            gte: selectedDate,
            lt: nextDay,
          },
          sectionId: sectionId
        },
      },
    },
    orderBy: { studentId: "asc" },
  });

  const sections = await prisma.section.findMany({
    orderBy: { name: "asc" },
  });

  return { section, students, sections };
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

  // Delete in order: appeals -> attendance -> student -> user
  await prisma.$transaction(async (tx) => {
    await tx.appeal.deleteMany({ where: { studentId: studentDbId } });
    await tx.attendance.deleteMany({ where: { studentId: studentDbId } });
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
      _count: { select: { students: true, schedules: true } },
    },
  });

  if (!section) return { success: false, message: "Section not found." };

  if (section._count.students > 0 || section._count.schedules > 0) {
    return {
      success: false,
      message: "Cannot delete section. It has enrolled students or attendance records.",
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

export interface ImportResult {
  success: boolean;
  message: string;
  summary: {
    sectionsCreated: number;
    sectionsExisting: number;
    teachersCreated: number;
    teachersExisting: number;
    studentsCreated: number;
    studentsUpdated: number;
    errors: { studentId: string; message: string }[];
  };
}

export async function importMasterlist(sections: ParsedSection[]): Promise<ImportResult> {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const bcrypt = require("bcryptjs");

  const summary = {
    sectionsCreated: 0,
    sectionsExisting: 0,
    teachersCreated: 0,
    teachersExisting: 0,
    studentsCreated: 0,
    studentsUpdated: 0,
    errors: [] as { studentId: string; message: string }[],
  };

  try {
    await prisma.$transaction(async (tx) => {
      for (const sectionData of sections) {
        // --- Upsert Teacher ---
        let teacherRecord;
        const existingTeacherUser = await tx.user.findUnique({
          where: { email: sectionData.teacherEmail },
          include: { teacher: true },
        });

        if (existingTeacherUser) {
          // Teacher user exists
          if (existingTeacherUser.teacher) {
            teacherRecord = existingTeacherUser.teacher;
          } else {
            // User exists but no teacher record — create teacher record
            teacherRecord = await tx.teacher.create({
              data: { userId: existingTeacherUser.id },
            });
          }
          summary.teachersExisting++;
        } else {
          // Create new teacher user + teacher record
          const hashedTeacherPassword = bcrypt.hashSync("teacher123", 10);
          const newTeacherUser = await tx.user.create({
            data: {
              name: sectionData.teacherName,
              email: sectionData.teacherEmail,
              password: hashedTeacherPassword,
              role: UserRole.TEACHER,
            },
          });
          teacherRecord = await tx.teacher.create({
            data: { userId: newTeacherUser.id },
          });
          summary.teachersCreated++;
        }

        // --- Upsert Section ---
        let sectionRecord = await tx.section.findUnique({
          where: { name: sectionData.sectionName },
        });

        if (sectionRecord) {
          // Update teacher assignment if different
          if (sectionRecord.teacherId !== teacherRecord.id) {
            await tx.section.update({
              where: { id: sectionRecord.id },
              data: { teacherId: teacherRecord.id },
            });
          }
          summary.sectionsExisting++;
        } else {
          sectionRecord = await tx.section.create({
            data: {
              name: sectionData.sectionName,
              teacherId: teacherRecord.id,
            },
          });
          summary.sectionsCreated++;
        }

        // --- Upsert Students ---
        for (const studentData of sectionData.students) {
          try {
            const existingStudent = await tx.student.findUnique({
              where: { studentId: studentData.studentId },
              include: { user: true },
            });

            if (existingStudent) {
              // Student exists — update section assignment and info
              await tx.student.update({
                where: { id: existingStudent.id },
                data: { sectionId: sectionRecord.id },
              });
              // Update name if provided
              if (studentData.studentName && studentData.studentName !== existingStudent.user.name) {
                await tx.user.update({
                  where: { id: existingStudent.userId },
                  data: { name: studentData.studentName },
                });
              }
              summary.studentsUpdated++;
            } else {
              // Check if email is already taken by another user
              const existingEmail = await tx.user.findUnique({
                where: { email: studentData.studentEmail },
              });

              if (existingEmail) {
                summary.errors.push({
                  studentId: studentData.studentId,
                  message: `Email "${studentData.studentEmail}" is already in use by another account.`,
                });
                continue;
              }

              // Create new student
              const hashedStudentPassword = bcrypt.hashSync(studentData.studentId, 10);
              const newUser = await tx.user.create({
                data: {
                  name: studentData.studentName,
                  email: studentData.studentEmail,
                  password: hashedStudentPassword,
                  role: UserRole.STUDENT,
                },
              });

              await tx.student.create({
                data: {
                  studentId: studentData.studentId,
                  qrToken: crypto.randomUUID(),
                  userId: newUser.id,
                  sectionId: sectionRecord.id,
                },
              });

              summary.studentsCreated++;
            }
          } catch (err: any) {
            summary.errors.push({
              studentId: studentData.studentId,
              message: err?.message || "Unknown error during student import.",
            });
          }
        }
      }
    });

    // Build result message
    const parts: string[] = [];
    if (summary.sectionsCreated > 0) parts.push(`${summary.sectionsCreated} section(s) created`);
    if (summary.teachersCreated > 0) parts.push(`${summary.teachersCreated} teacher(s) created`);
    if (summary.studentsCreated > 0) parts.push(`${summary.studentsCreated} student(s) created`);
    if (summary.studentsUpdated > 0) parts.push(`${summary.studentsUpdated} student(s) updated`);
    if (summary.errors.length > 0) parts.push(`${summary.errors.length} error(s)`);

    const message = parts.length > 0
      ? `Import complete: ${parts.join(", ")}.`
      : "Import complete. No changes were needed.";

    await logActivity("MASTERLIST_IMPORT", message, {
      ...summary,
    });

    revalidatePath("/admin/masterlist");

    return { success: true, message, summary };
  } catch (err: any) {
    return {
      success: false,
      message: `Import failed: ${err?.message || "Unknown error"}`,
      summary,
    };
  }
}
