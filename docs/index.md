---
layout: home

hero:
  name: "Secure QR Attendance"
  text: "System Documentation"
  tagline: A teacher-led, QR-based attendance monitoring platform for schools — built with Next.js, Prisma, and PostgreSQL.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/installation
    - theme: alt
      text: System Overview
      link: /guide/overview
    - theme: alt
      text: Thesis Reference
      link: /thesis/methodology

features:
  - icon: 📷
    title: Teacher-as-Scanner
    details: Teachers use their phone camera to scan a student's QR code and instantly mark attendance PRESENT for the selected subject.
  - icon: 🛡️
    title: Server-Side Validation
    details: Every scan is verified end-to-end — the token must map to a real student, the teacher must own the subject, and the student must be enrolled.
  - icon: 🗂️
    title: Full Admin Control
    details: Bulk CSV import, per-section rosters, staff management, immutable audit logs, JSON backups, and one-click data reset.
  - icon: 📝
    title: Appeals & Fallbacks
    details: Manual roster toggles and evidence-based appeals ensure attendance is still correct when scanning is not possible.
  - icon: 🔒
    title: Auditable by Design
    details: Every mutation writes an activity log, and every attendance change writes an immutable audit record.
  - icon: 🎓
    title: Thesis-Ready
    details: Includes methodology, ER and data-flow diagrams, testing notes, and an honest limitations section for your writeup.
---

## What is this?

The **Secure QR Attendance System** is a web-based attendance monitoring
application for schools. It replaces manual roll-call with a fast, verifiable
workflow: each student carries a personal QR code, and their teacher scans it to
record attendance. Administrators manage the masterlist (sections, subjects,
students, and staff), review appeals, and audit every change in the system.

This site documents the system from three angles:

- **User guides** for [Admins](/user-guides/admin), [Teachers](/user-guides/teacher), and [Students](/user-guides/student).
- **Technical documentation** covering [architecture](/architecture/overview), the [database schema](/database/models), [security](/security/model), and the [developer API](/developer/server-actions).
- **Thesis material** including [methodology](/thesis/methodology), [system diagrams](/thesis/diagrams), and [limitations](/thesis/limitations).

::: tip New here?
Start with the [System Overview](/guide/overview) to understand the actors and
the core flow, then follow [Getting Started](/getting-started/installation) to
run the app locally.
:::
