import { describe, it, expect } from "vitest";
import { formatRelative } from "../src/relativeTime";

const now = 1_000_000_000_000;
const ago = (ms: number) => now - ms;
const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR, WEEK = 7 * DAY;

describe("formatRelative", () => {
  it("shows 'now' under a minute", () => {
    expect(formatRelative(ago(30 * SEC), now)).toBe("now");
  });
  it("shows minutes", () => {
    expect(formatRelative(ago(5 * MIN), now)).toBe("5m");
  });
  it("shows hours", () => {
    expect(formatRelative(ago(3 * HOUR), now)).toBe("3h");
  });
  it("shows days", () => {
    expect(formatRelative(ago(2 * DAY), now)).toBe("2d");
  });
  it("shows weeks", () => {
    expect(formatRelative(ago(3 * WEEK), now)).toBe("3w");
  });
  it("shows months beyond ~4 weeks", () => {
    expect(formatRelative(ago(60 * DAY), now)).toBe("2mo");
  });
});
