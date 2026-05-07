/**
 * CSV Masterlist Parser
 * 
 * Parses a flat CSV file (one row per student) into a structured JSON format
 * grouped by section, with validation and error reporting.
 */

export interface ParsedStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  yearLevel: string;
  schoolYear: string;
}

export interface ParsedSection {
  sectionName: string;
  teacherName: string;
  teacherEmail: string;
  students: ParsedStudent[];
}

export interface ParsedMasterlist {
  sections: ParsedSection[];
  errors: { row: number; message: string }[];
  totalStudents: number;
}

// Expected CSV column headers (case-insensitive, trimmed)
const REQUIRED_COLUMNS = ["section_name", "teacher_name", "teacher_email", "student_id", "student_name"];
const OPTIONAL_COLUMNS = ["student_email", "year_level", "school_year"];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

/**
 * Parse raw CSV text into a structured masterlist.
 */
export function parseMasterlistCSV(csvText: string): ParsedMasterlist {
  const errors: { row: number; message: string }[] = [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return { sections: [], errors: [{ row: 0, message: "CSV must have a header row and at least one data row." }], totalStudents: 0 };
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));

  // Validate required columns exist
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    return {
      sections: [],
      errors: [{ row: 1, message: `Missing required columns: ${missingColumns.join(", ")}` }],
      totalStudents: 0,
    };
  }

  // Build column index map
  const colIndex: Record<string, number> = {};
  for (const col of ALL_COLUMNS) {
    const idx = headers.indexOf(col);
    if (idx !== -1) colIndex[col] = idx;
  }

  // Parse data rows
  const sectionMap = new Map<string, ParsedSection>();
  const seenStudentIds = new Set<string>();
  let totalStudents = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // 1-indexed for user display
    const values = parseCSVRow(lines[i]);

    // Get values by column name
    const get = (col: string): string => {
      const idx = colIndex[col];
      return idx !== undefined && idx < values.length ? values[idx].trim() : "";
    };

    const sectionName = get("section_name");
    const teacherName = get("teacher_name");
    const teacherEmail = get("teacher_email");
    const studentId = get("student_id");
    const studentName = get("student_name");
    const studentEmail = get("student_email");
    const yearLevel = get("year_level");
    const schoolYear = get("school_year");

    // Validate required fields
    if (!sectionName) {
      errors.push({ row: rowNum, message: "Missing section_name." });
      continue;
    }
    if (!teacherName) {
      errors.push({ row: rowNum, message: "Missing teacher_name." });
      continue;
    }
    if (!teacherEmail) {
      errors.push({ row: rowNum, message: "Missing teacher_email." });
      continue;
    }
    if (!studentId) {
      errors.push({ row: rowNum, message: "Missing student_id." });
      continue;
    }
    if (!studentName) {
      errors.push({ row: rowNum, message: "Missing student_name." });
      continue;
    }

    // Check for duplicate student IDs within this CSV
    if (seenStudentIds.has(studentId)) {
      errors.push({ row: rowNum, message: `Duplicate student_id "${studentId}" found in CSV.` });
      continue;
    }
    seenStudentIds.add(studentId);

    // Auto-generate email if missing
    const finalEmail = studentEmail || `${studentId.replace(/\s+/g, "")}@student.local`;

    // Group by section
    if (!sectionMap.has(sectionName)) {
      sectionMap.set(sectionName, {
        sectionName,
        teacherName,
        teacherEmail,
        students: [],
      });
    }

    sectionMap.get(sectionName)!.students.push({
      studentId,
      studentName,
      studentEmail: finalEmail,
      yearLevel,
      schoolYear,
    });

    totalStudents++;
  }

  return {
    sections: Array.from(sectionMap.values()),
    errors,
    totalStudents,
  };
}

/**
 * Parse a single CSV row, handling quoted fields with commas inside them.
 * e.g., `"Dela Cruz, Juan",2026-001` → ["Dela Cruz, Juan", "2026-001"]
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current); // push last field
  return result;
}
