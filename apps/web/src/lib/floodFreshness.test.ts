import { expect, it } from "vitest";
import { freshTimestamp } from "./floodFreshness";
it("rejects missing, invalid, expired and future operational clocks", () => {
  const now = Date.parse("2026-10-21T15:00:00Z");
  for (const input of [null, undefined, "invalid", "2026-10-21T13:00:00Z", "2026-10-21T15:06:00Z"]) expect(freshTimestamp(input, now, 90 * 60_000)).toBe(false);
  expect(freshTimestamp("2026-10-21T13:30:00Z", now, 90 * 60_000)).toBe(true);
  expect(freshTimestamp("2026-10-21T15:04:00Z", now, 90 * 60_000)).toBe(true);
});
