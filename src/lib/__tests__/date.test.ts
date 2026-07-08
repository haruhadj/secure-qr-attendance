import { describe, it, expect } from "vitest";
import { getUTCMidnight, parseUTCDate } from "../date";

describe("getUTCMidnight", () => {
  it("truncates a timestamp to UTC midnight", () => {
    const d = getUTCMidnight(new Date("2026-03-15T13:45:30Z"));
    expect(d.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("accepts a date string", () => {
    expect(getUTCMidnight("2026-03-15T23:59:59Z").toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });
});

describe("parseUTCDate", () => {
  it("parses YYYY-MM-DD to UTC midnight", () => {
    expect(parseUTCDate("2026-03-15").toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });
});
