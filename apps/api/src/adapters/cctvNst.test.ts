import { describe, it, expect, vi } from "vitest";
import { fetchNstCctv, NST_CCTV_VENDOR, nstCctvCategory } from "./cctvNst.js";

// All inside FEED_BBOX (lng 99.30–100.35, lat 7.80–9.45) — NST municipality
const NST_LNG = 99.9631;
const NST_LAT = 8.4364;
// Outside FEED_BBOX
const OUTSIDE_LNG = 99.0;
const OUTSIDE_LAT = 16.0;

function makeCam(overrides: Record<string, unknown> = {}) {
  return {
    id: "SC004",
    name: "หน้าร.ร.ศาลามีชัยตัวที่ 2",
    group: "2.กล้องหน้าโรงเรียน",
    lat: NST_LAT,
    lng: NST_LNG,
    ...overrides,
  };
}

/** Routes the two upstream endpoints; `status` null → the status call fails. */
function mockUpstream(list: unknown, status: Record<string, string> | null = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
    const u = String(url);
    if (u.includes("/api/camera-status")) {
      return Promise.resolve(status === null ? new Response(null, { status: 502 }) : new Response(JSON.stringify(status), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify(list), { status: 200 }));
  });
}

describe("NST CCTV adapter (nstcctv.nakhoncity.org)", () => {
  it("exports the vendor tag for downstream consumers", () => {
    expect(NST_CCTV_VENDOR).toBe("nst-municipality");
  });

  it("requests the NST municipality public camera-list endpoint", async () => {
    const spy = mockUpstream([makeCam()]);
    vi.resetModules();
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    await fresh();
    const urls = spy.mock.calls.map(([u]) => String(u));
    expect(urls).toContain("https://nstcctv.nakhoncity.org/api/cameras/public");
    expect(urls).toContain("https://nstcctv.nakhoncity.org/api/camera-status");
    vi.restoreAllMocks();
  });

  it("returns NormalizedFeed with live tier when cameras are present", async () => {
    vi.resetModules();
    mockUpstream([makeCam()]);
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    expect(feed.meta.source).toBe("nstcctv-public");
    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.features.length).toBe(1);
  });

  it("maps the upstream shape (id, name, lat, lng, group) to CctvCamera correctly", async () => {
    vi.resetModules();
    mockUpstream([makeCam()]);
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    const cam = feed.features[0]!;
    expect(cam.id).toMatch(/^nstcctv-/);
    expect(cam.vendor).toBe("nst-municipality");
    expect(cam.lat).toBeCloseTo(NST_LAT, 5);
    expect(cam.lng).toBeCloseTo(NST_LNG, 5);
    expect(cam.name).toBe("หน้าร.ร.ศาลามีชัยตัวที่ 2");
    expect(cam.organization).toBe("2.กล้องหน้าโรงเรียน");
    expect(cam.sourceId).toBe("SC004");
    expect(cam.category).toBe("school");
    // Streams are MediaMTX HTML player pages (iframe), never mislabelled as HLS/JPEG
    expect(cam.embedUrl).toBe("https://nstcctv.nakhoncity.org/cam/SC004_sub/");
    expect(cam.embedHdUrl).toBe("https://nstcctv.nakhoncity.org/cam/SC004/");
    expect(cam.hlsUrl).toBeUndefined();
    expect(cam.imageUrl).toBeUndefined();
  });

  it("excludes cameras outside the NST province bbox", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          makeCam({ id: "IN-1" }),
          makeCam({ id: "OUT-1", lat: OUTSIDE_LAT, lng: OUTSIDE_LNG }),
        ]),
        { status: 200 },
      ),
    );
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    expect(feed.features.some((c) => c.id === "nstcctv-IN-1")).toBe(true);
    expect(feed.features.some((c) => c.id === "nstcctv-OUT-1")).toBe(false);
    vi.restoreAllMocks();
  });

  it("skips cameras with invalid coordinates", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          makeCam({ id: "GOOD-1" }),
          { id: "BAD-1", name: "no coords", group: "x" }, // missing lat/lng
        ]),
        { status: 200 },
      ),
    );
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    expect(feed.features.some((c) => c.id === "nstcctv-GOOD-1")).toBe(true);
    expect(feed.features.some((c) => c.id === "nstcctv-BAD-1")).toBe(false);
    vi.restoreAllMocks();
  });

  it("falls back to scenario tier when the upstream fails", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 502 }),
    );
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    expect(feed.meta.fallbackTier).toBe("scenario");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
  it("categorises by id prefix, falling back to the Thai group string", () => {
    expect(nstCctvCategory("TF056", "")).toBe("traffic");
    expect(nstCctvCategory("SC004", "")).toBe("school");
    expect(nstCctvCategory("SZ001", "")).toBe("safety");
    expect(nstCctvCategory("WL005", "")).toBe("water");
    expect(nstCctvCategory("XX1", "4.กล้องดูระดับน้ำ")).toBe("water");
    expect(nstCctvCategory("XX1", "อื่นๆ")).toBe("other");
  });

  it("merges live online/offline status and reports the online count in meta.note", async () => {
    vi.resetModules();
    mockUpstream(
      [makeCam({ id: "TF001" }), makeCam({ id: "TF002" }), makeCam({ id: "WL001" })],
      { TF001: "online", TF002: "offline" },
    );
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    const byId = Object.fromEntries(feed.features.map((c) => [c.sourceId, c.status]));
    expect(byId).toEqual({ TF001: "online", TF002: "offline", WL001: "unknown" });
    expect(feed.meta.note).toBe("1/3 municipal cameras online");
    vi.restoreAllMocks();
  });

  it("keeps the camera list when only the status endpoint is down", async () => {
    vi.resetModules();
    mockUpstream([makeCam({ id: "TF001" })], null);
    const { fetchNstCctv: fresh } = await import("./cctvNst.js");
    const feed = await fresh();
    expect(feed.features).toHaveLength(1);
    expect(feed.features[0]!.status).toBe("unknown");
    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.meta.note).toContain("status unavailable");
    vi.restoreAllMocks();
  });
});
