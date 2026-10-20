import { afterEach, describe, expect, it, vi } from "vitest";
import { ageState, fetchWithRetry, readLocal, type FeedState } from "./useFeed";

const stamp = "2026-10-19T12:00:00.000Z";
const feed = { features: [{ value: 12 }], meta: { source: "test", fetchedAt: stamp, ageMinutes: 7, fallbackTier: "live" } };
const state: FeedState<{ value: number }> = { data: feed.features, ageMinutes: 7, ageUpdatedAt: Date.parse(stamp), loadedAt: stamp, fallbackTier: "live", error: null };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("feed freshness", () => {
  it("ages unchanged payloads monotonically without replacing their data", () => {
    const aged = ageState(state, Date.parse(stamp) + 185_000);
    expect(aged.ageMinutes).toBe(10);
    expect(aged.data).toBe(state.data);
    expect(ageState(aged, Date.parse(stamp) + 240_000).ageMinutes).toBe(11);
    expect(ageState(aged, Date.parse(stamp) - 60_000).ageMinutes).toBe(10);
  });
  it("adds offline elapsed time to persisted upstream age, including old cache records", () => {
    vi.useFakeTimers(); vi.setSystemTime(Date.parse(stamp) + 3_600_000);
    const { ageUpdatedAt: _, ...legacy } = state;
    vi.stubGlobal("window", { localStorage: { getItem: () => JSON.stringify({ savedAt: Date.parse(stamp), state: legacy }) } });
    expect(readLocal("/api/test")).toMatchObject({ ageMinutes: 67, fallbackTier: "cache" });
  });
  it("rejects expired or future browser cache timestamps", () => {
    vi.useFakeTimers(); vi.setSystemTime(Date.parse(stamp));
    let savedAt = Date.parse(stamp) + 1;
    vi.stubGlobal("window", { localStorage: { getItem: () => JSON.stringify({ savedAt, state }) } });
    expect(readLocal("/api/test")).toBeNull();
    savedAt = Date.parse(stamp) - 24 * 3_600_000 - 1;
    expect(readLocal("/api/test")).toBeNull();
  });
});

describe("feed requests", () => {
  it("allows the aggregate feed budget on warm polls without aborting at ten seconds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url, { signal }: RequestInit) => new Promise<Response>((resolve, reject) => {
      setTimeout(() => resolve(Response.json(feed)), 12_000);
      signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = fetchWithRetry("/api/flood/operations", new AbortController().signal, false, 25_000);
    await vi.advanceTimersByTimeAsync(12_000);
    expect(await result).toEqual(feed);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("bounds stalled response bodies as well as headers on all retries", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (_url, { signal }: RequestInit) => new Response(new ReadableStream({
      start(controller) { signal!.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError"))); },
    })));
    vi.stubGlobal("fetch", fetchMock);
    const result = fetchWithRetry("/api/test", new AbortController().signal);
    const assertion = expect(result).rejects.toThrow("Request timed out after 10s");
    await vi.advanceTimersByTimeAsync(33_000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels body consumption when a path changes or the component unmounts", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url, { signal }: RequestInit) => new Response(new ReadableStream({
      start(controller) { signal!.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError"))); },
    }))));
    const ctrl = new AbortController();
    const result = fetchWithRetry("/api/test", ctrl.signal);
    const assertion = expect(result).rejects.toMatchObject({ name: "AbortError" });
    await Promise.resolve(); ctrl.abort(); await assertion;
  });
  it("does not retry permanent client errors", async () => {
    const fetchMock = vi.fn(async () => new Response("missing", { status: 404, statusText: "Not Found" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchWithRetry("/api/test", new AbortController().signal)).rejects.toThrow("404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("retries transient server errors and returns a valid feed", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("error", { status: 503 })).mockResolvedValueOnce(Response.json(feed)));
    const result = fetchWithRetry("/api/test", new AbortController().signal);
    await vi.advanceTimersByTimeAsync(800);
    expect(await result).toEqual(feed);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("aborts backoff without issuing another request", async () => {
    vi.useFakeTimers(); const ctrl = new AbortController();
    const fetchMock = vi.fn(async () => new Response("error", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = fetchWithRetry("/api/test", ctrl.signal);
    const assertion = expect(result).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(1); ctrl.abort(); await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

it("preserves scenario identity instead of relabelling reference data as cached telemetry", () => {
  vi.useFakeTimers(); vi.setSystemTime(Date.parse(stamp) + 60_000);
  vi.stubGlobal("window", { localStorage: { getItem: () => JSON.stringify({ savedAt: Date.parse(stamp), state: { ...state, fallbackTier: "scenario" } }) } });
  expect(readLocal("/api/test")).toMatchObject({ fallbackTier: "scenario", ageMinutes: 8 });
});
