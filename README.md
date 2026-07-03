<div align="center">

# 🛡️ Secure QR Attendance System

**A robust, teacher-led attendance monitoring solution built for modern schools.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 Overview

The **Secure QR Attendance System** streamlines the attendance process using a "Teacher-as-Scanner" model. Teachers use their mobile cameras to scan student-generated QR codes, ensuring rapid and verified attendance recording. The system includes fallback manual toggles, evidence-based appeals, and comprehensive administrative oversight.

---

## ✨ Key Features

### 👨‍🏫 Teacher Module
- **QR Scanner**: High-speed, camera-based scanning using `html5-qrcode`.
- **Roster Management**: Section-specific rosters with manual attendance toggles (Present/Absent/Late).
- **Appeal Review**: Review and act on student attendance appeals.
- **Section Scoping**: Teachers only see and manage students in their assigned sections.

### 🎓 Student Module
- **Digital ID**: Personal QR code generated for daily scanning.
- **Attendance History**: Detailed timeline of attendance status.
- **Appeals System**: Submit absence appeals with image proof (e.g., medical certificates).
- **Interactive Calendar**: Visual representation of monthly attendance.

### 🔑 Admin Dashboard
- **System Stats**: Real-time overview of attendance rates and activity.
- **Masterlist Control**: Full CRUD for Sections, Teachers, and Students.
- **CSV Import**: Bulk enrollment of students and sections with auto-account generation.
- **Audit Logs**: Immutable history of all attendance modifications and system activities.
- **Settings**: Configurable attendance lock hours and system-wide parameters.

---

## 📚 Documentation

Full documentation — architecture, database design, security, per-role user guides, developer/API reference, and thesis material (methodology, diagrams, limitations) — is published as a searchable **VitePress** site:

**🔗 [https://haruhadj.github.io/secure-qr-attendance/](https://haruhadj.github.io/secure-qr-attendance/)**

The source lives in [`docs/`](docs/). To run or build it locally:

```bash
pnpm docs:dev      # start the docs site locally (hot reload)
pnpm docs:build    # build the static site to docs/.vitepress/dist
pnpm docs:preview  # preview the production build
```

> The site auto-deploys to GitHub Pages via [`.github/workflows/deploy-docs.yml`](.github/workflows/deploy-docs.yml) on every push to `main` that changes `docs/`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15+](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js v4](https://next-auth.js.org/) (Credentials Provider + JWT) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **QR Engine** | `html5-qrcode` (Scanning) & `qrcode.react` (Generation) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20+)
- **pnpm** (Recommended package manager)
- **PostgreSQL** instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd secure-qr-attendance
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory (use `.env.example` as a template):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Initialization:**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

5. **Run Development Server:**
   ```bash
   pnpm dev
   ```

---

## 🔑 Default Passwords

These are the **initial** passwords assigned at setup or when accounts are created/reset. Users should change these after first login.

| User Type | Default Password | Notes |
|---|---|---|
| **Admin** | `password123` | Set on seed & when admin password is reset via Staff Management |
| **Teacher** | `teacher123` | Set when adding a teacher via Staff Management or resetting their password |
| **Student** | Their Student ID (e.g. `2022-0001`) | Set when importing via CSV masterlist or adding manually. Seed script also uses `studentId` as password. |

> **Important:** The Demo Accounts card on the admin dashboard displays these **initial defaults only** — it does not reflect any passwords changed after setup.

Password rules enforced on change:
- Minimum **8 characters**
- Current password must be verified before changing

---

## 🗄️ Data Management Guide

This section covers how to manage, import, and reset system data as an administrator.

---

### Importing Student Data (CSV Masterlist)

The fastest way to populate the system is via bulk CSV import from **Admin → Masterlist**.

**CSV Format:**

| Column | Required | Example | Notes |
|---|---|---|---|
| `studentId` | Yes | `2022-0001` | Unique school ID; also used as initial password |
| `name` | Yes | `Juan dela Cruz` | Full name |
| `section` | Yes | `BSCS 3rd Year` | Auto-created if it doesn't exist |
| `subjects` | No | `OS101,NET102` | Comma-separated subject codes |

**Steps:**
1. Go to **Admin → Masterlist**
2. Click **Import CSV**
3. Upload your `.csv` file — a preview will be shown
4. Click **Confirm Import** to apply

> Each imported student gets an account automatically. Initial password = their Student ID (e.g., `2022-0001`). Students should change this on first login.

See [`how_to_import_masterlist.md`](how_to_import_masterlist.md) for a detailed template and rules.

---

### Adding Data Manually

All manual CRUD operations are available from the admin interface:

| Data Type | Location | What You Can Do |
|---|---|---|
| **Sections** | Admin → Masterlist | Add / Edit / Remove sections |
| **Students** | Admin → Masterlist → Section | Add / Edit / Remove students per section |
| **Teachers** | Admin → Staff | Add / Remove teachers |
| **Subjects** | Admin → Masterlist | Add / Edit / Remove subjects |
| **System Settings** | Admin → Dashboard | Change attendance lock hours |

---

### Exporting a Backup

The **Data Management** card on the Admin Dashboard lets you download a full snapshot of all system data as a JSON file. No server access required — the export runs in the browser.

**What is included in the backup:**

| Included | Not Included |
|---|---|
| All admin, teacher, and student accounts (name, email, role) | Passwords (never exported) |
| Sections and subjects | |
| Student enrollments | |
| All attendance records and audit history | |
| All student appeals | |
| System settings | |

**How to export:**

1. Go to **Admin → Dashboard**
2. Scroll to the **Data Management** card
3. Click **Export Backup (.json)**
4. A file named `qr-attendance-backup-YYYY-MM-DD.json` is downloaded immediately

> Keep backups in a secure location. The JSON file contains personal information (student names, emails, IDs).

---

### Resetting System Data

The **Reset System Data** feature deletes all operational data while keeping admin accounts intact. Use this to wipe the database at the start of a new school year or for a fresh deployment.

**What gets deleted:**
- All students and their user accounts
- All teachers and their user accounts
- All sections
- All subjects
- All attendance records
- All attendance audit history
- All student appeals
- All activity logs

**What is preserved:**
- All admin accounts (including your own)
- System settings (e.g., `attendance_lock_hours`)

**How to reset from the Admin Dashboard:**

1. Log in as an **Admin** and go to **Admin → Dashboard**
2. Scroll to the **Data Management** card at the bottom
3. Export a backup first (recommended)
4. Click **Reset All Data**
4. A confirmation panel will appear — read the warning carefully
5. Type `RESET` (all caps) in the confirmation field
6. Click **Confirm Reset**

The reset is recorded in the activity log immediately after completion (the log entry is written by the admin who performed it).

> **Warning:** This action is irreversible. There is no undo. Make sure you have a database backup if you need to recover data.

---

### Database Backup & Recovery

Before performing a data reset or major import, consider taking a database snapshot:

```bash
# Backup
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Restore
psql "$DATABASE_URL" < backup_20240101.sql
```

---

### Re-seeding the Database

To restore the demo data (1 admin, 1 teacher, 5 students, 3 subjects):

```bash
pnpm db:seed
```

> Re-seeding does **not** wipe existing data — it only creates missing demo records. If you've already reset via the dashboard, run seed to repopulate with demo accounts.

---

## 🛡️ Security & Patterns

- **Password Hashing**: All passwords are encrypted using `bcryptjs`.
- **UTC Normalization**: Attendance records use UTC midnight normalization to prevent timezone discrepancies.
- **Activity Logging**: Every system mutation (scans, edits, imports) is recorded in the `ActivityLog`.
- **Server Actions**: All database mutations are handled via secure Next.js Server Actions with role-based authorization.
- **Time-Locking**: Teachers are restricted from editing old attendance records based on the `attendance_lock_hours` setting.

---

## 📁 Project Structure

```
src/
├── app/          # Next.js App Router (Routes & Server Actions)
├── components/   # Shared UI Components (Shadcn + Custom)
├── lib/          # Utilities, Database Client, and Auth Config
├── prisma/       # Database Schema and Seed Scripts
└── public/       # Static Assets
```

---

<div align="center">
Built with ❤️ for the future of education.
</div>
