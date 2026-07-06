# Model Reference

Every model from `prisma/schema.prisma`. IDs are CUIDs
(`@default(cuid())`) unless noted. "UK" = unique.

## Enums

```prisma
enum UserRole        { ADMIN  TEACHER  STUDENT }
enum AttendanceStatus { PRESENT  ABSENT  LATE }
```

Appeal status is a plain `String` (`"PENDING"`, `"APPROVED"`, `"REJECTED"`), not
a Prisma enum, defaulting to `"PENDING"`.

## `User`

The base account for every person in the system.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `name` | String? | Display name. |
| `email` | String? **UK** | Login identifier. Optional — imported students may have none. |
| `username` | String? **UK** | Alternate login handle, lowercase (e.g. `michaelfernandez`). Auto-derived from the name for students. |
| `password` | String? | bcrypt hash (cost 10). |
| `role` | `UserRole` | Defaults to `STUDENT`. |
| `image`, `emailVerified` | | NextAuth adapter fields. |
| relations | | `student?`, `teacher?`, `accounts[]`, `sessions[]`, `activityLogs[]`. |

## `Teacher`

Teacher profile, 1:1 with a `User`.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `userId` | String **UK**, FK → User | |
| relations | | `sections[]` (as adviser), `subjects[]` (as instructor). |

## `Student`

Student profile, 1:1 with a `User`.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | Internal DB id. |
| `studentId` | String **UK** | School ID, e.g. `2022-0001`. Also the initial password. |
| `qrToken` | String **UK** | UUID (`@default(uuid())`) encoded in the QR code. |
| `userId` | String **UK**, FK → User | |
| `sectionId` | String? FK → Section | Nullable. |
| relations | | `attendances[]`, `appeals[]`, `enrolledSubjects[]`. |

## `Section`

A class/homeroom grouping.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `name` | String **UK** | e.g. `BSCS 3rd Year`. |
| `teacherId` | String? FK → Teacher | Adviser; nullable. |
| relations | | `students[]`. |

## `Subject`

A course. Attendance is recorded per subject.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `code` | String **UK** | e.g. `OS101`. |
| `name` | String | e.g. `Operating Systems`. |
| `units` | Int? | |
| `scheduleDay` | String? | e.g. `Mon,Wed,Fri`. |
| `scheduleTime` | String? | e.g. `08:00-09:30`. |
| `teacherId` | String? FK → Teacher | Instructor; nullable. |
| relations | | `enrollments[]`, `attendances[]`. |

## `StudentSubject`

Enrollment join table (many-to-many between Student and Subject).

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `studentId` | String FK | |
| `subjectId` | String FK | |
| constraint | | `@@unique([studentId, subjectId])`. |

## `Attendance`

One attendance record per student, per subject, per day.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `date` | DateTime | Normalised to UTC midnight. |
| `status` | `AttendanceStatus` | PRESENT / ABSENT / LATE. |
| `studentId` | String FK | |
| `subjectId` | String FK | |
| `updatedAt` | DateTime | `@updatedAt`. |
| constraint | | `@@unique([studentId, date, subjectId])`. |

## `AttendanceAudit`

Append-only history of attendance changes. Never updated or deleted in normal
operation (only wiped by a full data reset).

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `attendanceId` | String | The record that changed. |
| `changedBy` | String | User id who made the change. |
| `oldStatus` | `AttendanceStatus?` | Null if newly created. |
| `newStatus` | `AttendanceStatus` | |
| `timestamp` | DateTime | |
| `reason` | String? | e.g. `"QR Scan"`. |

## `Appeal`

A student's request to correct/contest attendance.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `studentId` | String FK | |
| `imageUrl` | String? | Optional proof image (schema supports it). |
| `description` | String | The written appeal. |
| `status` | String | `PENDING` (default) / `APPROVED` / `REJECTED`. |
| `reviewedBy` | String? | Reviewer's user id. |
| `reviewedAt` | DateTime? | |
| `createdAt` | DateTime | |

## `SystemSetting`

Key–value configuration store.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `key` | String **UK** | e.g. `attendance_lock_hours`. |
| `value` | String | Stored as text. |
| `description` | String? | |
| `updatedAt` | DateTime | `@updatedAt`. |

## `ActivityLog`

System-wide activity feed written by `logActivity()`.

| Field | Type | Notes |
|---|---|---|
| `id` | String PK | |
| `type` | String | One of the `ActivityType` values — see [Audit Logging](/features/audit-logging). |
| `description` | String | Human-readable summary. |
| `userId` | String FK → User | Actor. |
| `metadata` | Json? | Structured context. |
| `createdAt` | DateTime | |

## NextAuth adapter tables

`Account`, `Session`, and `VerificationToken` are standard NextAuth/Prisma
adapter tables. With the JWT session strategy, `Session` is largely unused for
auth; `VerificationToken` backs password-reset tokens.
