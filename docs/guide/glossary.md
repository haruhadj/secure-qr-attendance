# Glossary

Key terms used throughout this documentation and in the codebase.

| Term | Meaning |
|---|---|
| **Admin** | A user with the `ADMIN` role. Full control over the masterlist, staff, settings, audit, and data management. |
| **Teacher** | A user with the `TEACHER` role. Scans QR codes and manages attendance for the subjects they teach. |
| **Student** | A user with the `STUDENT` role. Owns a QR code and can view history and file appeals. |
| **Section** | A class/homeroom grouping of students (e.g. *BSCS 3rd Year*), optionally assigned a teacher as adviser. Name is unique. |
| **Subject** | A course (e.g. *OS101 — Operating Systems*), optionally taught by a teacher, with units and a schedule. Code is unique. Attendance is recorded **per subject**. |
| **Enrollment** | The link between a student and a subject, stored in the `StudentSubject` join table. A student can be enrolled in many subjects. |
| **QR token (`qrToken`)** | A unique, opaque UUID stored on each student record. It is the value encoded in the student's QR code. Regenerating it invalidates the old code. |
| **Attendance record** | One row in the `Attendance` table for a given `(student, date, subject)`, with a status of PRESENT, ABSENT, or LATE. |
| **Attendance status** | `AttendanceStatus` enum: `PRESENT`, `ABSENT`, or `LATE`. |
| **Attendance audit** | An immutable `AttendanceAudit` row capturing who changed an attendance record, its old and new status, when, and why. |
| **Appeal** | A student-submitted request to correct or contest attendance, reviewed by a teacher or admin. Approving an appeal marks the student PRESENT for today. |
| **Activity log** | A system-wide feed (`ActivityLog`) of every mutation, written via `logActivity()`. Powers the admin recent-activity view. |
| **Time-lock** | A rule that prevents teachers (not admins) from editing attendance older than `attendance_lock_hours`. |
| **Masterlist** | The full set of sections, subjects, students, and enrollments — managed manually or imported via CSV. |
| **Server Action** | A Next.js server-side function (marked `"use server"`) that performs an authorised database mutation. This app uses server actions instead of a REST API for most operations. |
| **Time normalisation (UTC midnight)** | Attendance dates are normalised to `00:00 UTC` via `getUTCMidnight()` so the same calendar day is consistent regardless of server timezone. |
| **Adviser** | A teacher assigned to a section (as opposed to a subject teacher). In CSV import, `adviser_name`/`adviser_email` set this relationship. |
