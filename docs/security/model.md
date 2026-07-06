# Security Model

This page summarises the security controls in the system. The QR-specific design
has its own page: [QR Token Design](/security/qr-tokens).

## Authentication & sessions

- **Credentials + bcrypt.** Users log in with **email or username** + password;
  passwords are stored only as bcrypt hashes (cost factor 10) and verified with
  `bcrypt.compareSync`.
- **JWT sessions, 8-hour lifetime.** Tokens carry the user's `id` and `role` and
  expire after one school day.
- **Live re-validation.** On refresh, the token's role is re-read from the
  database; deleted users are force-logged-out. See
  [Auth & Access Control](/architecture/auth).

## Authorization (defence in depth)

1. **Middleware** blocks cross-role access to `/admin`, `/teacher`, `/student`
   and requires a token for all non-public routes.
2. **Every server action** re-checks `getServerSession()` and the caller's role
   before mutating — calling an action directly does not bypass authorization.
3. **Resource-scoped checks** go further: teachers can only scan/export subjects
   they own; students cannot edit attendance at all.

## Brute-force protection

An in-memory limiter caps failed logins at **10 per identifier (email or
username) per 15 minutes** (`src/lib/auth.ts`). A successful login resets the
counter.

::: warning Not shared across instances
The limiter is process-local and resets on restart. In a multi-instance
deployment, move it to a shared store. See [Limitations](/thesis/limitations).
:::

## Attendance integrity

- **Immutable audit trail.** Every attendance create/update writes an
  `AttendanceAudit` row **inside the same transaction**, so a change can never
  exist without its audit record.
- **Idempotent scans.** A student already `PRESENT` for the day/subject is
  skipped — repeat scans can't fabricate records.
- **Time-lock.** Non-admin edits to attendance older than
  `attendance_lock_hours` (default 24) are rejected. Admins bypass the lock.
- **UTC normalisation.** Dates are keyed to UTC midnight, preventing
  timezone-driven duplicates.

## File uploads

The upload endpoint (`/api/upload`) used for appeal proof:

- Requires an authenticated session.
- Accepts only `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.
- Rejects files larger than **5 MB**.
- Sanitises the filename (alphanumerics only, truncated) and appends a timestamp
  before writing to `public/uploads/`.

## Data protection

- **Backups exclude passwords.** The JSON export never includes password hashes.
- **Reset guardrails.** A full data reset requires typing `RESET` and preserves
  all admin accounts and system settings. See
  [Data Management](/features/data-management).
- **Staff guardrails.** You cannot remove yourself, and you cannot remove the
  last remaining admin.

## Secrets

`NEXTAUTH_SECRET` and `DATABASE_URL` live only in `.env` (git-ignored). Only
`.env.example` with placeholders is committed. See
[Configuration](/getting-started/configuration).
