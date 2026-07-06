# Entity–Relationship Diagram

The database is PostgreSQL, modelled with Prisma (`prisma/schema.prisma`). The
diagram below shows the core domain entities and their relationships. NextAuth's
`Account`, `Session`, and `VerificationToken` tables are omitted for clarity and
described on the [Model Reference](/database/models) page.

```mermaid
erDiagram
    User ||--o| Teacher : "is (optional)"
    User ||--o| Student : "is (optional)"
    User ||--o{ ActivityLog : "performs"

    Teacher ||--o{ Section : "advises"
    Teacher ||--o{ Subject : "teaches"

    Section ||--o{ Student : "groups"

    Student ||--o{ StudentSubject : "enrolls"
    Subject ||--o{ StudentSubject : "has"

    Student ||--o{ Attendance : "has"
    Subject ||--o{ Attendance : "has"

    Student ||--o{ Appeal : "files"

    User {
        string id PK
        string email UK
        string password "bcrypt hash"
        enum   role "ADMIN|TEACHER|STUDENT"
        string name
    }
    Teacher {
        string id PK
        string userId UK,FK
    }
    Student {
        string id PK
        string studentId UK "e.g. 2022-0001"
        string qrToken UK "UUID"
        string userId UK,FK
        string sectionId FK "nullable"
    }
    Section {
        string id PK
        string name UK
        string teacherId FK "nullable"
    }
    Subject {
        string id PK
        string code UK "e.g. OS101"
        string name
        int    units "nullable"
        string scheduleDay "nullable"
        string scheduleTime "nullable"
        string teacherId FK "nullable"
    }
    StudentSubject {
        string id PK
        string studentId FK
        string subjectId FK
    }
    Attendance {
        string id PK
        datetime date "UTC midnight"
        enum   status "PRESENT|ABSENT|LATE"
        string studentId FK
        string subjectId FK
    }
    Appeal {
        string id PK
        string studentId FK
        string imageUrl "nullable"
        string description
        string status "PENDING|APPROVED|REJECTED"
    }
    ActivityLog {
        string id PK
        string type
        string description
        string userId FK
        json   metadata
    }
```

## Key relationships in words

- A **User** is exactly one role. A user is optionally linked 1:1 to a
  **Teacher** or a **Student** profile.
- A **Teacher** advises many **Sections** and teaches many **Subjects** (both
  links are optional on the section/subject side).
- A **Section** groups many **Students**; a student belongs to at most one
  section (`sectionId` is nullable).
- **Students** and **Subjects** form a many-to-many relationship through
  **StudentSubject** (enrollment), which is unique per `(studentId, subjectId)`.
- **Attendance** ties a student and a subject to a date, unique per
  `(studentId, date, subjectId)` — one record per student per subject per day.
- **AttendanceAudit** (not drawn) is an append-only log referencing an attendance
  record by id.
- **Appeals** belong to a student and are reviewed by a teacher or admin.

Field-by-field detail, enums, and constraints are on the
[Model Reference](/database/models).
