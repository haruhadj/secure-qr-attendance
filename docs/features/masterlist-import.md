# Masterlist CSV Import

Admins can populate the entire system — sections, subjects, teachers, students,
and enrollments — from a single CSV file. Parsing is done by
`parseMasterlistCSV()` (`src/lib/csvParser.ts`); the import is applied by
`importMasterlist()` (`src/app/actions/masterlist.ts`).

::: tip Authoritative format
This page documents the format the **parser actually expects**. A ready-made
sample lives at `masterlist_template.csv` in the repo root.
:::

## CSV format

**One row = one student enrolled in one subject.** A student who takes three
subjects appears on three rows; the importer groups them automatically by
`student_id`.

### Required columns

| Column | Description | Example |
|---|---|---|
| `section_name` | Class/section name | `BSIT 2nd Year` |
| `adviser_name` | Section adviser's full name | `Ms. Alcantara` |
| `adviser_email` | Adviser's login email | `alcantara@school.com` |
| `subject_code` | Unique subject code | `NET201` |
| `subject_name` | Subject name | `Data Communications` |
| `subject_teacher_name` | Subject teacher's name | `Engr. Torres` |
| `subject_teacher_email` | Subject teacher's email | `torres@school.com` |
| `student_id` | Unique student ID (also initial password) | `2026-101` |
| `student_name` | Student's full name | `Clara Mendoza` |

### Optional columns

| Column | Description | Example |
|---|---|---|
| `subject_units` | Units for the subject | `3` |
| `schedule_day` | Day code; shorthand is expanded (see below) | `MWF` |
| `schedule_time` | Time range | `09:00-10:30` |
| `student_email` | Student email (auto-handled if blank) | `clara@student.com` |
| `year_level` | Student's grade/year level | `2nd Year College` |

### Schedule-day shorthand

`schedule_day` shorthand is normalised by the parser: `MWF` → `Mon,Wed,Fri`,
`TTh` → `Tue,Thu`, `Daily`/`MTWTF` → `Mon,Tue,Wed,Thu,Fri`, and single days like
`Fri` pass through. Comma-separated day lists are accepted as-is.

## Example

```csv
section_name,adviser_name,adviser_email,subject_code,subject_name,subject_teacher_name,subject_teacher_email,subject_units,schedule_day,schedule_time,student_id,student_name,student_email,year_level
BSIT 2nd Year,Ms. Alcantara,alcantara@school.com,NET201,Data Communications,Engr. Torres,torres@school.com,3,MWF,09:00-10:30,2026-101,Clara Mendoza,clara@student.com,2nd Year College
BSIT 2nd Year,Ms. Alcantara,alcantara@school.com,WEB202,Web Development,Prof. Garcia,garcia@school.com,3,TTh,13:00-14:30,2026-101,Clara Mendoza,clara@student.com,2nd Year College
```

Here Clara appears twice — once per subject — and ends up enrolled in both.

## How the import behaves

`importMasterlist()` processes sections, then subjects, then students +
enrollments. It is **idempotent** — you can safely import the same file multiple
times.

| Entity | New | Existing (matched by) |
|---|---|---|
| **Section** | Created with its adviser | Reused; adviser reassigned if changed (`name`) |
| **Teacher/Adviser** | Account created, default password `teacher123` | Reused (`email`) |
| **Subject** | Created | Updated: name, teacher, units, schedule (`code`) |
| **Student** | Account created; password = student ID; QR token generated | Section, name & year level updated (`student_id`) |
| **Enrollment** | Created if missing | Skipped if already enrolled |

### Account defaults created by import

| Role | Login | Initial password |
|---|---|---|
| Teacher (new) | Their email | `teacher123` |
| Student (new) | Their email (or `null` if blank) | Their student ID (e.g. `2026-101`) |

## Import steps

1. Go to **Admin → Masterlist** and click **Import Masterlist**.
2. Select your `.csv` file. The system shows a **preview** with counts and any
   validation errors (missing required fields, missing columns, etc.).
3. Click **Confirm Import**.
4. A **summary** reports what was created, updated, or skipped, plus any per-row
   errors (for example, an email already in use).

::: warning Validation
If any **required column** is missing from the header, the whole file is
rejected. Individual rows missing a required *value* are reported as errors and
skipped, while valid rows still import.
:::

## Tips

- Build the file in Excel/Google Sheets and export as `.csv`.
- Keep `student_id` values **unique** across the whole system.
- Wrap fields containing commas in quotes (e.g. `"Dela Cruz, Juan"`); the parser
  handles quoted fields.
- One file can contain multiple sections and subjects.
