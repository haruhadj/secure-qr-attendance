# Security & Readiness Audit — Secure QR Attendance System

**Date:** 2026-07-02
**Scope:** Full review of auth, middleware, all server actions, upload endpoint, and UI data flows.
**Context:** Pre-pilot review before real students/teachers and thesis final defense.

---

## Overall Verdict

The system is **feature-complete and well-engineered**: clean App-Router architecture,
Prisma transactions, activity/audit logging, role-based middleware, JWT re-validation
against the DB, a configurable attendance time-lock, and a working password-reset flow.
As an engineering artifact it is defense-worthy.

**However, it is NOT yet safe to pilot with real student data.** There are several
authorization gaps that let one teacher tamper with another class's records, plus a
timezone bug that misdates early-morning attendance. All are small, contained fixes.

**Recommendation:** Fix the HIGH + MEDIUM items before any real-student test. The LOW
items are pre-launch hygiene.

---

## Findings (prioritized)

### 🔴 HIGH — A teacher can edit *any* student's attendance in *any* subject
- **File:** `src/app/actions/attendance.ts:12` — `updateAttendance` (the manual roster toggle)
- **Problem:** Authorization only checks `role !== STUDENT`. It never verifies that the
  logged-in teacher owns `subjectId`, nor that the student is enrolled in it. Server
  Actions are directly invocable HTTP endpoints, so any authenticated teacher can modify
  another teacher's class records.
- **Why it matters:** Attendance integrity is the entire point of the system; this
  contradicts your own documented Rule #10 ("section-scoped operations"). A defense panel
  will ask exactly this.
- **Note:** `scanQrAttendance` (`attendance.ts:122`) *does* verify ownership correctly —
  only the manual path is missing the check.
- **Fix:** Load the teacher from the session, confirm `subject.teacherId === teacher.id`
  and that a `studentSubject` enrollment exists, before the upsert — mirror the logic
  already in `scanQrAttendance`.

### 🟠 MEDIUM — `reviewAppeal` has no ownership check
- **File:** `src/app/actions/appeals.ts:63`
- **Problem:** Any teacher (or admin) can approve/reject *any* appeal by id.
  `getTeacherAppeals` filters correctly for display, but the mutation doesn't re-check, so
  a teacher can act on appeals belonging to another teacher's students.
- **Secondary issue:** On approval it marks the student PRESENT in an arbitrary "first
  enrolled subject" (`appeals.ts:101`), which may not be the relevant class/date.
- **Fix:** Verify the appeal's student is enrolled in one of the reviewing teacher's
  subjects (admins exempt). Consider tying the PRESENT mark to a specific subject/date.

### 🟠 MEDIUM — Early-morning attendance is recorded on the wrong calendar day
- **File:** `src/lib/date.ts:19` — `getUTCMidnight()`
- **Problem:** Attendance is bucketed by **UTC** day, but the school is in Manila (UTC+8).
  Any class before **8:00 AM Manila** maps to the *previous* calendar day. Philippine first
  period (~7:30 AM) will appear under the wrong date in history and reports. Classes from
  8:00 AM onward are unaffected.
- **Fix:** Normalize the "attendance day" in Asia/Manila (compute the local calendar date,
  then store its midnight) instead of raw UTC midnight. Apply consistently across
  `scanQrAttendance`, `updateAttendance`, dashboards, and reports.

### 🟠 MEDIUM — `submitAppeal` IDOR (student can appeal as another student)
- **File:** `src/app/actions/appeals.ts:11`
- **Problem:** `studentId` is taken from the client and only the role is checked. A student
  can submit an appeal on behalf of another student by passing their DB id.
- **Fix:** Ignore the client `studentId`; look up the student from
  `session.user.id` and use that.

### 🟠 MEDIUM — `/api/upload` is insecure and appears orphaned
- **File:** `src/app/api/upload/route.ts`
- **Problems:**
  - File type validated via **client-controlled** `file.type`.
  - Extension taken from the user's filename unfiltered (`path.extname`), so a `.html` /
    `.svg` can be written into `/public/uploads/` and served same-origin → **stored XSS**.
  - Any authenticated user (including students) can upload 5 MB files → storage abuse.
  - `AppealForm.tsx` has **no file input**, so nothing currently calls this endpoint.
  - On Vercel the runtime filesystem is read-only, so writes would fail in production anyway.
- **Fix:** Delete the route (simplest, since it's unused), or if you plan to add proof
  images: validate by sniffing magic bytes, force a safe extension from an allowlist,
  restrict to appropriate roles, and store on a proper object store (not `/public`).

### 🟡 LOW — Demo/seed accounts with known passwords
- **Files:** `prisma/seed.ts`, `src/app/admin/dashboard/DemoAccountsCard.tsx`
- **Problem:** Seed creates and the dashboard advertises `admin@school.com / password123`
  (plus teacher/student demos). If the seed ever runs against the real database, it's a
  trivial full-admin compromise.
- **Fix:** Remove the demo card and seed accounts (or force-rotate their passwords) before
  real deployment; keep the seed for local dev only.

### 🟡 LOW — Login rate limiter is weak
- **File:** `src/lib/auth.ts:9`
- **Problems:** In-memory (resets on serverless cold start, per-instance) and keyed by
  **email, not IP** despite the comment. It does little against distributed spraying but
  *does* let an attacker lock a specific account out for 15 minutes (targeted DoS).
- **Fix:** Back it with the database/Redis, key on IP (or IP+email), and prefer delay/
  backoff over hard lockout to avoid weaponized lockouts.

### 🟡 LOW — Weak default password policy
- **Files:** `src/app/actions/masterlist.ts` (student password = student ID),
  `src/app/student/dashboard/page.tsx:317` (student ID shown as "Physical ID Fallback")
- **Problem:** A student's password defaults to their student ID, which is printed on their
  own dashboard and physical card. Anyone who sees it can log in as that student until they
  change it. No forced first-login reset.
- **Fix:** Require a password change on first login; consider a random initial password
  distributed out-of-band.

---

## Notes

- I could not run a full `pnpm build` in the review environment because dependencies were
  not installed. The `tsc` errors observed were all "cannot find module" (missing
  `node_modules`), i.e. environmental — not real code defects.
- Things done well and worth calling out in the defense: DB-side JWT re-validation for
  removed/role-changed users (`auth.ts:96`), immutable `AttendanceAudit` history,
  transactional multi-step writes, admin-only destructive actions with "last admin"
  protection, and generic password-reset responses that avoid account enumeration.

## Suggested fix order before real-student testing
1. HIGH — ownership check in `updateAttendance`.
2. MEDIUM — ownership check in `reviewAppeal`.
3. MEDIUM — Manila timezone in `getUTCMidnight` / attendance day.
4. MEDIUM — derive `studentId` from session in `submitAppeal`.
5. MEDIUM — delete or secure `/api/upload`.
6. LOW — remove demo accounts/card; harden rate limiter; forced password change.
