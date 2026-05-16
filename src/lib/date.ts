import { startOfDay } from "date-fns";

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Manila" });
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "Asia/Manila" });
}

export function formatDateTime(date: Date | string): string {
  return `${formatTime(date)} · ${formatDate(date)}`;
}

/**
 * Returns a Date object representing the midnight UTC of the given date.
 * This ensures consistency across different server/client timezones.
 */
export function getUTCMidnight(date: Date | string = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date;
  // Use UTC methods to ensure we are getting the correct UTC day regardless of server timezone
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object.
 */
export function parseUTCDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
