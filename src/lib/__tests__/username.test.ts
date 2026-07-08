import { describe, it, expect } from "vitest";
import { deriveUsername, normalizeUsername, normalizeEmail } from "../username";

describe("deriveUsername", () => {
  it("uses first + last name, dropping middle names", () => {
    expect(deriveUsername("Michael G. Fernandez")).toBe("michaelfernandez");
  });
  it("handles a single name", () => {
    expect(deriveUsername("Jose")).toBe("jose");
  });
  it("strips non-alphanumerics", () => {
    expect(deriveUsername("O'Brien, Sean")).toBe("obriensean");
  });
  it("returns empty string for unusable input", () => {
    expect(deriveUsername("")).toBe("");
    expect(deriveUsername(null)).toBe("");
  });
});

describe("normalizeUsername", () => {
  it("lowercases and strips invalid characters", () => {
    expect(normalizeUsername("John.Doe!")).toBe("johndoe");
  });
  it("returns null when nothing usable remains", () => {
    expect(normalizeUsername("  ...  ")).toBeNull();
    expect(normalizeUsername(null)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
  it("returns null for empty input", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});
