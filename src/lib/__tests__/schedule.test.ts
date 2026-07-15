import { describe, it, expect } from "vitest";
import {
  parseScheduleDays,
  parseStartMinutes,
  parseEndMinutes,
  decideScanStatus,
  manilaNowParts,
  parsePerDayTimes,
  startMinutesForDay,
  endMinutesForDay,
  absentCutoffForDay,
  formatSchedule,
  decodeSchedule,
  encodeSchedule,
  splitTimeRange,
  joinTimeRange,
} from "../schedule";

// Manila is UTC+8 with no DST, so a UTC instant maps to Manila by +8h.
// 2026-01-05 is a Monday. 2026-01-07 is a Wednesday.
const mondayManila = (utcHHMM: string) => new Date(`2026-01-05T${utcHHMM}:00Z`);
const wednesdayManila = (utcHHMM: string) => new Date(`2026-01-07T${utcHHMM}:00Z`);

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

describe("parseEndMinutes", () => {
  it("parses the end of a range", () => {
    expect(parseEndMinutes("08:00-09:30")).toBe(570);
    expect(parseEndMinutes("13:00-14:30")).toBe(870);
  });

  it("returns null when there is no range or the end is invalid", () => {
    expect(parseEndMinutes("8:05")).toBeNull();
    expect(parseEndMinutes(null)).toBeNull();
    expect(parseEndMinutes("08:00-99:99")).toBeNull();
  });
});

describe("endMinutesForDay / absentCutoffForDay", () => {
  it("endMinutesForDay picks the right day, honoring per-day and uniform forms", () => {
    const perDay = "Mon=08:00-09:30;Wed=13:00-14:30";
    expect(endMinutesForDay(perDay, 1)).toBe(570); // Mon 09:30
    expect(endMinutesForDay(perDay, 3)).toBe(870); // Wed 14:30
    expect(endMinutesForDay(perDay, 5)).toBeNull(); // Fri not scheduled
    expect(endMinutesForDay("08:00-09:30", 5)).toBe(570); // uniform applies to any day
  });

  it("absentCutoffForDay prefers the explicit end time", () => {
    const subject = { scheduleTime: "08:00-09:30" };
    expect(absentCutoffForDay(subject, 1, 15)).toBe(570); // 09:30, not start+grace
  });

  it("absentCutoffForDay falls back to start + grace when there is no end time", () => {
    const subject = { scheduleTime: "08:00" };
    expect(absentCutoffForDay(subject, 1, 15)).toBe(495); // 08:00 + 15m
  });

  it("absentCutoffForDay returns null with no usable start time", () => {
    expect(absentCutoffForDay({ scheduleTime: null }, 1, 15)).toBeNull();
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

  it("keeps a scan PRESENT at exactly 30 minutes and marks it LATE after", () => {
    expect(decideScanStatus(subject, 30, mondayManila("00:30")).status).toBe("PRESENT");
    expect(decideScanStatus(subject, 30, mondayManila("00:31")).status).toBe("LATE");
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

  it("honors independent per-day times", () => {
    // Mon starts 08:00, Wed starts 13:00.
    const subject = { scheduleDay: "Mon,Wed", scheduleTime: "Mon=08:00-09:30;Wed=13:00-14:30" };

    // 08:20 Manila Monday → LATE (past Mon 08:00 + 15m grace).
    expect(decideScanStatus(subject, 15, mondayManila("00:20")).status).toBe("LATE");
    // 08:20 Manila Wednesday → PRESENT (Wed doesn't start until 13:00).
    expect(decideScanStatus(subject, 15, wednesdayManila("00:20")).status).toBe("PRESENT");
    // 13:20 Manila Wednesday → LATE (past Wed 13:00 + grace).
    expect(decideScanStatus(subject, 15, wednesdayManila("05:20")).status).toBe("LATE");
  });
});

describe("per-day schedule encoding", () => {
  it("parsePerDayTimes reads the day=time;day=time form and null for uniform", () => {
    expect(parsePerDayTimes("Mon=08:00-09:30;Wed=13:00-14:30")).toEqual({
      Mon: "08:00-09:30",
      Wed: "13:00-14:30",
    });
    expect(parsePerDayTimes("08:00-09:30")).toBeNull();
    expect(parsePerDayTimes(null)).toBeNull();
  });

  it("startMinutesForDay picks the right day, falling back to uniform", () => {
    const perDay = "Mon=08:00-09:30;Wed=13:00-14:30";
    expect(startMinutesForDay(perDay, 1)).toBe(480); // Mon 08:00
    expect(startMinutesForDay(perDay, 3)).toBe(780); // Wed 13:00
    expect(startMinutesForDay(perDay, 5)).toBeNull(); // Fri not scheduled
    expect(startMinutesForDay("08:00-09:30", 5)).toBe(480); // uniform applies to any day
  });

  it("formatSchedule renders friendly text for both forms", () => {
    expect(formatSchedule("Mon,Wed", "Mon=08:00-09:30;Wed=13:00-14:30")).toBe(
      "Mon 08:00-09:30 · Wed 13:00-14:30"
    );
    expect(formatSchedule("Mon,Wed,Fri", "08:00-09:30")).toBe("Mon,Wed,Fri · 08:00-09:30");
    expect(formatSchedule("Mon,Wed", null)).toBe("Mon,Wed");
    expect(formatSchedule(null, null)).toBe("");
  });

  it("decode/encode round-trips uniform and per-day schedules", () => {
    // Uniform legacy value expands to a time per day, and collapses back to uniform.
    const uni = decodeSchedule("Mon,Wed,Fri", "08:00-09:30");
    expect(uni.days).toEqual(["Mon", "Wed", "Fri"]);
    expect(uni.times).toEqual({ Mon: "08:00-09:30", Wed: "08:00-09:30", Fri: "08:00-09:30" });
    expect(encodeSchedule(uni.days, uni.times)).toEqual({
      scheduleDay: "Mon,Wed,Fri",
      scheduleTime: "08:00-09:30",
    });

    // Differing times stay per-day encoded.
    const enc = encodeSchedule(["Mon", "Wed"], { Mon: "08:00-09:30", Wed: "13:00-14:30" });
    expect(enc).toEqual({ scheduleDay: "Mon,Wed", scheduleTime: "Mon=08:00-09:30;Wed=13:00-14:30" });
    const back = decodeSchedule(enc.scheduleDay, enc.scheduleTime);
    expect(back.days).toEqual(["Mon", "Wed"]);
    expect(back.times).toEqual({ Mon: "08:00-09:30", Wed: "13:00-14:30" });
  });

  it("encodeSchedule drops times with no days and blanks", () => {
    expect(encodeSchedule([], {})).toEqual({ scheduleDay: null, scheduleTime: null });
    expect(encodeSchedule(["Mon"], {})).toEqual({ scheduleDay: "Mon", scheduleTime: null });
  });

  it("splitTimeRange / joinTimeRange bridge the stored form and native time inputs", () => {
    expect(splitTimeRange("08:00-09:30")).toEqual({ start: "08:00", end: "09:30" });
    expect(splitTimeRange("8:05")).toEqual({ start: "08:05", end: "" }); // pads for <input type=time>
    expect(splitTimeRange(null)).toEqual({ start: "", end: "" });

    expect(joinTimeRange("08:00", "09:30")).toBe("08:00-09:30");
    expect(joinTimeRange("08:00", "")).toBe("08:00"); // start only
    expect(joinTimeRange("", "09:30")).toBe(""); // end without start is dropped
  });
});
