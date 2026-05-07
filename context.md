## PROJECT CONTEXT: Secure QR Attendance System

### 1. Project Overview
A web-based attendance monitoring system for schools. Teachers scan student QR codes (or use manual fallbacks) to record attendance. Admins manage the masterlist, staff, sections, and audit everything. Students view their QR, history, and submit appeals.

**Operational model:** "Teacher-as-Scanner" — teachers use their phone camera to scan student QR codes. Fallbacks: Manual roster toggle, Evidence-based appeals.

---

### 2. Tech Stack (Strict — do NOT substitute)
| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 15+** (App Router) | Using `next@^16.2.4`, **NOT** Pages Router |
| Language | **TypeScript** (strict) | |
| Database | **PostgreSQL** via **Prisma ORM** (`@prisma/client@^6.19`) | Schema at `prisma/schema.prisma` |
| Auth | **NextAuth.js v4** (`next-auth@^4.24`) | Credentials provider only, JWT strategy |
| Password Hashing | **bcryptjs** (`^3.0.3`) | `require("bcryptjs")` in server actions |
| QR Scanner | **html5-qrcode** (`^2.3.8`) | Camera-based, supports digital + printed IDs |
| QR Generator | **qrcode.react** (`^4.2.0`) | Student QR display |
| Styling | **Tailwind CSS v4** + **Shadcn/UI** + **Lucide React** | |
| Animations | **Framer Motion** (via `motion/react`) | Login shake, transitions |
| Toasts | **sonner** (`^2.0.7`) | `toast.success()`, `toast.error()` |
| Date Utils | **date-fns** (`^4.1.0`) | Plus custom `src/lib/date.ts` |
| Font | **Inter** (via `next/font/google`) | |
| Package Manager | **pnpm** | |
| **NO FIREBASE** | All data and auth must be PostgreSQL-backed | |

---

### 3. File Architecture

```
src/
├── app/
│   ├── page.tsx                  # Login page (/) — Credentials form + demo account buttons
│   ├── layout.tsx                # Root layout — Providers, Navbar (conditional on auth), Toaster
│   ├── actions/                  # Server Actions (ALL DB mutations go here)
│   │   ├── admin.ts              # Dashboard stats, system settings, staff CRUD
│   │   ├── attendance.ts         # updateAttendance, scanQrAttendance
│   │   ├── appeals.ts            # submitAppeal, getTeacherAppeals, reviewAppeal
│   │   └── masterlist.ts         # Student/Section CRUD, CSV import (importMasterlist)
│   ├── admin/
│   │   ├── dashboard/            # Admin dashboard — stats, recent activity
│   │   ├── masterlist/           # Section cards → student list, add/edit/remove, CSV import
│   │   ├── audit/                # Attendance audit log viewer with calendar date picker
│   │   ├── appeals/              # Admin appeal review
│   │   ├── staff/                # Staff (admin/teacher) management
│   │   ├── teachers/             # Teacher management
│   │   └── reports/              # Reports
│   ├── teacher/
│   │   ├── scanner/              # QR scanner page (html5-qrcode camera view)
│   │   ├── roster/               # Section roster with manual attendance toggle
│   │   └── appeals/              # Teacher appeal review
│   ├── student/
│   │   ├── dashboard/            # Student QR code display + attendance history
│   │   └── appeals/              # Student appeal submission
│   └── api/
│       ├── auth/                 # NextAuth API route
│       └── upload/               # File upload endpoint (appeal proof images)
├── components/
│   ├── Navbar.tsx                # Conditional nav — links based on user role
│   ├── QrScanner.tsx             # html5-qrcode wrapper component
│   ├── RosterTable.tsx           # Attendance roster with status toggles
│   ├── ImportMasterlist.tsx      # CSV file upload + preview + confirm import UI
│   ├── MasterlistForms.tsx       # Add/Edit student & section forms
│   ├── StaffForms.tsx            # Add staff form
│   ├── AppealForm.tsx            # Student appeal submission form
│   ├── AppealReviewActions.tsx   # Approve/Reject appeal buttons
│   ├── DatePicker.tsx            # Calendar-based date navigation
│   ├── WeeklyStrip.tsx           # Weekly date strip for attendance views
│   ├── AutoRefresh.tsx           # Auto-refresh wrapper
│   ├── SystemSettingsForm.tsx    # Admin system settings editor
│   ├── Providers.tsx             # NextAuth SessionProvider wrapper
│   ├── ThemeToggle.tsx           # Dark/light mode toggle
│   └── ui/                      # Shadcn UI primitives (button, card, input, label, badge, table, tabs, sonner)
├── lib/
│   ├── prisma.ts                 # Singleton PrismaClient instance
│   ├── auth.ts                   # NextAuth config (CredentialsProvider + JWT callbacks)
│   ├── audit.ts                  # logActivity() — writes to ActivityLog table
│   ├── csvParser.ts              # parseMasterlistCSV() — CSV text → ParsedSection[]
│   ├── date.ts                   # getUTCMidnight(), parseUTCDate() — timezone-safe date helpers
│   └── utils.ts                  # cn() (clsx + tailwind-merge)
└── index.css                     # Global styles + Tailwind directives
```

---

### 4. Database Schema (Prisma)

**Core Models:**
| Model | Purpose | Key Fields |
|---|---|---|
| `User` | All users (Admin, Teacher, Student) | `email` (unique), `password` (bcrypt hash), `role` (enum: ADMIN/TEACHER/STUDENT) |
| `Teacher` | Teacher profile, 1:1 with User | `userId` (unique), has many `sections` |
| `Student` | Student profile, 1:1 with User | `studentId` (unique, e.g. "2022-0001"), `qrToken` (unique UUID), `sectionId` (nullable) |
| `Section` | Class section | `name` (unique), `teacherId` (nullable FK to Teacher) |
| `Attendance` | Daily attendance record | `studentId`, `date`, `sectionId`, `status` (PRESENT/ABSENT/LATE). Unique constraint: `[studentId, date, sectionId]` |
| `AttendanceAudit` | Immutable edit history | `attendanceId`, `changedBy`, `oldStatus`, `newStatus`, `reason` |
| `Appeal` | Student absence appeal | `studentId`, `imageUrl`, `description`, `status` (PENDING/APPROVED/REJECTED), `reviewedBy` |
| `ActivityLog` | System-wide activity feed | `type` (ActivityType enum string), `description`, `userId`, `metadata` (JSON) |
| `SystemSetting` | Key-value config store | `key` (unique), `value`, e.g. `attendance_lock_hours` |

**Relationships:**
- User ↔ Teacher (1:1), User ↔ Student (1:1)
- Teacher → Section (1:many), Section → Student (1:many)
- Student → Attendance (1:many), Student → Appeal (1:many)

---

### 5. Authentication Flow

- **Provider:** `CredentialsProvider` only (email + bcrypt password)
- **Strategy:** JWT (not database sessions for auth)
- **Session shape:** `session.user.id`, `session.user.role`, `session.user.name`, `session.user.email`
  - Access role/id via `(session.user as any).role` and `(session.user as any).id` (extended JWT)
- **Login page:** `/` (root) — redirects to role-based dashboard after login
- **Role-based redirect:** Admin → `/admin/dashboard`, Teacher → `/teacher/roster`, Student → `/student/dashboard`
- **Navbar:** Only rendered when `session?.user` exists (checked in root layout server component)

**Demo/seed accounts** (created via `pnpm db:seed`):
| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.com` | `password123` |
| Teacher | `teacher@school.com` | `password123` |
| Student | `john@student.com` (and 4 others) | `password123` |

---

### 6. Key Patterns & Coding Conventions

#### Server Actions (ALL mutations)
- All DB writes use **Next.js Server Actions** in `src/app/actions/`.
- Files start with `"use server";`.
- Always check authorization first: `getServerSession(authOptions)` → verify role.
- Use `prisma.$transaction()` for multi-step writes.
- Always call `revalidatePath()` after mutations.
- Always call `logActivity()` from `src/lib/audit.ts` after successful mutations.
- Return `{ success: boolean; message: string }` pattern from actions.

#### Activity Logging
- Use `logActivity(type, description, metadata?)` from `src/lib/audit.ts`.
- Valid types: `ATTENDANCE_EDIT`, `ATTENDANCE_SCAN`, `STAFF_ADD`, `STAFF_REMOVE`, `STUDENT_ADD`, `STUDENT_REMOVE`, `STUDENT_UPDATE`, `SECTION_ADD`, `SECTION_REMOVE`, `SECTION_UPDATE`, `SETTING_UPDATE`, `APPEAL_REVIEW`, `MASTERLIST_IMPORT`.
- Logs are stored in the `ActivityLog` table and displayed on admin dashboard.

#### Attendance Logic
- Attendance uses **UTC midnight normalization** — always call `getUTCMidnight()` from `src/lib/date.ts`.
- Unique constraint: one attendance record per `[studentId, date, sectionId]` per day.
- **QR scan flow:** Validate qrToken → verify student belongs to teacher's section → check not already PRESENT → upsert attendance + audit.
- **Section enforcement:** Teacher can only scan students in their assigned section(s).
- **Time-lock:** Attendance older than configurable hours is locked for teachers (admin can override). Stored in `SystemSetting` key `attendance_lock_hours`.

#### Masterlist Import (CSV)
- CSV format defined in `how_to_import_masterlist.md`.
- Parser: `src/lib/csvParser.ts` → `parseMasterlistCSV()` returns `ParsedSection[]`.
- Import action: `src/app/actions/masterlist.ts` → `importMasterlist()`.
- Auto-creates: sections, teachers (password: `teacher123`), students (password: their student ID).
- Auto-generates: `qrToken` (UUID) for each new student.
- Handles duplicates gracefully: updates existing records, skips duplicates.
- Student email auto-generated as `{studentId}@student.local` if omitted.

#### UI Conventions
- Use **Shadcn UI** primitives from `src/components/ui/` (button, card, input, label, badge, table, tabs).
- Toasts via `sonner`: `toast.success()`, `toast.error()`.
- Icons via `lucide-react`.
- Animations via `framer-motion` (`motion/react` import path).
- Mobile-first responsive design — teachers use phones as scanners.
- Import paths use `@/src/` alias (maps to `src/`).

---

### 7. Scripts & Commands
| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:seed` | Seed demo data (admin, teacher, 5 students in STEM-A) |
| `pnpm postinstall` | Auto-runs `prisma generate` |

---

### 8. Critical Rules
1. **Never use Firebase** — all data must be in PostgreSQL.
2. **Never bypass auth checks** — every server action must verify session + role.
3. **Always audit** — every data mutation must create an `ActivityLog` entry via `logActivity()`.
4. **Always use UTC dates** — call `getUTCMidnight()` for attendance date normalization.
5. **Always use transactions** — multi-step writes must use `prisma.$transaction()`.
6. **Always revalidate** — call `revalidatePath()` after mutations for cache invalidation.
7. **Return `{ success, message }`** — standard return pattern from server actions.
8. **Passwords are hashed** — use `bcryptjs.hashSync(password, 10)` for new accounts.
9. **QR tokens are UUIDs** — use `crypto.randomUUID()` for new student QR tokens.
10. **Section-scoped operations** — teachers can only operate on students in their assigned sections.
