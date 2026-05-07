# 📋 How to Import a Masterlist

This guide explains how to prepare and import a student masterlist CSV file into the Secure QR Attendance System.

---

## 1. Prepare Your CSV File

Create a `.csv` file (using Excel, Google Sheets, or any spreadsheet tool) with the following columns:

| Column | Required | Description | Example |
|---|---|---|---|
| `section_name` | ✅ Yes | The class section or course name | `Grade 10 - Newton` |
| `teacher_name` | ✅ Yes | Full name of the assigned teacher | `Mr. Julian Vance` |
| `teacher_email` | ✅ Yes | Teacher's school email (used as login) | `julian@school.com` |
| `student_id` | ✅ Yes | Student LRN or ID number | `2026-001` |
| `student_name` | ✅ Yes | Full name of the student | `Alice Sterling` |
| `student_email` | ❌ Optional | Student's email (auto-generated if blank) | `alice@student.com` |
| `year_level` | ❌ Optional | Grade or year level | `Grade 10` |
| `school_year` | ❌ Optional | Academic year | `2026-2027` |

### Example CSV

```csv
section_name,teacher_name,teacher_email,student_id,student_name,student_email,year_level,school_year
Grade 10 - Newton,Mr. Julian Vance,julian@school.com,2026-001,Alice Sterling,alice@student.com,Grade 10,2026-2027
Grade 10 - Newton,Mr. Julian Vance,julian@school.com,2026-002,Bob Chen,bob@student.com,Grade 10,2026-2027
Grade 10 - Newton,Mr. Julian Vance,julian@school.com,2026-003,Carol Davis,,Grade 10,2026-2027
Grade 11 - Einstein,Ms. Sarah Lopez,sarah@school.com,2026-004,David Kim,david@student.com,Grade 11,2026-2027
Grade 11 - Einstein,Ms. Sarah Lopez,sarah@school.com,2026-005,Emma Wilson,,Grade 11,2026-2027
```

> **Note:** The teacher information is repeated on every row. The system automatically groups students by section — you don't need to do anything special.

---

## 2. Important Rules

### Section & Teacher
- If a **section already exists** in the system, the system will use the existing one (it won't create a duplicate).
- If a **teacher already exists** (matched by email), the system will assign them to the section without creating a new account.
- If the teacher is **new**, a teacher account will be created automatically.

### Students
- If a **student already exists** (matched by Student ID), their section assignment will be **updated** — no duplicate will be created.
- If the student is **new**, a full account will be created automatically with:
  - **Username:** Their Student ID (e.g., `2026-001`)
  - **Default Password:** Their Student ID (e.g., `2026-001`)
  - **QR Code:** Automatically generated
- If `student_email` is left blank, the system will auto-generate one as `{student_id}@student.local`.

### Credentials
| Role | Login Username | Default Password |
|---|---|---|
| Teacher (new) | Teacher email | `teacher123` |
| Student (new) | Student email | Student ID (e.g., `2026-001`) |

> ⚠️ **Security:** All users should change their default password after first login.

---

## 3. How to Import

1. Go to **Admin Dashboard → Masterlist**
2. Click the **"Import Masterlist"** button
3. Select your `.csv` file
4. **Review the preview** — the system will show:
   - Number of sections and students detected
   - Any validation errors (missing fields, duplicates, etc.)
5. Click **"Confirm Import"** to proceed
6. The system will display a summary of what was created, updated, or skipped

---

## 4. Tips

- **Use Google Sheets or Excel** to create the CSV, then export/download as `.csv`.
- **Double-check Student IDs** — they must be unique across the entire system.
- **One CSV can contain multiple sections** — just list students from different sections in the same file.
- You can **import multiple times safely** — the system handles duplicates gracefully by updating existing records instead of creating new ones.

---

## 5. Sample JSON Structure (For Developers)

After parsing, the CSV is internally converted to this JSON structure:

```json
{
  "sections": [
    {
      "sectionName": "Grade 10 - Newton",
      "teacherName": "Mr. Julian Vance",
      "teacherEmail": "julian@school.com",
      "students": [
        {
          "studentId": "2026-001",
          "studentName": "Alice Sterling",
          "studentEmail": "alice@student.com",
          "yearLevel": "Grade 10",
          "schoolYear": "2026-2027"
        }
      ]
    }
  ]
}
```

This conversion happens automatically — staff only need to provide the CSV.
