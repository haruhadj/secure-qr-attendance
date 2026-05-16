/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export type ActivityType = 
  | "ATTENDANCE_EDIT" 
  | "ATTENDANCE_SCAN"
  | "ATTENDANCE_ADMIN_EDIT"
  | "ATTENDANCE_DELETE"
  | "STAFF_ADD" 
  | "STAFF_REMOVE" 
  | "STUDENT_ADD" 
  | "STUDENT_REMOVE" 
  | "STUDENT_UPDATE"
  | "STUDENT_PASSWORD_RESET"
  | "STUDENT_QR_REGEN"
  | "SECTION_ADD" 
  | "SECTION_REMOVE" 
  | "SECTION_UPDATE" 
  | "SETTING_UPDATE" 
  | "APPEAL_REVIEW"
  | "MASTERLIST_IMPORT";

/**
 * Logs a system activity to the ActivityLog table.
 * This is designed to be called from Server Actions.
 */
export async function logActivity(
  type: ActivityType,
  description: string,
  metadata?: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return;

    await prisma.activityLog.create({
      data: {
        type,
        description,
        userId: (session.user as any).id,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // We don't want to fail the main action if logging fails
  }
}
