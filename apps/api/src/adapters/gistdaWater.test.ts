import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * GISTDA water adapter contract tests. Each adapter uses cachedWithStale, so
 * modules are reset per test to bypass the module-level cache; upstream is
 * stubbed at fetch.
 */

const NST_POST = {
  attributes: { fid: 31, "จัง": "จ.นครศรีธรรมราช", "อำเ": "อ.เมือง", "สำร": "โทรมาตรขนาดเล็ก", long: 99.92025, "ลำด": 31, "สถา": "บ้านนาป่า", v_max: 0.74, lat: 8.396278, "แม่": "คลองท่าดี" },
  geometry: { x: 99.92025, y: 8.396278 },
};
const TRANG_POST = {
  attributes: { fid: 83, "จัง": "จ.ตรัง", "อำเ": "อ.ห้วยยอด", "สำร": "โทรมาตรขนาดเล็ก", long: 99.542392, "ลำด": 83, "สถา": "บ้านไสหาร", v_max: 0, lat: 7.907408, "แม่": "แม่น้ำตรัง" },
  geometry: { x: 99.542392, y: 7.907408 },
};

function stubFetch(body: unknown) {
  // A fresh Response per call — a shared one is consumed by the first read.
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify(body), { status: 200 }));
}

async function load() {
  vi.resetModules();
  return await import("./gistdaWater");
}

describe("gistdaWater adapters — upstream-failure contract", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("each adapter returns 'unavailable' with a GISTDA note when ArcGIS answers 200 + error body", async () => {
    stubFetch({ error: { code: 499, message: "Token Required" } });
    const m = await load();
    for (const fn of [m.fetchGistdaLevelPosts, m.fetchGistdaFloodStations, m.fetchGistdaFloodExtent]) {
      const feed = await fn();
      expect(feed.features).toHaveLength(0);
      expect(feed.meta.fallbackTier).toBe("unavailable");
      expect(feed.meta.note).toMatch(/GISTDA/);
      expect(feed.meta.note).toMatch(/Token Required/);
    }
  });
});

describe("fetchGistdaLevelPosts", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("keeps NST posts only, classifies kind, nulls a 0 v_max, and is reference tier", async () => {
    stubFetch({ features: [NST_POST, TRANG_POST] });
    const { fetchGistdaLevelPosts } = await load();
    const feed = await fetchGistdaLevelPosts();
    expect(feed.features).toHaveLength(1);
    const p = feed.features[0]!;
    expect(p).toMatchObject({ name: "บ้านนาป่า", river: "คลองท่าดี", kind: "telemetry", vMaxM: 0.74, lat: 8.396278, lng: 99.92025 });
    expect(feed.meta.fallbackTier).toBe("reference");
    expect(feed.meta.note).toMatch(/1 water-level posts/);
  });

  it("เสาระดับ → kind 'post'", async () => {
    stubFetch({ features: [{ ...NST_POST, attributes: { ...NST_POST.attributes, "สำร": "เสาระดับ", v_max: 0 } }] });
    const { fetchGistdaLevelPosts } = await load();
    const feed = await fetchGistdaLevelPosts();
    expect(feed.features[0]).toMatchObject({ kind: "post", vMaxM: null });
  });
});

describe("fetchGistdaFloodStations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("dedupes to the newest row per station, maps the Thai alert class, and reports the snapshot lag", async () => {
    const row = (code: string, t: number, cls: string, pct: number) => ({
      attributes: { station_old_code: code, station_name: `st ${code}`, amphoe: "เมือง", tambon: "ท่าไร่", basin_name: null, value: 22.68, min_bank: 24.22, ground_level: 20, percentage: pct, discharge: null, classify_name: cls, update_time: t },
      geometry: { x: 100.0, y: 8.4 },
    });
    stubFetch({ features: [row("CHAU01", 1000, "ปกติ", 50), row("CHAU01", 5000, "แจ้งเตือน", 93.6), row("X.203", 4000, "อันตราย", 101)] });
    const { fetchGistdaFloodStations } = await load();
    const feed = await fetchGistdaFloodStations();
    expect(feed.features).toHaveLength(2);
    const chau = feed.features.find((s) => s.stationCode === "CHAU01")!;
    expect(chau.classify).toBe("alert");
    expect(chau.fullnessPct).toBe(93.6);
    expect(chau.observedAt).toBe(new Date(5000).toISOString());
    expect(feed.features.find((s) => s.stationCode === "X.203")!.classify).toBe("danger");
    expect(feed.meta.fallbackTier).toBe("database");
    expect(feed.meta.note).toMatch(/2 stations · 2 flagged/);
    expect(feed.meta.note).toMatch(/not live/);
  });
});

describe("fetchGistdaFloodExtent", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("keeps NST tambons, strips ต./อ. prefixes, carries rings and totals rai", async () => {
    stubFetch({
      features: [
        { attributes: { tb_idn: "800106", tb_tn: "ต.ท่าไร่", ap_tn: "อ.เมืองนครศรีธรรม", pv_tn: "จ.นครศรีธรรมราช", flood_area: 1419, f_area: 2270406.6, house: 0, lat: 8.45, long: 100.02 }, geometry: { rings: [[[100.0, 8.4], [100.1, 8.4], [100.1, 8.5], [100.0, 8.4]]] } },
        { attributes: { tb_idn: "160105", tb_tn: "ต.เขาพระงาม", ap_tn: "อ.เมืองลพบุรี", pv_tn: "จ.ลพบุรี", flood_area: 659, f_area: 1, house: 0, lat: 14.9, long: 100.7 }, geometry: { rings: [] } },
      ],
    });
    const { fetchGistdaFloodExtent } = await load();
    const feed = await fetchGistdaFloodExtent();
    expect(feed.features).toHaveLength(1);
    expect(feed.features[0]).toMatchObject({ tambon: "ท่าไร่", amphoe: "เมืองนครศรีธรรม", floodAreaRai: 1419 });
    expect(feed.features[0]!.rings[0]).toHaveLength(4);
    expect(feed.meta.fallbackTier).toBe("reference");
    expect(feed.meta.note).toMatch(/1,419 rai/);
  });
});
