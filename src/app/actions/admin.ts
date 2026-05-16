"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/src/lib/audit";
import { getUTCMidnight } from "@/src/lib/date";

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

export async function getSystemSettings() {
  await requireAdmin();
  const settings = await prisma.systemSetting.findMany();
  
  // Provide defaults if they don't exist yet
  const defaultSettings = [
    { key: "attendance_lock_hours", value: "24", description: "Hours before attendance edits are locked for teachers (0 for unlimited)" },
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
      teacher: { include: { sections: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function addStaff(name: string, email: string, role: UserRole) {
  await requireAdmin();

  if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
    return { success: false, message: "Invalid role specified." };
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

export async function resetStaffPassword(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, message: "User not found." };

  const bcrypt = require("bcryptjs");
  const defaultPassword = user.role === UserRole.TEACHER ? "teacher123" : "password123";
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await logActivity("STUDENT_PASSWORD_RESET", `Admin reset password for ${user.name} (${user.role})`, {
    userId,
    role: user.role,
  });

  revalidatePath("/admin/staff");
  return { success: true, message: `Password reset to default for ${user.name}.` };
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
      // Remove teacher assignments from sections
      await tx.section.updateMany({
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
