"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/src/lib/audit";
import { getUTCMidnight } from "@/src/lib/date";

export async function submitAppeal(studentId: string, description: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.STUDENT) {
    throw new Error("Unauthorized");
  }

  const result = await prisma.appeal.create({
    data: {
      studentId,
      description,
      status: "PENDING"
    }
  });

  revalidatePath("/student/appeals");
  revalidatePath("/teacher/appeals");
  return result;
}

export async function getTeacherAppeals() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    throw new Error("Unauthorized");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
    include: { subjects: true },
  });

  if (!teacher || teacher.subjects.length === 0) return [];

  const subjectIds = teacher.subjects.map((s) => s.id);

  // Find all students enrolled in this teacher's subjects
  const enrollments = await prisma.studentSubject.findMany({
    where: { subjectId: { in: subjectIds } },
    select: { studentId: true },
  });
  const studentDbIds = Array.from(new Set(enrollments.map((e) => e.studentId)));

  return prisma.appeal.findMany({
    where: { studentId: { in: studentDbIds } },
    include: {
      student: {
        include: { user: true, section: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewAppeal(appealId: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    ((session.user as any).role !== UserRole.TEACHER &&
      (session.user as any).role !== UserRole.ADMIN)
  ) {
    throw new Error("Unauthorized");
  }

  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId },
  });

  if (!appeal) throw new Error("Appeal not found");
  if (appeal.status !== "PENDING") {
    return { success: false, message: "This appeal has already been reviewed." };
  }

  const updated = await prisma.appeal.update({
    where: { id: appealId },
    data: {
      status,
      reviewedBy: (session.user as any).id,
      reviewedAt: new Date(),
    },
  });

  // If approved, mark the student PRESENT for today (common use case)
  if (status === "APPROVED") {
    const student = await prisma.student.findUnique({
      where: { id: appeal.studentId },
    });

    if (student) {
      const today = getUTCMidnight();

      // Find the first subject this student is enrolled in to mark attendance
      const enrollment = await prisma.studentSubject.findFirst({
        where: { studentId: student.id },
      });

      if (enrollment) {
        await prisma.attendance.upsert({
          where: {
            studentId_date_subjectId: {
              studentId: student.id,
              date: today,
              subjectId: enrollment.subjectId,
            },
          },
          update: { status: "PRESENT", updatedAt: new Date() },
          create: {
            studentId: student.id,
            date: today,
            subjectId: enrollment.subjectId,
            status: "PRESENT",
          },
        });
      }
    }
  }

  await logActivity("APPEAL_REVIEW", `Review appeal: ${status} for student ${appeal.studentId}`, {
    appealId,
    status,
    studentId: appeal.studentId
  });

  revalidatePath("/teacher/appeals");
  revalidatePath("/student/appeals");
  revalidatePath("/teacher/roster");

  return { success: true, message: `Appeal ${status.toLowerCase()} successfully.` };
}
