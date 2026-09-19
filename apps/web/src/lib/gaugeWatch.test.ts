import { describe, expect, test, vi, beforeEach } from "vitest";
import type { CctvCamera } from "../map/layers";
import { analyzeCandidate, decideRise, framePixels, getSweepStats, isDaylightICT, pickGaugeCandidates, recordSweep, RISE_THRESHOLD } from "./gaugeWatch";
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

// ── framePixels: decode without fetch() ─────────────────────────────────────
// The app's CSP has no `data:` in connect-src, so fetch(dataUrl) is BLOCKED in
// the browser. The first version decoded stills that way and silently read
// every frame as unusable — the watch never produced one reading. These
// stubs make fetch() throw like the CSP does, so that regression can't return.
describe("framePixels under the CSP", () => {
  const W = 320, H = 180;
  function stubBrowser(fill = 90) {
    class FakeImage {
      naturalWidth = W;
      naturalHeight = H;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) { queueMicrotask(() => this.onload?.()); }
    }
    const canvas = {
      width: 0, height: 0,
      getContext: () => ({
        drawImage: () => {},
        getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(fill), width: w, height: h }),
      }),
    };
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("document", { createElement: () => canvas });
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Refused to connect (CSP connect-src has no data:)"))));
  }

  test("decodes a data: URL through <img>, never through fetch", async () => {
    stubBrowser();
    const px = await framePixels("data:image/jpeg;base64,AAAA");
    expect(px).not.toBeNull();
    expect(px!.w).toBe(160);
    expect(px!.h).toBe(90); // 16:9 preserved
    expect(globalThis.fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test("an image that fails to load is undecodable, not a crash", async () => {
    stubBrowser();
    class BadImage { onload: (() => void) | null = null; onerror: (() => void) | null = null; naturalWidth = 0; naturalHeight = 0; set src(_v: string) { queueMicrotask(() => this.onerror?.()); } }
    vi.stubGlobal("Image", BadImage);
    const out = await analyzeCandidate({ camera: { id: "c1" } as CctvCamera, dataUrl: "data:image/jpeg;base64,AAAA", capturedAt: Date.now() });
    expect(out.status).toBe("undecodable");
    vi.unstubAllGlobals();
  });

  test("a blown-out / fog frame is 'unreadable' (reported, not hidden)", async () => {
    stubBrowser(250);
    const out = await analyzeCandidate({ camera: { id: "c2" } as CctvCamera, dataUrl: "data:image/jpeg;base64,AAAA", capturedAt: Date.now() });
    expect(out.status).toBe("unreadable");
    vi.unstubAllGlobals();
  });

  test("KNOWN LIMIT: flat dark-grey (asphalt-like) reads as 'water', but never confidently enough to post", async () => {
    // Seen on real cameras (WL023, WL011 are streets): dark + low-saturation
    // passes the water test. The edge-contrast gate caps confidence at 0.2, so
    // no event can fire — this pins that the safety net holds until the
    // detector can tell asphalt from water (needs per-camera calibration).
    stubBrowser(90);
    const out = await analyzeCandidate({ camera: { id: "c3" } as CctvCamera, dataUrl: "data:image/jpeg;base64,AAAA", capturedAt: Date.now() });
    expect(out.status).toBe("read");
    if (out.status === "read") {
      expect(out.decision.confidence).toBeLessThan(0.5);
      expect(out.decision.rising).toBe(false);
    }
    vi.unstubAllGlobals();
  });
});

describe("sweep stats", () => {
  test("record what the last sweep actually achieved, and accumulate posts", () => {
    recordSweep([
      { outcome: { status: "undecodable" }, posted: false },
      { outcome: { status: "unreadable" }, posted: false },
      { outcome: { status: "read", decision: { rising: true, rise: 0.06, confidence: 0.7 } }, posted: true },
      { outcome: { status: "read", decision: { rising: false, rise: 0, confidence: 0.2 } }, posted: false },
    ], 1_000);
    const s = getSweepStats();
    expect(s).toMatchObject({ at: 1_000, analysed: 4, undecodable: 1, unreadable: 1, confident: 1, posted: 1 });
  });
});
