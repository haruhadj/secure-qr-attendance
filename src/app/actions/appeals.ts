"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/src/lib/audit";
import { getUTCMidnight } from "@/src/lib/date";
import { getActiveTermId } from "@/src/lib/term";

interface SubmitAppealInput {
  description: string;
  subjectId?: string | null;
  date?: string | null; // YYYY-MM-DD
  imageUrl?: string | null;
}

export async function submitAppeal(input: SubmitAppealInput) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.STUDENT) {
    return { success: false, message: "Unauthorized." };
  }

  // Resolve the student from the session — never trust a client-supplied id
  // (prevents a student from filing appeals as someone else).
  const student = await prisma.student.findUnique({
    where: { userId: (session.user as any).id },
    select: { id: true },
  });
  if (!student) {
    return { success: false, message: "Student profile not found." };
  }

  const description = input.description?.trim();
  if (!description) {
    return { success: false, message: "Please describe your appeal." };
  }

  // If a subject is named, verify the student is enrolled in it this term.
  let subjectId: string | null = null;
  if (input.subjectId) {
    const activeTermId = await getActiveTermId();
    const enrolled = await prisma.studentSubject.findFirst({
      where: { studentId: student.id, subjectId: input.subjectId, termId: activeTermId },
      select: { id: true },
    });
    if (!enrolled) {
      return { success: false, message: "You are not enrolled in the selected subject." };
    }
    subjectId = input.subjectId;
  }

  const date = input.date ? getUTCMidnight(input.date) : null;

  await prisma.appeal.create({
    data: {
      studentId: student.id,
      subjectId,
      date,
      imageUrl: input.imageUrl?.trim() || null,
      description,
      status: "PENDING",
    },
  });

  revalidatePath("/student/appeals");
  revalidatePath("/teacher/appeals");
  return { success: true, message: "Appeal submitted." };
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
      subject: { select: { code: true, name: true } },
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

  // When approved, correct attendance for the SPECIFIC subject and date the
  // appeal concerns. Fall back gracefully when the appeal predates these fields.
  if (status === "APPROVED") {
    // Prefer the appealed date; otherwise today.
    const targetDate = appeal.date ? getUTCMidnight(appeal.date) : getUTCMidnight();
    const activeTermId = await getActiveTermId();

    // Resolve which subject(s) to correct: the appealed subject if set and the
    // student is enrolled this term; otherwise all subjects the student is
    // enrolled in this term (so a whole-day absence appeal fixes the day).
    let subjectIds: string[] = [];
    if (appeal.subjectId) {
      const enrolled = await prisma.studentSubject.findFirst({
        where: { studentId: appeal.studentId, subjectId: appeal.subjectId, termId: activeTermId },
        select: { subjectId: true },
      });
      if (enrolled) subjectIds = [enrolled.subjectId];
    } else {
      const enrollments = await prisma.studentSubject.findMany({
        where: { studentId: appeal.studentId, termId: activeTermId },
        select: { subjectId: true },
      });
      subjectIds = enrollments.map((e) => e.subjectId);
    }

    for (const subjectId of subjectIds) {
      const attendance = await prisma.attendance.upsert({
        where: {
          studentId_date_subjectId: { studentId: appeal.studentId, date: targetDate, subjectId },
        },
        update: { status: "PRESENT", updatedAt: new Date(), termId: activeTermId },
        create: { studentId: appeal.studentId, date: targetDate, subjectId, status: "PRESENT", termId: activeTermId },
      });
      // Keep the attendance audit trail complete for appeal-driven changes.
      await prisma.attendanceAudit.create({
        data: {
          attendanceId: attendance.id,
          changedBy: (session.user as any).id,
          newStatus: "PRESENT",
          reason: "Appeal approved",
        },
      });
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
