import { describe, it, expect } from "vitest";
import { parseScheduleDays, parseStartMinutes, decideScanStatus, manilaNowParts } from "../schedule";

// Manila is UTC+8 with no DST, so a UTC instant maps to Manila by +8h.
// 2026-01-05 is a Monday.
const mondayManila = (utcHHMM: string) => new Date(`2026-01-05T${utcHHMM}:00Z`);

describe("parseScheduleDays", () => {
  it("parses comma/space separated named days", () => {
    expect([...parseScheduleDays("Mon,Wed,Fri")].sort()).toEqual([1, 3, 5]);
    expect([...parseScheduleDays("Tue Thu")].sort()).toEqual([2, 4]);
    expect([...parseScheduleDays("Monday/Wednesday")].sort()).toEqual([1, 3]);
  });

  it("parses compact letter codes", () => {
    expect([...parseScheduleDays("MWF")].sort()).toEqual([1, 3, 5]);
    expect([...parseScheduleDays("TTh")].sort()).toEqual([2, 4]);
  });

  it("returns empty set for blank input", () => {
    expect(parseScheduleDays("").size).toBe(0);
    expect(parseScheduleDays(null).size).toBe(0);
  });
});

describe("parseStartMinutes", () => {
  it("parses a range and a bare time", () => {
    expect(parseStartMinutes("08:00-09:30")).toBe(480);
    expect(parseStartMinutes("8:05")).toBe(485);
    expect(parseStartMinutes("13:00-14:30")).toBe(780);
  });

  it("returns null for missing/invalid times", () => {
    expect(parseStartMinutes(null)).toBeNull();
    expect(parseStartMinutes("N/A")).toBeNull();
    expect(parseStartMinutes("99:99")).toBeNull();
  });
});

describe("manilaNowParts", () => {
  it("converts a UTC instant to Manila day/minutes", () => {
    const { dow, minutes } = manilaNowParts(mondayManila("00:10")); // 08:10 Manila Monday
    expect(dow).toBe(1);
    expect(minutes).toBe(8 * 60 + 10);
  });
});

describe("decideScanStatus", () => {
  const subject = { scheduleDay: "Mon,Wed,Fri", scheduleTime: "08:00-09:30" };

  it("marks PRESENT within the grace window", () => {
    const d = decideScanStatus(subject, 15, mondayManila("00:10")); // 08:10 Manila
    expect(d.status).toBe("PRESENT");
    expect(d.late).toBe(false);
    expect(d.offSchedule).toBe(false);
  });

  it("marks LATE after the grace window", () => {
    const d = decideScanStatus(subject, 15, mondayManila("00:20")); // 08:20 Manila
    expect(d.status).toBe("LATE");
    expect(d.late).toBe(true);
  });

  it("defaults to PRESENT when no start time is known", () => {
    const d = decideScanStatus({ scheduleDay: "Mon", scheduleTime: null }, 15, mondayManila("05:00"));
    expect(d.status).toBe("PRESENT");
    expect(d.late).toBe(false);
  });

  it("flags a scan on a non-scheduled day", () => {
    const d = decideScanStatus({ scheduleDay: "Tue,Thu", scheduleTime: "08:00" }, 15, mondayManila("00:05"));
    expect(d.offSchedule).toBe(true);
  });
});
