# Running the App

## Scripts

All scripts are defined in `package.json` and run with `pnpm`:

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server on **port 3000** (hot reload). |
| `pnpm build` | Create an optimized production build. |
| `pnpm start` | Serve the production build on port 3000 (run `pnpm build` first). |
| `pnpm lint` | Run Next.js/ESLint checks. |
| `pnpm db:push` | Push the Prisma schema to the database. |
| `pnpm db:seed` | Seed demo data. |
| `pnpm docs:dev` | Run **this documentation site** locally. |
| `pnpm docs:build` | Build the documentation site. |
| `pnpm docs:preview` | Preview the built documentation site. |

## First run

```bash
pnpm dev
```

Then open <http://localhost:3000>. You'll land on the login page. After signing
in, middleware redirects you to your role's home:

- Admin → `/admin/dashboard`
- Teacher → `/teacher/roster`
- Student → `/student/dashboard`

## Default accounts

These are the **initial** passwords created by the seed script (`pnpm db:seed`).
Everyone should change their password after first login.

| Role | Email | Initial password |
|---|---|---|
| **Admin** | `admin@school.com` | `password123` |
| **Teacher** | `teacher@school.com` | `teacher123` |
| **Student** | `john@student.com` (and `jane@`, `bob@`, `alice@`, `charlie@`) | Their student ID, e.g. `2022-0001` |

::: info Where these defaults come from
- **Seed** — admin `password123`, teacher `teacher123`, students = their student ID.
- **Adding a teacher** via Staff Management → default `teacher123`.
- **Adding/importing a student** → default password is their student ID.

The Demo Accounts card on the admin dashboard shows these **initial defaults
only** — it does not reflect passwords changed later.
:::

## Testing a scan locally

1. Log in as the **student** in one browser (or your phone) and open the
   dashboard to display the QR code.
2. Log in as the **teacher** in another browser, open `/teacher/scanner`,
   pick a subject the student is enrolled in, and scan the QR code.
3. The teacher sees a success toast; the record appears in the roster, the
   student's history, and the admin audit log.

Because the camera requires a secure context, use `localhost` (allowed) or serve
over HTTPS when scanning from a separate device.
