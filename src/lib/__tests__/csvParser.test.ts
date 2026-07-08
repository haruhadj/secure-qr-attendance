import { describe, it, expect } from "vitest";
import { parseMasterlistCSV } from "../csvParser";

const HEADER =
  "section_name,adviser_name,adviser_email,subject_code,subject_name,subject_teacher_name,subject_teacher_email,student_id,student_name,schedule_day,schedule_time";

describe("parseMasterlistCSV", () => {
  it("accumulates multiple subjects for the same student across rows", () => {
    const csv = [
      HEADER,
      `BSCS 3,Adviser A,a@x.com,OS101,Operating Systems,T One,t1@x.com,2026-001,Juan Cruz,MWF,08:00-09:30`,
      `BSCS 3,Adviser A,a@x.com,SE102,Software Eng,T Two,t2@x.com,2026-001,Juan Cruz,TTh,10:00-11:30`,
    ].join("\n");

    const result = parseMasterlistCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].subjectCodes.sort()).toEqual(["OS101", "SE102"]);
    expect(result.subjects).toHaveLength(2);
    expect(result.sections).toHaveLength(1);
  });

  it("expands compact schedule-day codes", () => {
    const csv = [
      HEADER,
      `BSCS 3,Adviser A,a@x.com,OS101,Operating Systems,T One,t1@x.com,2026-001,Juan Cruz,MWF,08:00-09:30`,
    ].join("\n");
    const result = parseMasterlistCSV(csv);
    expect(result.subjects[0].scheduleDay).toBe("Mon,Wed,Fri");
  });

  it("handles quoted fields containing commas", () => {
    const csv = [
      HEADER,
      `BSCS 3,Adviser A,a@x.com,OS101,Operating Systems,T One,t1@x.com,2026-001,"Cruz, Juan",MWF,08:00-09:30`,
    ].join("\n");
    const result = parseMasterlistCSV(csv);
    expect(result.students[0].studentName).toBe("Cruz, Juan");
  });

  it("reports missing required columns", () => {
    const csv = ["section_name,student_id", "BSCS 3,2026-001"].join("\n");
    const result = parseMasterlistCSV(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/Missing required columns/);
  });

  it("flags a row missing a required value", () => {
    const csv = [
      HEADER,
      `BSCS 3,Adviser A,a@x.com,OS101,Operating Systems,T One,t1@x.com,,No Id Student,MWF,08:00-09:30`,
    ].join("\n");
    const result = parseMasterlistCSV(csv);
    expect(result.students).toHaveLength(0);
    expect(result.errors.some((e) => /student_id/.test(e.message))).toBe(true);
  });
});
