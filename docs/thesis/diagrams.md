# System Diagrams

A consolidated set of diagrams for the thesis appendix. Each is also discussed in
context elsewhere in this site (linked below).

## Use-case diagram

```mermaid
flowchart TB
    Admin([Admin]); Teacher([Teacher]); Student([Student])

    subgraph System["Secure QR Attendance System"]
        UC1((Log in))
        UC2((Scan QR to<br/>mark attendance))
        UC3((Toggle roster<br/>manually))
        UC4((View QR /<br/>attendance history))
        UC5((Submit appeal))
        UC6((Review appeal))
        UC7((Manage masterlist))
        UC8((Manage staff))
        UC9((Import CSV))
        UC10((View audit log))
        UC11((Export / reset data))
    end

    Admin --- UC1
    Teacher --- UC1
    Student --- UC1
    Teacher --- UC2
    Teacher --- UC3
    Student --- UC4
    Student --- UC5
    Teacher --- UC6
    Admin --- UC6
    Admin --- UC7
    Admin --- UC8
    Admin --- UC9
    Admin --- UC10
    Admin --- UC11
```

## Context diagram (DFD Level 0)

See [Data Flow](/architecture/data-flow#context-diagram-level-0).

```mermaid
flowchart LR
    ADMIN([Admin]) --> SYS
    TEACHER([Teacher]) --> SYS
    STUDENT([Student]) --> SYS
    SYS["Secure QR<br/>Attendance System"] --> ADMIN
    SYS --> TEACHER
    SYS --> STUDENT
    SYS <--> DB[("PostgreSQL")]
```

## Entity–relationship diagram

The full ERD with attributes is on the [ER Diagram](/database/er-diagram) page.
Simplified view:

```mermaid
erDiagram
    User ||--o| Teacher : is
    User ||--o| Student : is
    Teacher ||--o{ Section : advises
    Teacher ||--o{ Subject : teaches
    Section ||--o{ Student : groups
    Student ||--o{ StudentSubject : enrolls
    Subject ||--o{ StudentSubject : has
    Student ||--o{ Attendance : has
    Subject ||--o{ Attendance : has
    Student ||--o{ Appeal : files
```

## Sequence: QR scan

The detailed version with validation gates is on the
[QR Attendance Flow](/features/qr-attendance) page.

```mermaid
sequenceDiagram
    participant St as Student
    participant Te as Teacher
    participant SA as Server
    participant DB as Database
    St->>Te: show QR
    Te->>SA: qrToken + subject
    SA->>DB: validate student, subject, enrollment
    SA->>DB: mark PRESENT + audit
    SA-->>Te: success
```

## Activity: appeal review

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> APPROVED
    PENDING --> REJECTED
    APPROVED --> [*]
    REJECTED --> [*]
```

## Deployment view

```mermaid
flowchart LR
    Dev[Developer] -->|git push| GH[(GitHub repo)]
    GH -->|CI build| Host["Next.js host<br/>(e.g. Vercel)"]
    Host <--> PG[("Managed PostgreSQL")]
    GH -->|docs workflow| Pages["GitHub Pages<br/>(this documentation)"]
    User([Browser]) --> Host
```
