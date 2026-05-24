/**
 * CSV Masterlist Parser — Multi-Subject Format
 *
 * One row = one student enrolled in one subject.
 * The same student_id appearing on multiple rows means
 * that student is enrolled in multiple subjects.
 *
 * Required columns:
 *   section_name, adviser_name, adviser_email,
 *   subject_code, subject_name, subject_teacher_name, subject_teacher_email,
 *   student_id, student_name
 *
 * Optional columns:
 *   subject_units, schedule_day, schedule_time, student_email
 */

export interface ParsedSection {
  sectionName: string;
  adviserName: string;
  adviserEmail: string;
}

export interface ParsedSubject {
  code: string;
  name: string;
  teacherName: string;
  teacherEmail: string;
  units?: number;
  scheduleDay?: string;
  scheduleTime?: string;
}

export interface ParsedStudent {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  sectionName?: string;
  subjectCodes: string[];
}

export interface ParsedMasterlist {
  sections: ParsedSection[];
  subjects: ParsedSubject[];
  students: ParsedStudent[];
  errors: { row: number; message: string }[];
  totalStudents: number;
}

const REQUIRED_COLUMNS = [
  "section_name", "adviser_name", "adviser_email",
  "subject_code", "subject_name", "subject_teacher_name", "subject_teacher_email",
  "student_id", "student_name",
];
const OPTIONAL_COLUMNS = ["subject_units", "schedule_day", "schedule_time", "student_email"];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

const DAY_EXPANSIONS: Record<string, string> = {
  mwf: "Mon,Wed,Fri",
  tth: "Tue,Thu",
  "mwf+tth": "Mon,Tue,Wed,Thu,Fri",
  mtwtf: "Mon,Tue,Wed,Thu,Fri",
  daily: "Mon,Tue,Wed,Thu,Fri",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function normalizeScheduleDay(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (DAY_EXPANSIONS[key]) return DAY_EXPANSIONS[key];
  // If it's already comma-separated individual days, return as-is
  return raw.trim();
}

export function parseMasterlistCSV(csvText: string): ParsedMasterlist {
  const errors: { row: number; message: string }[] = [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return { sections: [], subjects: [], students: [], errors: [{ row: 0, message: "CSV must have a header row and at least one data row." }], totalStudents: 0 };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));

  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    return {
      sections: [], subjects: [], students: [],
      errors: [{ row: 1, message: `Missing required columns: ${missingColumns.join(", ")}` }],
      totalStudents: 0,
    };
  }

  const colIndex: Record<string, number> = {};
  for (const col of ALL_COLUMNS) {
    const idx = headers.indexOf(col);
    if (idx !== -1) colIndex[col] = idx;
  }

  // Deduplication maps
  const sectionMap = new Map<string, ParsedSection>();
  const subjectMap = new Map<string, ParsedSubject>();
  const studentMap = new Map<string, ParsedStudent>();

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const values = parseCSVRow(lines[i]);

    const get = (col: string): string => {
      const idx = colIndex[col];
      return idx !== undefined && idx < values.length ? values[idx].trim() : "";
    };

    const sectionName       = get("section_name");
    const adviserName       = get("adviser_name");
    const adviserEmail      = get("adviser_email");
    const subjectCode       = get("subject_code");
    const subjectName       = get("subject_name");
    const subjectTeacher    = get("subject_teacher_name");
    const subjectTeacherEmail = get("subject_teacher_email");
    const studentId         = get("student_id");
    const studentName       = get("student_name");
    const studentEmail      = get("student_email") || undefined;
    const subjectUnitsStr   = get("subject_units");
    const rawScheduleDay    = get("schedule_day");
    const scheduleDay       = rawScheduleDay ? normalizeScheduleDay(rawScheduleDay) : undefined;
    const scheduleTime      = get("schedule_time") || undefined;

    // Validate required fields
    const required: [string, string][] = [
      ["section_name", sectionName], ["adviser_name", adviserName], ["adviser_email", adviserEmail],
      ["subject_code", subjectCode], ["subject_name", subjectName],
      ["subject_teacher_name", subjectTeacher], ["subject_teacher_email", subjectTeacherEmail],
      ["student_id", studentId], ["student_name", studentName],
    ];
    let rowValid = true;
    for (const [field, val] of required) {
      if (!val) { errors.push({ row: rowNum, message: `Missing ${field}.` }); rowValid = false; }
    }
    if (!rowValid) continue;

    // Upsert section
    if (!sectionMap.has(sectionName)) {
      sectionMap.set(sectionName, { sectionName, adviserName, adviserEmail });
    }

    // Upsert subject
    if (!subjectMap.has(subjectCode)) {
      subjectMap.set(subjectCode, {
        code: subjectCode,
        name: subjectName,
        teacherName: subjectTeacher,
        teacherEmail: subjectTeacherEmail,
        units: subjectUnitsStr ? parseInt(subjectUnitsStr, 10) || undefined : undefined,
        scheduleDay,
        scheduleTime,
      });
    }

    // Upsert student + accumulate subject enrollments
    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        studentId,
        studentName,
        studentEmail,
        sectionName,
        subjectCodes: [],
      });
    }
    const student = studentMap.get(studentId)!;
    if (!student.subjectCodes.includes(subjectCode)) {
      student.subjectCodes.push(subjectCode);
    }
    // Keep the most recent name if repeated
    if (studentName) student.studentName = studentName;
  }

  const students = Array.from(studentMap.values());

  return {
    sections: Array.from(sectionMap.values()),
    subjects: Array.from(subjectMap.values()),
    students,
    errors,
    totalStudents: students.length,
  };
}

/**
 * Parse a single CSV row, handling quoted fields with commas inside.
 * e.g. `"Dela Cruz, Juan",2026-001` → ["Dela Cruz, Juan", "2026-001"]
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ",") { result.push(current); current = ""; }
      else current += char;
    }
  }
  result.push(current);
  return result;
}
