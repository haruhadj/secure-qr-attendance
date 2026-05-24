"use server";

import { prisma } from "@/src/lib/prisma";
import { AttendanceStatus, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/src/lib/audit";

import { getUTCMidnight } from "@/src/lib/date";

export async function updateAttendance(
  studentId: string,
  subjectId: string,
  newStatus: AttendanceStatus,
  oldStatus?: AttendanceStatus,
  customDate?: Date
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === UserRole.STUDENT) {
    return { error: "Unauthorized" };
  }

  const targetDate = getUTCMidnight(customDate || new Date());

  // Time-lock: Disable manual edits for attendance older than X hours
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "attendance_lock_hours" },
  });
  const lockHours = setting ? parseInt(setting.value, 10) : 24;

  const now = new Date();
  const diffInHours = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);

  if ((session.user as any).role !== UserRole.ADMIN && lockHours > 0 && diffInHours > lockHours) {
    const days = Math.floor(lockHours / 24);
    const hours = lockHours % 24;
    let timeStr = "";
    if (days > 0) timeStr += `${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) { if (timeStr) timeStr += " and "; timeStr += `${hours} hour${hours > 1 ? "s" : ""}`; }
    if (!timeStr) timeStr = "0 hours";
    return { error: `Edits are locked for attendance older than ${timeStr}.` };
  }

  const result = await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.upsert({
      where: {
        studentId_date_subjectId: {
          studentId,
          date: targetDate,
          subjectId,
        },
      },
      update: {
        status: newStatus,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        date: targetDate,
        subjectId,
        status: newStatus,
      },
    });

    await tx.attendanceAudit.create({
      data: {
        attendanceId: attendance.id,
        changedBy: (session.user as any).id,
        oldStatus: oldStatus || null,
        newStatus,
        timestamp: new Date(),
      },
    });

    return attendance;
  });

  await logActivity("ATTENDANCE_EDIT", `Updated attendance status for student ${studentId}`, {
    studentId,
    subjectId,
    oldStatus,
    newStatus,
    date: targetDate,
  });

  revalidatePath("/teacher/roster");
  revalidatePath("/admin/audit");
  revalidatePath("/student/dashboard");
  return { success: true, data: result };
}

export async function scanQrAttendance(qrToken: string, subjectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    throw new Error("Unauthorized — only teachers can scan.");
  }

  // 1. Find student by qrToken
  const student = await prisma.student.findUnique({
    where: { qrToken },
    include: { user: true },
  });

  if (!student) {
    return { success: false, message: "Invalid QR code — student not found." };
  }

  // 2. Verify subject exists and belongs to this teacher
  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
  });

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    return { success: false, message: "Subject not found." };
  }

  if (!teacher || subject.teacherId !== teacher.id) {
    return { success: false, message: `You are not the teacher for ${subject.name}.`, subjectCode: subject.code };
  }

  // 3. Verify student is enrolled in this subject
  const enrollment = await prisma.studentSubject.findUnique({
    where: { studentId_subjectId: { studentId: student.id, subjectId } },
  });

  if (!enrollment) {
    return {
      success: false,
      message: `${student.user.name} is not enrolled in ${subject.name}.`,
      subjectCode: subject.code,
    };
  }

  // 4. Check if already marked today
  const today = getUTCMidnight();

  const existing = await prisma.attendance.findUnique({
    where: {
      studentId_date_subjectId: {
        studentId: student.id,
        date: today,
        subjectId,
      },
    },
  });

  if (existing && existing.status === "PRESENT") {
    return {
      success: false,
      message: `${student.user.name} is already marked PRESENT today.`,
      alreadyPresent: true,
      subjectCode: subject.code,
    };
  }

  // 5. Mark as PRESENT via transaction + audit log
  const oldStatus = existing?.status || null;

  await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.upsert({
      where: {
        studentId_date_subjectId: {
          studentId: student.id,
          date: today,
          subjectId,
        },
      },
      update: { status: "PRESENT", updatedAt: new Date() },
      create: {
        studentId: student.id,
        date: today,
        subjectId,
        status: "PRESENT",
      },
    });

    await tx.attendanceAudit.create({
      data: {
        attendanceId: attendance.id,
        changedBy: (session.user as any).id,
        oldStatus,
        newStatus: "PRESENT",
        reason: "QR Scan",
        timestamp: new Date(),
      },
    });
  });

  await logActivity("ATTENDANCE_SCAN", `QR Scan: ${student.user.name} marked PRESENT`, {
    studentId: student.id,
    studentName: student.user.name,
    subjectId,
    subjectName: subject.name,
  });

  revalidatePath("/teacher/roster");
  revalidatePath("/teacher/scanner");
  revalidatePath("/admin/audit");
  revalidatePath("/student/dashboard");

  return {
    success: true,
    message: `✓ ${student.user.name} (${student.studentId}) marked PRESENT`,
    studentName: student.user.name,
    studentId: student.studentId,
    subjectCode: subject.code,
    subjectName: subject.name,
  };
}
