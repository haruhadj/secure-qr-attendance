# Server Actions

Almost all database operations are implemented as **Next.js Server Actions** in
`src/app/actions/`, each file beginning with `"use server";`. Every action
verifies the session and role before doing any work, and most mutations return a
`{ success: boolean; message: string }` object.

::: info Read vs. write
Read helpers (e.g. `getMasterlist`, `getAdminDashboardStats`) also live here and
enforce authorization the same way; they return data instead of a
`{ success, message }` result.
:::

## `attendance.ts`

| Action | Auth | Purpose |
|---|---|---|
| `updateAttendance(studentId, subjectId, newStatus, oldStatus?, customDate?)` | Any non-student | Manual toggle. Enforces the **time-lock** for non-admins; upserts attendance + writes `AttendanceAudit`. |
| `scanQrAttendance(qrToken, subjectId)` | TEACHER | The QR scan path. Validates student → subject ownership → enrollment → not-already-present, then marks `PRESENT`. See [QR Attendance Flow](/features/qr-attendance). |

## `masterlist.ts`

Reads: `getMasterlist`, `getSectionMasterlist`, `getSubjectMasterlist`,
`getAttendanceRange` (export; teachers limited to their own subjects).

Writes (all **ADMIN** unless noted):

| Action | Purpose |
|---|---|
| `addStudent` / `updateStudent` / `removeStudent` | Student CRUD (creates/deletes the linked `User`). |
| `addSection` / `updateSection` / `removeSection` | Section CRUD (blocks delete if students remain). |
| `addSubject` / `updateSubject` / `removeSubject` | Subject CRUD (blocks delete if enrollments/attendance exist). |
| `enrollStudentInSubject` / `unenrollStudentFromSubject` / `updateStudentEnrollments` | Manage enrollments. |
| `adminUpdateAttendance` / `deleteAttendance` | Admin attendance edits (bypass time-lock; optional exact time). |
| `resetStudentPasswordToTemp` | Set a temporary student password. |
| `regenerateQrToken` | Issue a new QR token (revocation). |
| `importMasterlist(parsed)` | Apply a parsed CSV masterlist. See [CSV Import](/features/masterlist-import). |

## `admin.ts`

All **ADMIN** (via a `requireAdmin()` helper):

| Action | Purpose |
|---|---|
| `getAdminDashboardStats` | Totals, today's attendance rate, pending appeals, recent activity. |
| `getSystemSettings` / `updateSystemSetting` | Read/update settings (creates `attendance_lock_hours` default on first read). |
| `getStaff` / `addStaff` / `removeStaff` | Staff management (guards: no self-removal, no removing last admin). |
| `resetStaffPasswordToTemp` | Set a temporary staff password. |
| `exportAllData` | Build the JSON backup (excludes passwords). |
| `resetAllData` | Destructive reset preserving admins + settings. |

## `appeals.ts`

| Action | Auth | Purpose |
|---|---|---|
| `submitAppeal(studentId, description)` | STUDENT | Create a `PENDING` appeal. |
| `getTeacherAppeals()` | TEACHER | Appeals from students enrolled in the teacher's subjects. |
| `reviewAppeal(appealId, status)` | TEACHER/ADMIN | Approve/reject; approval marks the student PRESENT today. |

## `password.ts`

| Action | Purpose |
|---|---|
| `changeOwnPassword` | Self-service change (verifies current password; min length enforced). |
| `requestPasswordReset` | Issue a reset token (`VerificationToken`, 30-min, single-use). |
| `consumePasswordReset` | Validate the token and set the new password. |

## Standard mutation shape

```ts
"use server";
export async function doSomething(/* args */) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");            // or return { success:false, ... }
  }

  // ...business-rule checks...

  const result = await prisma.$transaction(async (tx) => {
    // writes (+ audit rows where relevant)
  });

  await logActivity("SOME_TYPE", "human-readable description", { /* metadata */ });
  revalidatePath("/affected/route");
  return { success: true, message: "Done." };
}
```

See [Conventions & Utilities](/developer/conventions) for the rules behind this
pattern.
