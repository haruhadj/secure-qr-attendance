# Testing & QA

This page outlines how the system's behaviour can be verified. It is written so
you can reproduce the checks and cite them in the thesis.

## Approach

Testing was primarily **manual, scenario-based functional testing** across the
three roles, backed by the deterministic **seed dataset** (`pnpm db:seed`) so
every run starts from a known state. Each specific objective maps to a set of
concrete checks below.

## Test environment

| Item | Value |
|---|---|
| App | `pnpm dev` on `http://localhost:3000` |
| Data | `pnpm db:seed` (1 admin, 1 teacher, 5 students, 3 subjects) |
| Accounts | See [Default Accounts](/getting-started/running#default-accounts) |
| Camera | `localhost` or HTTPS (browser secure-context requirement) |

## Functional test scenarios

### Authentication & access control
| # | Scenario | Expected |
|---|---|---|
| A1 | Log in as each role | Redirected to the correct dashboard |
| A2 | Student opens `/admin/...` | Redirected to `/` |
| A3 | 11 wrong passwords for one email | Blocked with rate-limit message |
| A4 | Session after 8h | Expired; re-login required |

### QR attendance
| # | Scenario | Expected |
|---|---|---|
| Q1 | Teacher scans an enrolled student for their subject | Marked PRESENT + toast |
| Q2 | Scan the same student again | "already marked PRESENT" (no duplicate) |
| Q3 | Scan a student not enrolled in the subject | Rejected with reason |
| Q4 | Teacher selects a subject they don't teach | Rejected |
| Q5 | Invalid/garbage QR | "student not found" |

### Manual roster & time-lock
| # | Scenario | Expected |
|---|---|---|
| M1 | Teacher toggles today's status | Saved + audited |
| M2 | Teacher edits a record older than the lock window | Blocked |
| M3 | Admin edits an old record | Allowed |

### Appeals
| # | Scenario | Expected |
|---|---|---|
| P1 | Student submits an appeal | Appears as PENDING for the teacher |
| P2 | Teacher approves it | Student PRESENT today; appeal APPROVED |
| P3 | Review an already-reviewed appeal | "already been reviewed" |

### Masterlist & CSV import
| # | Scenario | Expected |
|---|---|---|
| C1 | Import `masterlist_template.csv` | Sections/subjects/students/enrollments created |
| C2 | Re-import the same file | Idempotent; records updated/skipped, no duplicates |
| C3 | Import a file missing a required column | Whole file rejected with a clear error |
| C4 | Row missing a required value | That row errors; valid rows still import |

### Data management
| # | Scenario | Expected |
|---|---|---|
| D1 | Export backup | JSON downloads; no passwords included |
| D2 | Reset with wrong confirmation text | Cancelled |
| D3 | Reset with `RESET` | Operational data cleared; admins + settings preserved; `DATA_RESET` logged |

## Verifying the audit trail

After any attendance change, confirm a matching `AttendanceAudit` row exists and
an `ActivityLog` entry was written (visible on **Admin → Audit**). You can inspect
the tables directly with `pnpm exec prisma studio`.

## Automated testing (future)

The project currently has no automated test suite. Recommended additions:

- **Unit tests** for `parseMasterlistCSV()` and the `date.ts` helpers (pure
  functions, easy to cover).
- **Integration tests** for the server actions (auth gates, time-lock, scan
  validation) against a test database.
- **End-to-end tests** (e.g. Playwright) for the login → scan → history flow.

See [Limitations & Future Work](/thesis/limitations).
