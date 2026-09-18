import { describe, expect, test, vi, beforeEach } from "vitest";
import type { CctvCamera } from "../map/layers";
import { decideRise, isDaylightICT, pickGaugeCandidates, RISE_THRESHOLD } from "./gaugeWatch";
import * as pool from "./cctvCapturePool";

function cam(id: string, extra: Partial<CctvCamera> = {}): CctvCamera {
  return { id, sourceId: id, name: id, lat: 8.43, lng: 99.96, vendor: "nst-municipality", category: "water", status: "online", embedUrl: "x", ...extra };
}

// ICT noon = 05:00Z. ICT 22:00 = 15:00Z.
const NOON = Date.UTC(2026, 5, 1, 5, 0, 0);
const NIGHT = Date.UTC(2026, 5, 1, 15, 0, 0);

// vitest runs in node (no window) — stub a memory localStorage.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}
vi.stubGlobal("window", { localStorage: memoryStorage() });

describe("isDaylightICT", () => {
  test("midday yes, night no", () => {
    expect(isDaylightICT(NOON)).toBe(true);
    expect(isDaylightICT(NIGHT)).toBe(false);
  });
});

describe("decideRise", () => {
  beforeEach(() => window.localStorage.clear());

  test("first visit seeds the baseline and reports nothing", () => {
    const d = decideRise("WL005", 0.6, 0.9, NOON);
    expect(d.rising).toBe(false);
  });

  test("a rise above threshold with confidence posts", () => {
    decideRise("WL005", 0.6, 0.9, NOON);
    const d = decideRise("WL005", 0.6 - RISE_THRESHOLD - 0.01, 0.8, NOON + 60_000);
    expect(d.rising).toBe(true);
    expect(d.rise).toBeGreaterThanOrEqual(RISE_THRESHOLD);
  });

  test("small wobble does not post", () => {
    decideRise("WL005", 0.6, 0.9, NOON);
    const d = decideRise("WL005", 0.6 - RISE_THRESHOLD + 0.02, 0.9, NOON + 60_000);
    expect(d.rising).toBe(false);
  });

  test("low confidence never posts, even on a big move", () => {
    decideRise("WL005", 0.6, 0.9, NOON);
    const d = decideRise("WL005", 0.3, 0.2, NOON + 60_000);
    expect(d.rising).toBe(false);
  });

  test("falling water never posts", () => {
    decideRise("WL005", 0.6, 0.9, NOON);
    const d = decideRise("WL005", 0.75, 0.9, NOON + 60_000);
    expect(d.rising).toBe(false);
    expect(d.rise).toBeLessThan(0);
  });

  test("a posted rise re-anchors — same level does not re-fire", () => {
    decideRise("WL005", 0.6, 0.9, NOON);
    decideRise("WL005", 0.5, 0.9, NOON + 60_000); // fires, baseline → ~0.55
    const d2 = decideRise("WL005", 0.5, 0.9, NOON + 120_000);
    expect(d2.rising).toBe(false);
  });
});

describe("pickGaugeCandidates", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test("night returns nobody", () => {
    vi.spyOn(pool, "getCachedFrame").mockReturnValue({ dataUrl: "x", capturedAt: NIGHT });
    expect(pickGaugeCandidates([cam("WL005")], NIGHT)).toEqual([]);
  });

  test("offline cameras and non-water categories are skipped", () => {
    vi.spyOn(pool, "getCachedFrame").mockReturnValue({ dataUrl: "x", capturedAt: NOON });
    const cams = [
      cam("WL001", { status: "offline" }),
      cam("TF001", { category: "traffic" }),
      cam("WL002"),
    ];
    expect(pickGaugeCandidates(cams, NOON).map((c) => c.camera.id)).toEqual(["WL002"]);
  });

  test("cameras without a pooled frame are skipped (zero extra requests)", () => {
    vi.spyOn(pool, "getCachedFrame").mockReturnValue(undefined);
    expect(pickGaugeCandidates([cam("WL005")], NOON)).toEqual([]);
  });

  test("stale frames and cooldown are respected", () => {
    vi.spyOn(pool, "getCachedFrame").mockReturnValue({ dataUrl: "x", capturedAt: NOON - 20 * 60_000 });
    expect(pickGaugeCandidates([cam("WL005")], NOON)).toEqual([]);
  });
});
