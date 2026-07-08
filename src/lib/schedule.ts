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

// ---------------------------------------------------------------------------
// Per-day schedule times. A subject may set a different time on each day, e.g.
// Mon 08:00-09:30 but Wed 13:00-14:30. This is encoded in the existing
// `scheduleTime` column as `Mon=08:00-09:30;Wed=13:00-14:30` (day label =
// time, segments joined by ";"). A plain time with no "=" (e.g. "08:00-09:30")
// is the legacy uniform form and applies to every scheduled day — so old data
// keeps working unchanged.
// ---------------------------------------------------------------------------

/** Day-of-week number (0=Sun..6=Sat) → canonical 3-letter label. */
const DOW_TO_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Storage/display order — weekdays first, Sunday last. */
const LABEL_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Normalize any day token ("monday", "M", "Wed") to its canonical label, or null. */
function canonLabel(dayToken: string): string | null {
  const key = dayToken.trim().toLowerCase();
  if (key in DAY_ALIASES) return DOW_TO_LABEL[DAY_ALIASES[key]];
  // Compact single/double-letter codes (a lone "M", "Th", …).
  const compact = COMPACT_ORDER.find(([code]) => code.toLowerCase() === key);
  return compact ? DOW_TO_LABEL[compact[1]] : null;
}

/**
 * Parse a per-day time encoding into a { label: time } map, or null when the
 * value is a legacy uniform time (no "=").
 */
export function parsePerDayTimes(scheduleTime?: string | null): Record<string, string> | null {
  if (!scheduleTime || !scheduleTime.includes("=")) return null;
  const out: Record<string, string> = {};
  for (const seg of scheduleTime.split(";")) {
    const eq = seg.indexOf("=");
    if (eq === -1) continue;
    const label = canonLabel(seg.slice(0, eq));
    const time = seg.slice(eq + 1).trim();
    if (label && time) out[label] = time;
  }
  return Object.keys(out).length ? out : null;
}

/** Start minutes for a specific day-of-week, honoring per-day times. */
export function startMinutesForDay(scheduleTime: string | null | undefined, dow: number): number | null {
  const perDay = parsePerDayTimes(scheduleTime);
  if (perDay) {
    const label = DOW_TO_LABEL[dow];
    return label in perDay ? parseStartMinutes(perDay[label]) : null;
  }
  return parseStartMinutes(scheduleTime);
}

/** Human-friendly one-line schedule, e.g. "Mon 08:00-09:30 · Wed 13:00-14:30" or "Mon,Wed,Fri · 08:00-09:30". */
export function formatSchedule(scheduleDay?: string | null, scheduleTime?: string | null): string {
  const perDay = parsePerDayTimes(scheduleTime);
  if (perDay) {
    return LABEL_ORDER.filter((l) => l in perDay).map((l) => `${l} ${perDay[l]}`).join(" · ");
  }
  const day = (scheduleDay ?? "").trim();
  const time = (scheduleTime ?? "").trim();
  if (day && time) return `${day} · ${time}`;
  return day || time || "";
}

/** Split stored scheduleDay/scheduleTime into the editor's { days, times } shape. */
export function decodeSchedule(
  scheduleDay?: string | null,
  scheduleTime?: string | null
): { days: string[]; times: Record<string, string> } {
  const days: string[] = [];
  for (const tok of (scheduleDay ?? "").split(/[\s,/|&+]+/)) {
    const label = canonLabel(tok);
    if (label && !days.includes(label)) days.push(label);
  }
  const times: Record<string, string> = {};
  const perDay = parsePerDayTimes(scheduleTime);
  if (perDay) {
    for (const [label, t] of Object.entries(perDay)) {
      times[label] = t;
      if (!days.includes(label)) days.push(label);
    }
  } else {
    const uniform = (scheduleTime ?? "").trim();
    if (uniform) for (const d of days) times[d] = uniform;
  }
  days.sort((a, b) => LABEL_ORDER.indexOf(a) - LABEL_ORDER.indexOf(b));
  return { days, times };
}

/**
 * Collapse the editor's { days, times } back into stored columns. When every
 * selected day shares the same time we store the clean uniform form; otherwise
 * we store the per-day encoding.
 */
export function encodeSchedule(
  days: string[],
  times: Record<string, string>
): { scheduleDay: string | null; scheduleTime: string | null } {
  const ordered = days
    .filter((d) => LABEL_ORDER.includes(d))
    .sort((a, b) => LABEL_ORDER.indexOf(a) - LABEL_ORDER.indexOf(b));
  const scheduleDay = ordered.length ? ordered.join(",") : null;

  const withTime = ordered.filter((d) => (times[d] ?? "").trim());
  if (withTime.length === 0) return { scheduleDay, scheduleTime: null };

  const first = (times[ordered[0]] ?? "").trim();
  const uniform =
    withTime.length === ordered.length && ordered.every((d) => (times[d] ?? "").trim() === first);
  if (uniform) return { scheduleDay, scheduleTime: first };

  const scheduleTime = withTime.map((d) => `${d}=${(times[d]).trim()}`).join(";");
  return { scheduleDay, scheduleTime };
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

  const start = startMinutesForDay(subject.scheduleTime, dow);
  if (start === null) {
    return { status: "PRESENT", late: false, offSchedule };
  }

  const late = minutes > start + Math.max(0, graceMinutes);
  return { status: late ? "LATE" : "PRESENT", late, offSchedule };
}
