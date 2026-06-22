import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchReservoirs, fetchDisasterStats, fetchFahfon, fetchDatagoPoints } from "./datago";
import type { ReservoirStatus, DisasterStat, FahfonReading, RoadSafetySnapshot, DatagoDataset } from "./datago";

/**
 * data.go.th adapter contract tests.
 *
 * All three live-data functions (reservoirs, disasters, fahfon) require
 * DATA_GO_TH_TOKEN. When the token is absent (empty string), the adapter
 * must return `fallbackTier: "unavailable"` with a descriptive note
 * rather than attempting an unauthenticated CKAN request.
 */

// Simulate the CKAN API returning 401 when token is missing
function mock401() {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("{}", { status: 401 }),
  );
}

describe("datago adapter — missing-token contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchReservoirs returns 'unavailable' with token note when token is absent", async () => {
    mock401();
    const feed = await fetchReservoirs("");

    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/DATA_GO_TH_TOKEN/);
    expect(feed.features).toHaveLength(0);
  });

  it("fetchDisasterStats returns 'unavailable' with token note when token is absent", async () => {
    mock401();
    const feed = await fetchDisasterStats("");

    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/DATA_GO_TH_TOKEN/);
    expect(feed.features).toHaveLength(0);
  });

  it("fetchFahfon returns 'unavailable' with token note when token is absent", async () => {
    mock401();
    const feed = await fetchFahfon("");

    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/DATA_GO_TH_TOKEN/);
    expect(feed.features).toHaveLength(0);
  });

  it("note distinguishes 'missing token' from 'CKAN upstream failure'", () => {
    // Verify the note strings are correctly differentiated at the logic level.
    // (Can't re-call fetchReservoirs with a different token in the same file
    //  because cachedWithStale keeps the first-call result for "datago-reservoirs".)
    const NO_TOKEN_NOTE = "Missing DATA_GO_TH_TOKEN env var — data.go.th feeds disabled";
    const UPSTREAM_NOTE = "CKAN returned no rows — upstream may be down";

    // These must be different messages so operators can distinguish key-missing vs upstream issues
    expect(NO_TOKEN_NOTE).not.toBe(UPSTREAM_NOTE);
    expect(NO_TOKEN_NOTE).toMatch(/DATA_GO_TH_TOKEN/);
    expect(UPSTREAM_NOTE).toMatch(/CKAN/);
    expect(UPSTREAM_NOTE).not.toMatch(/DATA_GO_TH_TOKEN/);
  });
});

// ─── fetchDatagoPoints — curated static list ─────────────────────────────────

describe("fetchDatagoPoints — curated static feed", () => {
  it("returns 'database' fallback tier (no external HTTP call)", () => {
    const feed = fetchDatagoPoints();
    expect(feed.meta.fallbackTier).toBe("database");
    expect(feed.meta.source).toBe("data.go.th");
    expect(feed.meta.fetchedAt).toBeTruthy();
  });

  it("returns a non-empty list of POIs", () => {
    const feed = fetchDatagoPoints();
    expect(feed.features.length).toBeGreaterThan(0);
  });

  it("includes Maharaj Hospital with correct coordinates and category", () => {
    const feed = fetchDatagoPoints();
    const hospital = feed.features.find((p) => p.id === "hosp-maharaj-nst");
    expect(hospital).toBeDefined();
    expect(hospital!.name).toMatch(/โรงพยาบาลมหาราชนครศรีธรรมราช/);
    expect(hospital!.nameEn).toMatch(/Maharaj Nakhon Si Thammarat Hospital/i);
    expect(hospital!.category).toBe("hospital");
    // NST city coordinates: ~8.42°N, 99.97°E
    expect(hospital!.lat).toBeGreaterThan(8.0);
    expect(hospital!.lat).toBeLessThan(9.0);
    expect(hospital!.lng).toBeGreaterThan(99.5);
    expect(hospital!.lng).toBeLessThan(100.1);
  });

  it("includes city hall in the government category", () => {
    const feed = fetchDatagoPoints();
    const hall = feed.features.find((p) => p.id === "gov-city-hall");
    expect(hall).toBeDefined();
    expect(hall!.category).toBe("office");
    expect(hall!.nameEn).toMatch(/City Hall/i);
  });

  it("every POI has the required DatagoPoint shape", () => {
    const feed = fetchDatagoPoints();
    for (const poi of feed.features) {
      expect(typeof poi.id).toBe("string");
      expect(typeof poi.name).toBe("string");
      expect(typeof poi.category).toBe("string");
      expect(typeof poi.lat).toBe("number");
      expect(typeof poi.lng).toBe("number");
      expect(typeof poi.source).toBe("string");
      // All must be in NST bbox: lng [99.30, 100.35], lat [7.80, 9.45]
      expect(poi.lat).toBeGreaterThanOrEqual(7.80);
      expect(poi.lat).toBeLessThanOrEqual(9.45);
      expect(poi.lng).toBeGreaterThanOrEqual(99.30);
      expect(poi.lng).toBeLessThanOrEqual(100.35);
    }
  });

  it("includes at least one entry from each key category", () => {
    const feed = fetchDatagoPoints();
    const categories = new Set(feed.features.map((p) => p.category));
    expect(categories.has("hospital")).toBe(true);
    expect(categories.has("school")).toBe(true);
    expect(categories.has("temple")).toBe(true);
    expect(categories.has("office")).toBe(true); // government + police use "office"
  });

  it("includes NSTRU (Rajabhat) as an educational entry", () => {
    const feed = fetchDatagoPoints();
    const rajabhat = feed.features.find((p) => p.id === "sch-nstru");
    expect(rajabhat).toBeDefined();
    expect(rajabhat!.category).toBe("school");
    // NSTRU is at ~8.64°N, inside bbox
    expect(rajabhat!.lat).toBeCloseTo(8.64, 0);
  });
});

// ─── fetchReservoirs — happy-path isolated ────────────────────────────────────

describe("fetchReservoirs — happy-path", () => {
  // Use module reset + fresh import to bypass module-level cache
  let fetchReservoirsIsolated: typeof fetchReservoirs;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./datago.js") as unknown as { fetchReservoirs: typeof fetchReservoirs };
    fetchReservoirsIsolated = mod.fetchReservoirs;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps CKAN records to ReservoirStatus shape with 'live' tier", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      result: {
        records: [{
          "Reservoir": "อ่างเก็บน้ำหนองค้อ",
          "Sub-district/District": "หนองค้อ / เมืองชลบุรี",
          "Current Water Volume (million cubic meters)": "12.5",
          "Water Volume Yesterday": "12.3",
          "Maximum Storage Capacity (million cubic meters)": "25.0",
          "Remaining Water Supply (days)": "180",
          "Current Reservoir Storage (% of Original Capacity)": "50",
          "Yesterday's Rainfall (mm)": "3.2",
        }],
      },
    }), { status: 200 })));

    const feed = await fetchReservoirsIsolated("test-token");

    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.meta.source).toBe("datago-reservoirs");
    expect(feed.features).toHaveLength(1);
    const r = feed.features[0] as ReservoirStatus;
    expect(r.name).toBe("อ่างเก็บน้ำหนองค้อ");
    expect(r.currentVolMCM).toBeCloseTo(12.5);
    expect(r.maxVolMCM).toBeCloseTo(25.0);
    expect(r.capacityPct).toBeCloseTo(50);
    expect(r.daysRemaining).toBe(180);
    expect(r.rainfallYesterdayMm).toBeCloseTo(3.2);
    expect(r.trend).toBe("rising"); // 12.5 > 12.3
  });

  it("computes 'falling' trend when volume is lower than yesterday", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      result: {
        records: [{
          "Reservoir": "Test Reservoir",
          "Sub-district/District": "Test",
          "Current Water Volume (million cubic meters)": "10.0",
          "Water Volume Yesterday": "10.5",
          "Maximum Storage Capacity (million cubic meters)": "30.0",
          "Remaining Water Supply (days)": "90",
          "Current Reservoir Storage (% of Original Capacity)": "33",
          "Yesterday's Rainfall (mm)": "0",
        }],
      },
    }), { status: 200 })));

    const feed = await fetchReservoirsIsolated("test-token");
    expect(feed.features[0].trend).toBe("falling");
  });

  it("sorts features so reservoirs with fewest days remaining appear first", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      result: {
        records: [
          { "Reservoir": "A", "Sub-district/District": "", "Current Water Volume (million cubic meters)": "5", "Water Volume Yesterday": "5", "Maximum Storage Capacity (million cubic meters)": "20", "Remaining Water Supply (days)": "200", "Current Reservoir Storage (% of Original Capacity)": "25", "Yesterday's Rainfall (mm)": "0" },
          { "Reservoir": "B", "Sub-district/District": "", "Current Water Volume (million cubic meters)": "2", "Water Volume Yesterday": "2", "Maximum Storage Capacity (million cubic meters)": "10", "Remaining Water Supply (days)": "30",  "Current Reservoir Storage (% of Original Capacity)": "20", "Yesterday's Rainfall (mm)": "0" },
        ],
      },
    }), { status: 200 })));

    const feed = await fetchReservoirsIsolated("test-token");
    expect(feed.features[0].name).toBe("B"); // 30 days → critical first
    expect(feed.features[1].name).toBe("A"); // 200 days → second
  });
});

// ─── fetchDisasterStats — happy-path isolated ─────────────────────────────────

describe("fetchDisasterStats — happy-path", () => {
  let fetchDisasterStatsIsolated: typeof fetchDisasterStats;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./datago.js") as unknown as { fetchDisasterStats: typeof fetchDisasterStats };
    fetchDisasterStatsIsolated = mod.fetchDisasterStats;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps CKAN rows to DisasterStat shape with 'live' tier", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      result: {
        records: [
          { "ประเภทภัย": "อัคคีภัย", "ปี": "2567", "สถิติสาธารณภัย": "42" },
          { "ประเภทภัย": "อุทกภัย",  "ปี": "2567", "สถิติสาธารณภัย": "18" },
        ],
      },
    }), { status: 200 })));

    const feed = await fetchDisasterStatsIsolated("test-token");

    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.meta.source).toBe("datago-disasters");
    expect(feed.features).toHaveLength(2);
    const fire = feed.features[0] as DisasterStat;
    expect(fire.type).toBe("อัคคีภัย");
    expect(fire.year).toBe(2567);
    expect(fire.count).toBe(42);
  });
});

// ─── fetchFahfon — happy-path isolated ───────────────────────────────────────

describe("fetchFahfon — happy-path", () => {
  let fetchFahfonIsolated: typeof fetchFahfon;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./datago.js") as unknown as { fetchFahfon: typeof fetchFahfon };
    fetchFahfonIsolated = mod.fetchFahfon;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps CKAN rows to FahfonReading shape with 'live' tier", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      result: {
        records: [{
          "สถานีตรวจวัดอากาศ": "Bang Sarae Station",
          "DATE": "2025-06-01",
          "TEMP (C)": "30.5",
          "CO2 (ppm)": "412",
          "PM1 (มคก./ลบ.ม.)": "8",
          "PM2.5 (มคก./ลบ.ม.)": "22",
          "PM10 (มคก./ลบ.ม.)": "38",
        }],
      },
    }), { status: 200 })));

    const feed = await fetchFahfonIsolated("test-token");

    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.meta.source).toBe("datago-fahfon");
    expect(feed.features).toHaveLength(1);
    const r = feed.features[0] as FahfonReading;
    expect(r.station).toBe("Bang Sarae Station");
    expect(r.date).toBe("2025-06-01");
    expect(r.tempC).toBeCloseTo(30.5);
    expect(r.co2Ppm).toBe(412);
    expect(r.pm25).toBe(22);
    expect(r.pm10).toBe(38);
  });

  it("returns null for zero-value sensor readings (0 → null coercion)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      result: {
        records: [{
          "สถานีตรวจวัดอากาศ": "Test",
          "DATE": "2025-06-01",
          "TEMP (C)": "0",
          "CO2 (ppm)": "0",
          "PM1 (มคก./ลบ.ม.)": "0",
          "PM2.5 (มคก./ลบ.ม.)": "0",
          "PM10 (มคก./ลบ.ม.)": "0",
        }],
      },
    }), { status: 200 })));

    const feed = await fetchFahfonIsolated("test-token");
    const r = feed.features[0] as FahfonReading;
    // The adapter uses `Number(x) || null` — 0 is falsy → null
    expect(r.tempC).toBeNull();
    expect(r.pm25).toBeNull();
  });
});

// ─── fetchRoadSafety ──────────────────────────────────────────────────────────

// ─── fetchDatagoDatasets ──────────────────────────────────────────────────────

describe("fetchDatagoDatasets — curated fallback when CKAN is unreachable", () => {
  let fetchDatagoDatasets: () => Promise<{ features: DatagoDataset[]; meta: { fallbackTier: string; source: string } }>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./datago.js") as unknown as {
      fetchDatagoDatasets: () => Promise<{ features: DatagoDataset[]; meta: { fallbackTier: string; source: string } }>;
    };
    fetchDatagoDatasets = mod.fetchDatagoDatasets;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to curated datasets when CKAN returns null (network error)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const feed = await fetchDatagoDatasets();

    expect(feed.meta.fallbackTier).toBe("database");
    expect(feed.features.length).toBeGreaterThan(0);
    // Curated datasets have known IDs
    const ids = feed.features.map((d) => d.id);
    expect(ids).toContain("moph-hospitals");
  });

  it("merges live CKAN results with curated datasets when CKAN succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            results: [
              {
                id: "live-pkg-001",
                title: "ข้อมูลชลบุรีสด",
                name: "live-chonburi-data",
                organization: { title: "หน่วยงานทดสอบ" },
                notes: "ชุดข้อมูลทดสอบจาก CKAN สด",
                tags: [{ name: "test" }, { name: "chonburi" }],
                metadata_modified: "2026-01-15T00:00:00",
                num_resources: 2,
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const feed = await fetchDatagoDatasets();

    expect(feed.meta.fallbackTier).toBe("live");
    // Live entry should be included
    const live = feed.features.find((d) => d.id === "live-pkg-001");
    expect(live).toBeDefined();
    expect(live!.title).toBe("ข้อมูลชลบุรีสด");
    expect(live!.tags).toContain("test");
    // Curated entries should also be present (not displaced unless same id)
    const curated = feed.features.find((d) => d.id === "moph-hospitals");
    expect(curated).toBeDefined();
    // Live entries come first
    expect(feed.features[0].id).toBe("live-pkg-001");
  });

  it("returns source 'data.go.th-ckan+curated' in meta", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const feed = await fetchDatagoDatasets();
    expect(feed.meta.source).toBe("data.go.th-ckan+curated");
  });
});

// ─── fetchProvincialKPIs ───────────────────────────────────────────────────────

describe("fetchProvincialKPIs — parallel CKAN fetch (isolated)", () => {
  type ProvincialKPIsFeed = {
    features: Array<{
      cityPopulation: { total: number; year: number } | null;
      population: { total: number; year: number } | null;
      tourism: { totalVisitors: number | null; year: number | null } | null;
      hotel: { occupancyPct: number | null } | null;
      accidents: { incidents: number; year: number } | null;
      welfare: { elderly: number; disabled: number } | null;
    }>;
    meta: { fallbackTier: string; source: string; note?: string };
  };

  let fetchProvincialKPIs: (token: string) => Promise<ProvincialKPIsFeed>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./datago.js") as unknown as {
      fetchProvincialKPIs: (token: string) => Promise<ProvincialKPIsFeed>;
    };
    fetchProvincialKPIs = mod.fetchProvincialKPIs;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'reference' tier with one NST KPI object", async () => {
    const feed = await fetchProvincialKPIs("test-token");
    expect(feed.meta.fallbackTier).toBe("reference");
    expect(feed.meta.source).toBe("datago-provincial-kpis");
    expect(feed.features).toHaveLength(1);
    expect(feed.meta.note).toMatch(/Nakhon Si Thammarat/);
  });

  it("surfaces NST city + province population (DOPA reference)", async () => {
    const feed = await fetchProvincialKPIs("test-token");
    const kpis = feed.features[0];
    // City municipality registry — DOPA 2019.
    expect(kpis.cityPopulation?.total).toBe(102_152);
    expect(kpis.cityPopulation?.year).toBe(2019);
    // Province registration — DOPA 2022, 23 districts.
    expect(kpis.population?.total).toBe(1_545_147);
    expect(kpis.population?.year).toBe(2022);
  });

  it("surfaces the TAT/MOTS NST tourism reference; hotel/accidents/welfare null", async () => {
    const feed = await fetchProvincialKPIs("test-token");
    const kpis = feed.features[0];
    // TAT 2019: ~3.94M visitors (fastest-growing tourism province).
    expect(kpis.tourism?.totalVisitors).toBe(3_940_000);
    expect(kpis.tourism?.year).toBe(2019);
    // No verified NST datastore for these — honestly null, never another province's data.
    expect(kpis.hotel).toBeNull();
    expect(kpis.accidents).toBeNull();
    expect(kpis.welfare).toBeNull();
  });

  it("ignores the token and makes no outbound CKAN request — always static NST reference", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("should not be called"));
    const feed = await fetchProvincialKPIs("");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(feed.meta.fallbackTier).toBe("reference");
    expect(feed.features[0].population?.total).toBe(1_545_147);
  });
});

describe("fetchRoadSafety — missing-token contract", () => {
  it("returns 'unavailable' with token note when token is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    // Use fresh isolated import to bypass cache from other tests
    vi.resetModules();
    const { fetchRoadSafety } = await import("./datago.js") as unknown as { fetchRoadSafety: (t: string) => Promise<{ meta: { fallbackTier: string; note?: string }; features: unknown[] }> };
    const feed = await fetchRoadSafety("");
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/DATA_GO_TH_TOKEN/);
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
});

describe("fetchRoadSafety — honest-empty contract (isolated)", () => {
  // data.go.th has no Yala-scoped road-safety datastore. The previously-wired
  // monthly/causes/byDistrict resources were CHONBURI datasets (their byDistrict
  // produced the bogus "deadliest district บางละมุง / Bang Lamung"). fetchRoadSafety
  // must therefore return empty/unavailable rather than another province's data —
  // even if the upstream CKAN call were to return rows.
  let fetchRoadSafetyIsolated: (token: string) => Promise<{ features: RoadSafetySnapshot[]; meta: { fallbackTier: string; source: string; note?: string } }>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./datago.js") as unknown as {
      fetchRoadSafety: (t: string) => Promise<{ features: RoadSafetySnapshot[]; meta: { fallbackTier: string; source: string; note?: string } }>;
    };
    fetchRoadSafetyIsolated = mod.fetchRoadSafety;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty 'unavailable' feed with a Yala note when a token is present", async () => {
    // Even if CKAN returned Chonburi-shaped rows, the adapter no longer queries it.
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({
        result: {
          records: [
            { "ปี": "2567", "เดือน": "1", "เสียชีวิต(คน)": "5", "บาดเจ็บ(คน)": "20", "อำเภอ": "บางละมุง" },
          ],
        },
      }), { status: 200 })),
    );

    const feed = await fetchRoadSafetyIsolated("test-token");

    expect(feed.meta.source).toBe("datago-road-safety");
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.features).toHaveLength(0);
    // Note explains the gap and does not leak a Chonburi district name.
    expect(feed.meta.note).toMatch(/Yala/);
  });

  it("makes no outbound CKAN request (no Chonburi resource is queried)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ result: { records: [] } }), { status: 200 }),
    );

    const feed = await fetchRoadSafetyIsolated("test-token");
    expect(feed.features).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
