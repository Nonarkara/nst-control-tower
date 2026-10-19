import { useCallback, useEffect, useRef, useState } from "react";
import type { FallbackTier, NormalizedFeed } from "@nst/shared";

export interface FeedState<T> {
  /** Clock anchor for ageMinutes; persisted so offline reloads keep ageing. */
  ageUpdatedAt: number;
  data: T[];
  ageMinutes: number;
  fallbackTier: FallbackTier | "loading";
  loadedAt: string | null;
  error: string | null;
  /** Upstream `meta.note` — explains *why* a feed is degraded (e.g. "Missing
   *  AISSTREAM_TOKEN"). Surfaced in the UI so a dead toggle is never silent. */
  note?: string;
}

const STORAGE_PREFIX = "nst:feed:";
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;
const UNAVAILABLE_AFTER_FAILS = 3;
// Cold feeds may need a direct-provider timeout followed by a relay request.
// The first poll allows 25 s per attempt; warm polls use 10 s.
const REQUEST_TIMEOUT_MS = 10_000;
const FIRST_REQUEST_TIMEOUT_MS = 25_000;
const RETRIES = 2;
const FIRST_RETRIES = 4;
// setTimeout/setInterval delays are stored as a 32-bit signed int internally;
// a delay above this clamps to ~0 in most engines, firing (and re-firing) almost
// immediately instead of waiting — a caller passing e.g. a 30-day pollMs would
// silently hammer its endpoint every tick instead of once a month.
const MAX_SAFE_INTERVAL_MS = 2_147_483_647;

function storageKey(path: string): string {
  return `${STORAGE_PREFIX}${path}`;
}

export function readLocal<T>(path: string): FeedState<T> | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey(path)) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: FeedState<T>; savedAt: number };
    const elapsed = Date.now() - parsed?.savedAt;
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > MAX_CACHE_AGE_MS || !Array.isArray(parsed.state?.data)) return null;
    return ageState({ ...parsed.state, ageUpdatedAt: parsed.state.ageUpdatedAt ?? parsed.savedAt, fallbackTier: retainedTier(parsed.state.fallbackTier) });
  } catch {
    return null;
  }
}

function retainedTier(tier: FeedState<unknown>["fallbackTier"]): FeedState<unknown>["fallbackTier"] {
  // Reference/scenario data must keep its identity when persisted or degraded.
  return tier === "scenario" || tier === "unavailable" ? tier : "cache";
}

function writeLocal<T>(path: string, state: FeedState<T>): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(path), JSON.stringify({ state, savedAt: Date.now() }));
  } catch {}
}

const emptyInitial = <T,>(): FeedState<T> => ({
  data: [],
  ageUpdatedAt: Date.now(),
  ageMinutes: 0,
  fallbackTier: "loading",
  loadedAt: null,
  error: null,
});

/** Advance freshness without replacing the feature array or resetting source age. */
export function ageState<T>(state: FeedState<T>, now = Date.now()): FeedState<T> {
  const minutes = Math.max(0, Math.floor((now - state.ageUpdatedAt) / 60_000));
  if (!minutes || !state.loadedAt) return state;
  return { ...state, ageMinutes: state.ageMinutes + minutes, ageUpdatedAt: state.ageUpdatedAt + minutes * 60_000 };
}

class HttpError extends Error {
  constructor(public status: number, statusText: string) { super(`${status} ${statusText}`); }
}

async function fetchOnce<T>(url: string, signal: AbortSignal, timeoutMs: number): Promise<NormalizedFeed<T>> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
  const abort = () => ctrl.abort();
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) ctrl.abort();
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) {
      await res.body?.cancel();
      throw new HttpError(res.status, res.statusText);
    }
    // Keep the deadline and parent cancellation attached through body consumption.
    const json = await res.json() as NormalizedFeed<T>;
    if (!Array.isArray(json?.features) || !json.meta || !Number.isFinite(json.meta.ageMinutes)
      || !Number.isFinite(Date.parse(json.meta.fetchedAt))) throw new Error("Invalid feed response");
    return json;
  } catch (err) {
    if (timedOut) throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal.removeEventListener("abort", abort);
  }
}

function retryDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(id); reject(new DOMException("Aborted", "AbortError")); };
    const id = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

export async function fetchWithRetry<T>(url: string, signal: AbortSignal, isFirstAttempt = false): Promise<NormalizedFeed<T>> {
  const retries = isFirstAttempt ? FIRST_RETRIES : RETRIES;
  const timeoutMs = isFirstAttempt ? FIRST_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      return await fetchOnce<T>(url, signal, timeoutMs);
    } catch (err) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (err instanceof HttpError && err.status < 500 && err.status !== 429) throw err;
      lastErr = err;
    }
    if (i < retries) await retryDelay(800 * (i + 1), signal);
  }
  throw lastErr ?? new Error("Fetch failed after retries");
}

export function useFeed<T>(path: string, pollMs: number): FeedState<T> & { refetch: () => void } {
  const [state, setState] = useState<FeedState<T>>(() => readLocal<T>(path) ?? emptyInitial<T>());
  const inflight = useRef<AbortController | null>(null);
  const runRef = useRef<() => Promise<void>>(async () => {});
  const failCount = useRef(0);
  const pathRef = useRef(path);
  // Cold-start tolerance — true until the first successful poll. Subsequent
  // polls are fast (worker is warm) and use the regular short timeout.
  const isFirstAttempt = useRef(true);

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setTimeout> | undefined;
    const interval = Number.isFinite(pollMs) && pollMs > 0 ? Math.min(pollMs, MAX_SAFE_INTERVAL_MS) : 60_000;

    // A DYNAMIC path (e.g. /api/wrf/rain-grid?day=2 after a D1→D2 switch)
    // must start from its own cached/empty state. Without this reset the
    // short-circuit below can match the PREVIOUS path's payload — the WRF
    // grid serves all three days from one cached run, so day 1/2/3 share
    // meta.fetchedAt and the day-1 grid would silently stay on screen.
    if (pathRef.current !== path) {
      pathRef.current = path;
      failCount.current = 0;
      isFirstAttempt.current = true;
      setState(readLocal<T>(path) ?? emptyInitial<T>());
    }

    const run = async () => {
      clearTimeout(pollId);
      inflight.current?.abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      const firstAttempt = isFirstAttempt.current;
      try {
        const sep = path.includes("?") ? "&" : "?";
        const url = `${path}${sep}_=${Date.now()}`;
        const json = await fetchWithRetry<T>(url, ctrl.signal, firstAttempt);
        if (cancelled || ctrl.signal.aborted) return;
        isFirstAttempt.current = false;
        failCount.current = 0;
        setState((prev) => {
          // Short-circuit when upstream hasn't moved — same fetchedAt means same payload.
          // Avoids cascading re-renders of dashboard chips and tickers on every poll.
          if (
            prev.loadedAt === json.meta.fetchedAt &&
            prev.fallbackTier === json.meta.fallbackTier &&
            prev.ageMinutes === json.meta.ageMinutes &&
            prev.note === json.meta.note &&
            prev.error === null
          ) {
            return prev;
          }
          const next: FeedState<T> = {
            ageUpdatedAt: Date.now(),
            data: prev.loadedAt === json.meta.fetchedAt ? prev.data : json.features,
            ageMinutes: json.meta.ageMinutes,
            fallbackTier: json.meta.fallbackTier,
            loadedAt: json.meta.fetchedAt,
            error: null,
            note: json.meta.note,
          };
          writeLocal(path, next);
          return next;
        });
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError"
          || err instanceof Error && err.name === "AbortError";
        if (cancelled || ctrl.signal.aborted || isAbort) return;
        failCount.current += 1;
        const errMsg = err instanceof Error ? err.message : String(err);
        const fails = failCount.current;
        setState((prev) => {
          const tier: FallbackTier | "loading" =
            fails >= UNAVAILABLE_AFTER_FAILS
              ? "unavailable"
              : prev.loadedAt
                ? retainedTier(prev.fallbackTier)
                : "loading";
          if (prev.error === errMsg && prev.fallbackTier === tier) return prev;
          return { ...ageState(prev), error: errMsg, fallbackTier: tier };
        });
      } finally {
        // A poll never cancels its own slow request; the next starts after settlement.
        if (!cancelled && inflight.current === ctrl) pollId = setTimeout(run, interval);
      }
    };
    runRef.current = run;

    void run();
    const ageId = setInterval(() => setState(ageState), 60_000);
    return () => {
      cancelled = true;
      clearTimeout(pollId);
      clearInterval(ageId);
      inflight.current?.abort();
    };
  }, [path, pollMs]);

  const refetch = useCallback(() => runRef.current(), []);
  return { ...state, refetch };
}
