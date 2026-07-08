# Production Handoff & Deployment Guide

This document is for whoever operates the Secure QR Attendance system in production. It covers the
one-time deployment on **Vercel + Neon Postgres**, the secrets that must be set (and rotated at
handoff), and how the database is versioned. Routine day-to-day operations (backups, new school year,
troubleshooting) live in the in-app docs under `docs/`.

---

## 1. Secrets — rotate these at handoff

The original developer's `.env` contained live credentials. **Before going live, generate fresh values
and give the client only the new ones.** Never commit `.env` (only `.env.example` is tracked).

| Variable | What it is | How to rotate |
|---|---|---|
| `NEXTAUTH_SECRET` | Signs login sessions (JWT) | `openssl rand -base64 32` — set a brand-new value |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon Postgres connection | Reset the role password in the Neon console, update both URLs |
| `RESEND_API_KEY` | Sends password-reset email | Revoke the old key in Resend, create a new one |
| `RESEND_FROM_EMAIL` | Verified sender address | Use the client's verified domain sender |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (appeal images) | Auto-provided by Vercel; create the Blob store under Storage → Blob |
| `CRON_SECRET` | Protects the scheduled-backup route | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public app URL | Set to the production domain (e.g. `https://attendance.school.edu`) |

Set every variable in **Vercel → Project → Settings → Environment Variables** (Production scope).

---

## 2. Database — versioned migrations (no more `db push`)

The schema is now managed with **Prisma Migrate** instead of `prisma db push`, so every change is
versioned and reproducible.

- **Fresh database:** `prisma migrate deploy` creates the entire schema from `prisma/migrations/`.
- **Existing database already created via `db push`** (the current live DB): adopt migrations once by
  telling Prisma the baseline is already applied — this does **not** alter any data:

  ```bash
  # Point DATABASE_URL at the existing DB, then:
  pnpm exec prisma migrate resolve --applied 0_init
  ```

  After that, `pnpm db:migrate` (= `prisma migrate deploy`) applies any future migrations normally.

The Vercel **build command** (`vercel.json`) runs `prisma generate && prisma migrate deploy && next build`,
so migrations ship automatically on every deploy.

To create a new migration during development: `pnpm db:migrate:dev` (`prisma migrate dev`).

---

## 3. First launch

1. Deploy to Vercel with all env vars set (section 1) and a Blob store created.
2. The build applies migrations automatically. If you started from an existing `db push` database, run the
   one-time `migrate resolve` above first.
3. Open the app — with no admin yet, it routes to **`/setup`** to create the first administrator account.
   (There is no built-in default password in production.)
4. Configure the first **School Year / Term**, then import the student masterlist (Admin → Masterlist → Import CSV).

---

## 4. Recovery at a glance

- **Database:** Neon keeps automated backups with point-in-time restore — restore from the Neon console.
- **In-app backup:** Admin → Dashboard → Data Management → *Export Backup (.json)*, and a matching
  *Restore* button. A scheduled backup also runs weekly to Vercel Blob (`/api/cron/backup`).
- **Health:** `GET /api/health` returns OK when the app and database are reachable — point a free uptime
  monitor (e.g. UptimeRobot) at it to be alerted of outages.

See `docs/` (the VitePress site) for the plain-language operator runbook and troubleshooting.
