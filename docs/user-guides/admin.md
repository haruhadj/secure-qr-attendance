# Admin Guide

Admins have full control over the system. After logging in as an admin you land
on **`/admin/dashboard`**.

## Dashboard

The dashboard shows at-a-glance statistics and recent activity:

- **Totals** — students, teachers, and sections.
- **Today's attendance rate** — percent of students marked PRESENT today.
- **Pending appeals** — how many appeals await review.
- **Recent activity** — the latest entries from the audit log.
- **System settings** — edit the attendance time-lock (see below).
- **Data Management card** — export a backup or reset all data (see below).

## Managing the masterlist

Go to **Admin → Masterlist**. From here you manage the three building blocks of
the system.

### Sections
Create, rename, remove, and assign an adviser to a section. A section cannot be
deleted while it still has enrolled students.

### Subjects
Create, edit, and remove subjects (code, name, units, schedule, teacher). A
subject cannot be deleted while it has enrollments or attendance records.

### Students
Add, edit, and remove students, and manage each student's **subject
enrollments**. You can also:

- **Reset a student's password** to a temporary value.
- **Regenerate a student's QR token** if their code is lost or compromised.
- **Edit or clear attendance** for any student (admins bypass the time-lock).

::: tip New student defaults
When you add a student manually, their **initial password is their student ID**,
and a QR token is generated automatically.
:::

## Bulk import (CSV)

The fastest way to populate the system is a CSV import. Go to
**Admin → Masterlist → Import Masterlist**, upload your file, review the preview,
and confirm. The importer auto-creates sections, subjects, teachers, students,
and enrollments, and handles duplicates gracefully.

Full column spec and rules: [Masterlist CSV Import](/features/masterlist-import).

## Managing staff

Go to **Admin → Staff** to add or remove teachers and admins and to reset their
passwords.

- New **teachers** get the default password `teacher123`.
- New **admins** get the default password `password123`.
- **Guardrails:** you cannot remove yourself, and you cannot remove the last
  admin. Removing a teacher unassigns them from their sections and subjects
  first.

## System settings

On the dashboard, the **attendance time-lock** (`attendance_lock_hours`) controls
how old an attendance record can be before **teachers** are blocked from editing
it. Default is **24** hours. Set it to `0` for no lock. Admins are never blocked.

## Audit log

Go to **Admin → Audit** to browse the system-wide activity log — every scan,
edit, import, staff change, and setting update, with the acting user and a
timestamp. See [Audit & Activity Logging](/features/audit-logging).

## Data management

The **Data Management** card on the dashboard provides two tools:

- **Export Backup (.json)** — download a full snapshot of all data (excluding
  passwords). Runs entirely in the browser.
- **Reset All Data** — delete all operational data (students, teachers,
  sections, subjects, attendance, appeals, logs) while **preserving admin
  accounts and settings**. Requires typing `RESET` to confirm.

Details and exactly what's included/excluded:
[Data Management](/features/data-management).
