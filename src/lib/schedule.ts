// ---------------------------------------------------------------------------
// Pure helpers for interpreting a Subject's schedule and deciding whether a
// scan should be marked PRESENT or LATE. Kept side-effect free so it is easy to
// unit-test (see src/lib/__tests__/schedule.test.ts).
// ---------------------------------------------------------------------------

import type { AttendanceStatus } from "@prisma/client";

const DAY_ALIASES: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

// Compact single/double-letter day codes, e.g. "MWF", "TTh", "MTWThF".
const COMPACT_ORDER: [string, number][] = [
  ["Th", 4], ["Su", 0], ["M", 1], ["T", 2], ["W", 3], ["F", 5], ["S", 6],
];

/** Day-of-week (0=Sun..6=Sat) and minutes-since-midnight, in Asia/Manila. */
export function manilaNowParts(now: Date = new Date()): { dow: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dow = DAY_ALIASES[get("weekday").toLowerCase()] ?? new Date(now).getUTCDay();
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some runtimes emit "24" for midnight
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  return { dow, minutes };
}

/** Parse a schedule-day string into a set of day-of-week numbers. */
export function parseScheduleDays(scheduleDay?: string | null): Set<number> {
  const days = new Set<number>();
  if (!scheduleDay) return days;
  const raw = scheduleDay.trim();

  // Delimited form: "Mon,Wed,Fri" / "Tue Thu" / "Monday/Wednesday".
  const tokens = raw.toLowerCase().split(/[\s,/|&+]+/).filter(Boolean);
  let matchedNamed = false;
  for (const tok of tokens) {
    if (tok in DAY_ALIASES) {
      days.add(DAY_ALIASES[tok]);
      matchedNamed = true;
    }
  }
  if (matchedNamed) return days;

  // Compact form: "MWF", "TTh". Greedily consume "Th"/"Su" before single letters.
  let s = raw.replace(/[\s,]/g, "");
  while (s.length) {
    const hit = COMPACT_ORDER.find(([code]) => s.startsWith(code));
    if (!hit) { s = s.slice(1); continue; }
    days.add(hit[1]);
    s = s.slice(hit[0].length);
  }
  return days;
}

/** Start time of a schedule ("08:00-09:30" or "08:00") as minutes since midnight, or null. */
export function parseStartMinutes(scheduleTime?: string | null): number | null {
  if (!scheduleTime) return null;
  const m = scheduleTime.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export interface ScanDecision {
  status: AttendanceStatus;
  /** true when the schedule was known and the scan fell after the grace window. */
  late: boolean;
  /** true when today is not one of the subject's scheduled days (informational). */
  offSchedule: boolean;
}

/**
 * Decide PRESENT vs LATE for a scan, given the subject's schedule and a grace
 * period. When no start time is known we cannot judge lateness, so default to
 * PRESENT (preserving the previous behavior).
 */
export function decideScanStatus(
  subject: { scheduleDay?: string | null; scheduleTime?: string | null },
  graceMinutes: number,
  now: Date = new Date()
): ScanDecision {
  const { dow, minutes } = manilaNowParts(now);
  const days = parseScheduleDays(subject.scheduleDay);
  const offSchedule = days.size > 0 && !days.has(dow);

  const start = parseStartMinutes(subject.scheduleTime);
  if (start === null) {
    return { status: "PRESENT", late: false, offSchedule };
  }

  const late = minutes > start + Math.max(0, graceMinutes);
  return { status: late ? "LATE" : "PRESENT", late, offSchedule };
}
