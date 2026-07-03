# Problem & Objectives

This page frames the system in academic terms for the thesis writeup.

## Background

Traditional classroom attendance is taken by manual roll-call or by passing
around a paper sheet. In practice this is slow, error-prone, and easy to abuse
(for example, "buddy punching," where a classmate answers on behalf of an absent
student). Paper records are also difficult to aggregate, audit, or correct after
the fact, and they provide no reliable trail of *who* changed *what* and *when*.

## Problem statement

Schools need an attendance system that is **fast to operate in class**,
**resistant to casual fraud**, and **fully auditable**, while remaining usable on
the hardware teachers already carry — a smartphone. Existing options are often
either expensive dedicated hardware (biometric or RFID scanners) or generic
spreadsheets that offer no verification and no audit trail.

## General objective

To design and implement a secure, web-based attendance monitoring system that
allows teachers to record attendance by scanning student QR codes with a
standard phone camera, backed by server-side verification and a complete audit
trail.

## Specific objectives

1. **Digital identity** — issue every student a unique QR code derived from an
   opaque server-side token.
2. **Verified scanning** — allow a teacher to scan a student's QR code and mark
   attendance only after the server confirms the student, subject ownership, and
   enrollment.
3. **Fallback recording** — provide manual roster toggles (Present / Absent /
   Late) and an evidence-based appeals process for cases where scanning fails.
4. **Administration** — provide administrators with full CRUD over sections,
   subjects, students, and staff, plus bulk CSV import.
5. **Accountability** — record every data mutation in an activity log and every
   attendance change in an immutable audit history.
6. **Integrity controls** — enforce role-based access, hashed passwords, login
   rate limiting, and a configurable time-lock on attendance edits.

## Scope

**In scope**

- Web application for admins, teachers, and students (desktop and mobile browser).
- QR generation and camera-based scanning.
- Subject-level attendance with Present / Absent / Late statuses.
- Masterlist management and CSV bulk import.
- Appeals, audit logs, data export (JSON), and data reset.

**Out of scope / limitations**

- Native mobile apps (the app is a responsive website).
- Cryptographically signed or expiring QR tokens (tokens are static UUIDs,
  revocable by regeneration).
- Offline scanning (the scanner requires connectivity to validate).
- Distributed/high-availability deployment concerns such as shared-state rate
  limiting.

See [Limitations & Future Work](/thesis/limitations) for the full discussion.

## Significance

The system reduces the time spent taking attendance, discourages casual proxy
attendance through server-side verification, and gives administrators a reliable,
queryable record for reporting and dispute resolution — all without requiring
schools to purchase specialised scanning hardware.
