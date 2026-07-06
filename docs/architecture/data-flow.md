# Data Flow

This page shows how data moves through the system, in the style of a data-flow
diagram (DFD) suitable for the thesis.

## Context diagram (Level 0)

```mermaid
flowchart LR
    ADMIN([Admin]) -->|manage masterlist,<br/>settings, staff| SYS
    TEACHER([Teacher]) -->|scan QR, toggle roster,<br/>review appeals| SYS
    STUDENT([Student]) -->|view QR & history,<br/>submit appeals| SYS
    SYS["Secure QR<br/>Attendance System"] -->|dashboards, rosters,<br/>reports, receipts| ADMIN
    SYS --> TEACHER
    SYS --> STUDENT
    SYS <-->|persist & query| DB[("PostgreSQL")]
```

## Level 1 — main processes and stores

```mermaid
flowchart TD
    subgraph Actors
        A([Admin]); T([Teacher]); S([Student])
    end

    P1["1.0 Authentication<br/>& authorization"]
    P2["2.0 Masterlist<br/>management"]
    P3["3.0 Attendance<br/>capture"]
    P4["4.0 Appeals"]
    P5["5.0 Audit &<br/>reporting"]

    DS1[("Users / Teachers / Students")]
    DS2[("Sections / Subjects / Enrollments")]
    DS3[("Attendance / AttendanceAudit")]
    DS4[("Appeals")]
    DS5[("ActivityLog")]

    A --> P1; T --> P1; S --> P1
    P1 --> DS1

    A --> P2 --> DS1
    P2 --> DS2

    T --> P3 --> DS3
    S -->|show QR| P3

    S --> P4 --> DS4
    T --> P4
    P4 -->|approve → mark present| DS3

    A --> P5
    P2 --> DS5
    P3 --> DS5
    P4 --> DS5
    P5 --> DS5
```

## QR scan sequence

The most important runtime flow — a teacher scanning a student's code:

```mermaid
sequenceDiagram
    participant St as Student device
    participant Te as Teacher (scanner page)
    participant SA as scanQrAttendance()
    participant DB as PostgreSQL

    St->>Te: Displays QR (encodes qrToken)
    Te->>SA: qrToken + selected subjectId
    SA->>SA: getServerSession → require TEACHER role
    SA->>DB: find Student by qrToken
    DB-->>SA: student (or none)
    SA->>DB: find Subject + this teacher
    SA->>SA: verify subject.teacherId == teacher.id
    SA->>DB: check StudentSubject enrollment
    SA->>DB: check existing attendance today
    alt Already PRESENT
        SA-->>Te: "already marked PRESENT" (no write)
    else Not yet present & all checks pass
        SA->>DB: upsert Attendance = PRESENT<br/>+ AttendanceAudit (reason "QR Scan")
        SA->>DB: logActivity(ATTENDANCE_SCAN)
        SA-->>Te: success ✓ (name, id, subject)
    end
```

Each validation step can short-circuit with a specific message (invalid code,
wrong teacher for the subject, not enrolled, already present). The full
narrative is on the [QR Attendance Flow](/features/qr-attendance) page.

## Notes on consistency

- **Transactions.** Attendance writes and their audit rows are committed together
  via `prisma.$transaction()`, so an attendance change never exists without its
  audit trail.
- **Idempotent scans.** A student already marked `PRESENT` for the day/subject is
  skipped, so repeated scans don't create duplicates or spurious audit rows.
- **Date keys.** The unique key `(studentId, date, subjectId)` uses a
  UTC-midnight `date`, guaranteeing one record per student per subject per day.
