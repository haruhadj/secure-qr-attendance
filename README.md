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
