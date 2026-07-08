"use server";

import { prisma } from "@/src/lib/prisma";
import { UserRole } from "@prisma/client";
import { normalizeEmail } from "@/src/lib/username";
import { logActivity } from "@/src/lib/audit";

// First-run bootstrap. The system ships with no admin in production; the very
// first administrator is created here. This action self-locks: once any admin
// exists it refuses to run, so it can't be used to mint extra admins later.

export async function isSetupRequired(): Promise<boolean> {
  const admins = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  return admins === 0;
}

export async function createFirstAdmin(name: string, rawEmail: string, password: string) {
  if (!(await isSetupRequired())) {
    return { success: false, message: "Setup has already been completed." };
  }

  const trimmedName = name?.trim();
  const email = normalizeEmail(rawEmail);
  if (!trimmedName) return { success: false, message: "Please enter your name." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (!password || password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }

  const bcrypt = require("bcryptjs");

  // Guard against a race: unique email + a final count check inside a transaction.
  try {
    await prisma.$transaction(async (tx) => {
      const count = await tx.user.count({ where: { role: UserRole.ADMIN } });
      if (count > 0) throw new Error("ALREADY_SETUP");
      await tx.user.create({
        data: {
          name: trimmedName,
          email,
          password: bcrypt.hashSync(password, 10),
          role: UserRole.ADMIN,
          mustChangePassword: false, // they chose this password themselves
        },
      });
    });
  } catch (err: any) {
    if (err?.message === "ALREADY_SETUP") {
      return { success: false, message: "Setup has already been completed." };
    }
    if (err?.code === "P2002") {
      return { success: false, message: "An account with that email already exists." };
    }
    return { success: false, message: "Could not complete setup. Please try again." };
  }

  await logActivity("SETUP_ADMIN", `First administrator account created: ${trimmedName}`, { email });
  return { success: true, message: "Administrator created. You can now sign in." };
}
