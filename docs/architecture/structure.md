# Project Structure

The application code lives under `src/`. This reflects the actual directory tree.

```
secure-qr-attendance/
├── prisma/
│   ├── schema.prisma        # Database models (PostgreSQL)
│   └── seed.ts              # Demo data seeder (pnpm db:seed)
├── public/
│   ├── olac-logo.png        # Static assets
│   └── uploads/             # Appeal proof-image uploads (runtime)
├── docs/                    # This VitePress documentation site
├── src/
│   ├── middleware.ts        # Role-based route protection
│   ├── index.css            # Tailwind entry + theme variables
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Login page (/)
│   │   ├── layout.tsx       # Root layout (providers, navbar, toaster)
│   │   ├── not-found.tsx
│   │   ├── forgot-password/ # Password-reset request page
│   │   ├── reset-password/[token]/
│   │   ├── actions/         # Server Actions (all DB mutations)
│   │   │   ├── admin.ts
│   │   │   ├── attendance.ts
│   │   │   ├── appeals.ts
│   │   │   ├── masterlist.ts
│   │   │   └── password.ts
│   │   ├── admin/           # Admin portal
│   │   │   ├── dashboard/
│   │   │   ├── masterlist/  # + [sectionId], section/, subject/
│   │   │   ├── staff/
│   │   │   └── audit/
│   │   ├── teacher/         # Teacher portal
│   │   │   ├── scanner/
│   │   │   ├── roster/
│   │   │   └── appeals/
│   │   ├── student/         # Student portal
│   │   │   ├── dashboard/
│   │   │   └── appeals/
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── upload/route.ts
│   ├── components/          # ~22 feature components + ui/ (Shadcn primitives)
│   └── lib/                 # prisma, auth, audit, csvParser, date, email, utils
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

::: info Admin routes
The live admin portal contains exactly four sections: **dashboard**,
**masterlist**, **staff**, and **audit**. (Appeal review for admins is reached
through the same review actions used by teachers.)
:::

## The three layers

### `src/app/` — routes & actions

Route folders map 1:1 to URLs. Pages are mostly **Server Components** that fetch
data directly via Prisma or via read helpers in `actions/`. All **mutations** are
Server Actions in `src/app/actions/`, each of which authorises the caller before
writing. See [Server Actions](/developer/server-actions).

### `src/components/` — UI

Feature components such as `QrScanner`, `RosterTable`, `AttendanceCalendar`,
`ImportMasterlist`, `AppealForm`, `DataManagementCard`, `Navbar`, and
`SystemSettingsForm`, plus low-level Shadcn primitives in `src/components/ui/`
(button, card, input, table, tabs, badge, textarea, sonner).

### `src/lib/` — shared logic

| File | Responsibility |
|---|---|
| `prisma.ts` | Singleton `PrismaClient`. |
| `auth.ts` | NextAuth config (Credentials + JWT, rate limiting). |
| `audit.ts` | `logActivity()` and the `ActivityType` union. |
| `csvParser.ts` | `parseMasterlistCSV()` → structured masterlist. |
| `date.ts` | UTC normalisation + `Asia/Manila` formatting helpers. |
| `email.ts` | Resend email helper (optional). |
| `utils.ts` | `cn()` class-name helper. |
