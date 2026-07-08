"use server";

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/src/lib/email";
import { normalizeUsername, normalizeEmail } from "@/src/lib/username";
import { isRateLimited, recordAttempt } from "@/src/lib/rate-limit";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

// Password-reset throttle: max 5 requests per email per hour. Prevents
// email-bombing a user and exhausting the Resend quota.
const RESET_MAX = 5;
const RESET_WINDOW_MS = 60 * 60 * 1000;

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, message: "Not authenticated." };

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.password) return { success: false, message: "User not found." };

  const bcrypt = require("bcryptjs");
  const isValid = bcrypt.compareSync(currentPassword, user.password);
  if (!isValid) return { success: false, message: "Current password is incorrect." };

  if (newPassword.length < 8) {
    return { success: false, message: "New password must be at least 8 characters." };
  }

  if (bcrypt.compareSync(newPassword, user.password)) {
    return { success: false, message: "New password must be different from your current one." };
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, mustChangePassword: false },
  });

  return { success: true, message: "Password changed successfully." };
}

export async function changeOwnUsername(newUsername: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, message: "Not authenticated." };

  const userId = (session.user as any).id;

  const username = normalizeUsername(newUsername);
  if (!username) {
    return { success: false, message: "Username must contain letters or numbers." };
  }

  const existing = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
    select: { id: true },
  });
  if (existing) {
    return { success: false, message: "That username is already taken." };
  }

  await prisma.user.update({ where: { id: userId }, data: { username } });

  return { success: true, message: `Username updated to "${username}".`, username };
}

export async function changeOwnEmail(newEmail: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, message: "Not authenticated." };

  const userId = (session.user as any).id;

  const email = normalizeEmail(newEmail);
  if (!email) {
    return { success: false, message: "Please enter an email address." };
  }
  // Basic shape check — a real address for password-reset delivery.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (existing) {
    return { success: false, message: "That email is already in use by another account." };
  }

  await prisma.user.update({ where: { id: userId }, data: { email } });

  return { success: true, message: `Email saved as "${email}".`, email };
}

export async function requestPasswordReset(rawEmail: string) {
  const email = normalizeEmail(rawEmail);

  // Generic, enumeration-safe response reused for every early return.
  const generic = { success: true as const, message: "If that email exists, a reset link has been sent." };

  if (!email) return generic;

  // Throttle per email. Return the generic message when limited so the endpoint
  // never reveals whether the address exists.
  const rlKey = `pwreset:${email}`;
  if (await isRateLimited(rlKey, RESET_MAX)) return generic;
  await recordAttempt(rlKey, RESET_WINDOW_MS);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return generic;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  try {
    await sendPasswordResetEmail(email, user.name || "User", token);
  } catch (err: any) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    const msg = err?.message?.includes("not configured")
      ? "Email service is not configured. Contact your administrator."
      : "Failed to send reset email. Please try again later.";
    return { success: false, message: msg };
  }

  return { success: true, message: "If that email exists, a reset link has been sent." };
}

export async function consumePasswordReset(token: string, newPassword: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) return { success: false, message: "Invalid or expired reset link." };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false, message: "This reset link has expired. Please request a new one." };
  }

  if (newPassword.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } });
  if (!user) return { success: false, message: "User not found." };

  const bcrypt = require("bcryptjs");
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, mustChangePassword: false },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true, message: "Password reset successfully. You can now sign in." };
}
