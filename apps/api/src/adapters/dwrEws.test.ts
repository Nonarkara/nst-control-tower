import { describe, it, expect, vi } from "vitest";
import { fetchEwsStations } from "./dwrEws";

/**
 * DWR EWS adapter contract tests.
 *
 * The adapter uses cachedWithStale, so happy-path tests use vi.resetModules()
 * to bypass the module-level cache and re-import a fresh copy.
 */

// Minimal EWS station shape — two NST upland stations + one out-of-province.
const MOCK_STATIONS = [
  {
    stn: "STN0079",
    name: "ลานสกา",
    stn_type: "RF",
    tambon: "กำโลน",
    amphoe: "ลานสกา",
    province: "นครศรีธรรมราช",
    main_basin: "ภาคใต้ฝั่งตะวันออก",
    latitude: "8.40",
    longitude: "99.78",
    status: "2",
    warn: "ฝนตกหนัก",
    rain: "0.0",
    rain12h: "158.0",
    wl: "N/A",
    soil: "89.40",
    soil07h: "80.0",
    alert_min: null,
    alert_max: null,
    date: "2026-06-21 08:00:00",
  },
  {
    stn: "STN0067",
    name: "สิชล",
    stn_type: "WL",
    tambon: "ทุ่งปรัง",
    amphoe: "สิชล",
    province: "นครศรีธรรมราช",
    main_basin: "ภาคใต้ฝั่งตะวันออก",
    latitude: "9.00",
    longitude: "99.90",
    status: "0",
    warn: null,
    rain: "0.0",
    rain12h: "0.0",
    wl: "2.42",
    soil: "N/A",
    soil07h: "N/A",
    date: "2026-06-21 08:00:00",
  },
  {
    stn: "STN9999",
    name: "Bangkok station",
    stn_type: "RF",
    amphoe: "เขตดุสิต",
    province: "กรุงเทพมหานคร", // out of province — must be filtered out
    main_basin: "เจ้าพระยา",
    latitude: "13.75",
    longitude: "100.52",
    status: "3",
    soil: "-9.99", // sensor-error sentinel
    date: "2026-06-21 08:00:00",
  },
];

describe("dwrEws adapter — happy path (isolated)", () => {
  it("filters to NST stations and maps EWS fields", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(MOCK_STATIONS), { status: 200 }),
    );
    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };

    const feed = await fresh();

    // Bangkok station excluded → only the 2 NST stations
    expect(feed.meta.fallbackTier).toBe("live");
    expect(feed.features).toHaveLength(2);

    // Sorted by status desc → ลานสกา (status 2) first
    const top = feed.features[0];
    expect(top.id).toBe("STN0079");
    expect(top.type).toBe("rain");
    expect(top.status).toBe(2);
    expect(top.amphoe).toBe("ลานสกา");
    expect(top.rain12h).toBe(158);
    expect(top.soilMoisture).toBeCloseTo(89.4);
    expect(top.waterLevel).toBeNull(); // "N/A" → null

    const wl = feed.features[1];
    expect(wl.type).toBe("water");
    expect(wl.waterLevel).toBeCloseTo(2.42);
    expect(wl.soilMoisture).toBeNull(); // "N/A" → null
    vi.restoreAllMocks();
  });

  it("returns 'unavailable' with a note when fetch throws", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };

    const feed = await fresh();

    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/EWS/);
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it("returns 'unavailable' when no NST stations are present", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([MOCK_STATIONS[2]]), { status: 200 }), // Bangkok only
    );
    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };

    const feed = await fresh();
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.features).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
