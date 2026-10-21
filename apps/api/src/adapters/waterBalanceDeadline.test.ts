import { describe, it, expect, vi } from "vitest";
import { withinDeadline } from "./waterBalance";

describe("withinDeadline", () => {
  it("returns the value when work finishes in time", async () => {
    await expect(withinDeadline(Promise.resolve(7), 50, -1)).resolves.toBe(7);
  });
  it("returns the fallback when work stalls — never waits for it", async () => {
    vi.useFakeTimers();
    const p = withinDeadline(new Promise<number>(() => {}), 6_000, null);
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(p).resolves.toBeNull();
    vi.useRealTimers();
  });
  it("returns the fallback when work rejects", async () => {
    await expect(withinDeadline(Promise.reject(new Error("x")), 50, null)).resolves.toBeNull();
  });
});
