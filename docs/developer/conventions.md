# Conventions & Utilities

Patterns to follow when extending the codebase, plus the shared helpers in
`src/lib/`.

## Coding conventions

**1. All mutations are Server Actions.** Put database writes in
`src/app/actions/`, in a file starting with `"use server";`.

**2. Authorize first.** Call `getServerSession(authOptions)` and verify the role
before any work. Admin-only actions use the `requireAdmin()` helper pattern.

**3. Use transactions for multi-step writes.** Wrap related writes (especially an
attendance change + its `AttendanceAudit` row) in `prisma.$transaction()` so they
commit or fail together.

**4. Always audit.** Call `logActivity(type, description, metadata?)` after a
successful mutation. Add new event types to the `ActivityType` union in
`src/lib/audit.ts`.

**5. Revalidate.** Call `revalidatePath()` for every route whose data changed so
the UI reflects the new state.

**6. Return `{ success, message }`.** User-facing mutations return this shape so
the client can show a `sonner` toast. (Some low-level actions `throw` on
unauthorized access instead.)

**7. Normalise attendance dates.** Always key attendance on
`getUTCMidnight(date)`; never store a raw local timestamp as the day.

**8. Hash passwords.** New accounts use `bcrypt.hashSync(password, 10)`. Never
store plaintext.

**9. QR tokens are UUIDs.** Generate with `crypto.randomUUID()`; regenerating one
revokes the old code.

**10. Section/subject scoping.** Teacher operations must be limited to the
sections/subjects they own (e.g. verify `subject.teacherId === teacher.id`).

## `src/lib/` utilities

### `prisma.ts`
A singleton `PrismaClient` (avoids exhausting connections during hot reload).
Import it everywhere as `import { prisma } from "@/src/lib/prisma"`.

### `auth.ts`
NextAuth config: Credentials provider, JWT strategy (8-hour `maxAge`), the
in-memory login rate limiter, and the `jwt`/`session`/`redirect` callbacks.

### `audit.ts`
`logActivity()` and the `ActivityType` union. Fail-safe: logging errors are
swallowed so they don't break the main action.

### `csvParser.ts`
`parseMasterlistCSV(text)` → `ParsedMasterlist` (sections, subjects, students,
errors). Handles quoted fields, deduplication, and schedule-day expansion. Feeds
`importMasterlist()`.

### `date.ts`
- `getUTCMidnight(date?)` — normalise a date to `00:00 UTC`.
- `parseUTCDate("YYYY-MM-DD")` — parse a date string to UTC midnight.
- `formatTime` / `formatDate` / `formatDateTime` — display formatting in the
  `Asia/Manila` timezone.

### `email.ts`
Resend-based email helper (optional; used by password-reset support).

### `utils.ts`
`cn(...)` — merge Tailwind class names (`clsx` + `tailwind-merge`).

## Path alias

Imports use the `@/*` alias mapping to the project root (see `tsconfig.json`), so
application modules are referenced as `@/src/...`.

## Extending: a checklist

When adding a new feature that writes data:

- [ ] New action in `src/app/actions/`, `"use server";` at top
- [ ] Session + role check at the start
- [ ] `prisma.$transaction()` if more than one write
- [ ] Write an audit/`AttendanceAudit` row if attendance is involved
- [ ] `logActivity()` with a new `ActivityType` if needed
- [ ] `revalidatePath()` for affected routes
- [ ] Return `{ success, message }`
- [ ] UI shows a toast based on the result
