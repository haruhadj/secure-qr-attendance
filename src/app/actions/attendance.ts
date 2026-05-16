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
  sectionId: string,
  newStatus: AttendanceStatus,
  oldStatus?: AttendanceStatus,
  customDate?: Date
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === UserRole.STUDENT) {
    throw new Error("Unauthorized");
  }

  const targetDate = getUTCMidnight(customDate || new Date());

  // Time-lock: Disable manual edits for attendance older than X hours
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "attendance_lock_hours" },
  });
  // Default to 24 hours if not set
  const lockHours = setting ? parseInt(setting.value, 10) : 24;

  const now = new Date();
  const diffInHours = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
  
  // Allow admins to bypass lock, or if it's within the lock period
  // 0 means unlimited
  if ((session.user as any).role !== UserRole.ADMIN && lockHours > 0 && diffInHours > lockHours) {
    const days = Math.floor(lockHours / 24);
    const hours = lockHours % 24;
    
    let timeStr = "";
    if (days > 0) {
      timeStr += `${days} day${days > 1 ? "s" : ""}`;
    }
    if (hours > 0) {
      if (timeStr) timeStr += " and ";
      timeStr += `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    if (!timeStr) timeStr = "0 hours"; // Should not happen if lockHours > 0

    throw new Error(`Edits are locked for attendance older than ${timeStr}.`);
  }

  let result;
  try {
  result = await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.upsert({
      where: {
        studentId_date_sectionId: {
          studentId,
          date: targetDate,
          sectionId,
        },
      },
      update: {
        status: newStatus,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        date: targetDate,
        sectionId,
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
  } catch (err) {
    console.error("[updateAttendance] Transaction failed:", err);
    throw err;
  }

  await logActivity("ATTENDANCE_EDIT", `Updated attendance status for student ${studentId}`, {
    studentId,
    sectionId,
    oldStatus,
    newStatus,
    date: targetDate
  });

  revalidatePath("/teacher/roster");
  revalidatePath("/admin/audit");
  revalidatePath("/student/dashboard");
  return result;
}

// ... (skipping getAuditLogs)

export async function scanQrAttendance(qrToken: string, sectionId: string) {
  // ... (authorization logic)
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    throw new Error("Unauthorized — only teachers can scan.");
  }

  // 1. Find student by qrToken
  const student = await prisma.student.findUnique({
    where: { qrToken },
    include: {
      user: true,
      section: { include: { teacher: true } },
    },
  });

  if (!student) {
    return { success: false, message: "Invalid QR code — student not found." };
  }

  if (!student.section) {
    return { success: false, message: `${student.user.name} has no assigned section.` };
  }

  if (student.sectionId !== sectionId) {
    return { success: false, message: `${student.user.name} does not belong to the selected section.` };
  }

  // 2. Verify teacher owns this section
  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
  });

  if (!teacher || student.section.teacherId !== teacher.id) {
    return {
      success: false,
      message: `${student.user.name} is not in your section (${student.section.name}).`,
    };
  }

  // 3. Check if already marked today
  const today = getUTCMidnight();

  const existing = await prisma.attendance.findUnique({
    where: {
      studentId_date_sectionId: {
        studentId: student.id,
        date: today,
        sectionId: student.section.id,
      },
    },
  });

  if (existing && existing.status === "PRESENT") {
    return {
      success: false,
      message: `${student.user.name} is already marked PRESENT today.`,
      alreadyPresent: true,
    };
  }

  // 4. Mark as PRESENT via transaction + audit log
  const oldStatus = existing?.status || null;

  await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.upsert({
      where: {
        studentId_date_sectionId: {
          studentId: student.id,
          date: today,
          sectionId: student.section!.id,
        },
      },
      update: { status: "PRESENT", updatedAt: new Date() },
      create: {
        studentId: student.id,
        date: today,
        sectionId: student.section!.id,
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
    sectionId: student.section!.id,
    sectionName: student.section!.name
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
  };
}
