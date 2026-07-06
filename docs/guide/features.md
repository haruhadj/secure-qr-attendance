# Key Features

Features are grouped by the module that owns them. Each role sees only the
modules relevant to it.

## 👨‍🏫 Teacher module

- **QR scanner** — camera-based scanning via `html5-qrcode`, using the rear
  camera, with a short cooldown between scans to prevent accidental duplicates.
- **Subject selection** — the teacher picks which of *their* subjects the scan
  applies to; scans for subjects they don't teach are rejected.
- **Roster with manual toggles** — set a student to Present / Absent / Late by
  hand for a chosen date, subject to the time-lock.
- **Appeal review** — see and act on appeals from students enrolled in their
  subjects.
- **Attendance export** — download a date-range attendance report as CSV for
  their own subjects.

## 🎓 Student module

- **Digital ID / QR code** — a personal QR code rendered from the student's
  `qrToken` (high error-correction level for reliable scanning).
- **Physical ID fallback** — the student ID number is displayed as a fallback
  when a camera scan isn't possible.
- **Attendance history & calendar** — a timeline plus an
  `AttendanceCalendar`/`WeeklyStrip` view of daily status.
- **Appeals** — submit a written appeal to correct or contest an attendance
  record.
- **Change password** — self-service password change (min. 8 characters, current
  password verified).

## 🔑 Admin module

- **Dashboard stats** — total students / teachers / sections, today's attendance
  rate, pending appeals, and a recent-activity feed.
- **Masterlist CRUD** — create, edit, and remove sections, subjects, and
  students, and manage per-student subject enrollments.
- **Staff management** — add or remove admins and teachers, and reset their
  passwords. Guardrails prevent removing yourself or the last admin.
- **CSV bulk import** — import an entire masterlist (sections, subjects,
  teachers, students, enrollments) from one CSV file, with a preview and a
  post-import summary.
- **QR regeneration** — issue a new QR token for a student (the revocation
  mechanism if a code is compromised).
- **System settings** — configure the attendance time-lock window.
- **Audit log** — browse the system-wide `ActivityLog`.
- **Data management** — export a full JSON backup, or reset all operational data
  (with a typed `RESET` confirmation) while preserving admin accounts.

## 🔒 Cross-cutting / platform features

- **Role-based routing** enforced in middleware.
- **Login rate limiting** (max 10 failed attempts per email per 15 minutes).
- **JWT sessions** with an 8-hour lifetime ("one school day").
- **Immutable attendance auditing** via the `AttendanceAudit` table.
- **Activity logging** of every mutation via `logActivity()`.
- **UTC-normalised dates** to prevent timezone-based duplicate records.
- **Upload validation** for appeal proof files (type + 5 MB size limits).
- **Dark / light theme** toggle.

See the [User Guides](/user-guides/admin) for step-by-step walkthroughs and the
[Feature Deep-Dives](/features/qr-attendance) for how each flow works internally.
