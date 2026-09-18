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

  // Pin the status-mapping behaviour so future PRs don't regress the
  // "move-now" tier to noise again. Upstream uses status="9" for ~half
  // of all stations (a non-severity sentinel — null warn, no rain);
  // mapping 9 → 3 used to push 159 NST villages into move-now while the
  // gauges were below bank and rain was 0–2 mm/h. Only 1 / 2 / 3 are real
  // severities.
  it("maps upstream status to {0,1,2,3} exactly — 9 is NOT critical", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        // NST station with status="9" — was wrongly promoted to severity 3
        {
          stn: "STN9001",
          name: "inactive EWS",
          stn_type: "RF",
          province: "นครศรีธรรมราช",
          latitude: "8.4",
          longitude: "99.7",
          status: "9", warn: null, warning_type: null,
          rain: "0.0", rain12h: "0.0",
          soil: "50.0",
          date: "2026-09-18 09:00:00",
        },
        // NST station with status=3 — should stay critical
        {
          stn: "STN9002",
          name: "real critical",
          stn_type: "WL",
          province: "นครศรีธรรมราช",
          latitude: "8.5",
          longitude: "99.8",
          status: "3", warn: "น้ำล้นตลิ่ง", warning_type: "wl",
          rain: "0.0", rain12h: "0.0",
          wl: "5.0",
          soil: "80.0",
          date: "2026-09-18 09:00:00",
        },
      ]), { status: 200 }),
    );
    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };
    const feed = await fresh();
    expect(feed.features).toHaveLength(2);
    const byId = Object.fromEntries(feed.features.map((s) => [s.id, s]));
    expect(byId["STN9001"].status).toBe(0); // was 3 under the buggy mapping
    expect(byId["STN9002"].status).toBe(3);
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

describe("dwrEws — Thai BE timestamps and stale stations", () => {
  it("parses DWR's dd/mm/yy BE string to ISO (Asia/Bangkok)", async () => {
    const { parseDwrDate } = await import("./dwrEws.js");
    expect(parseDwrDate("19/09/69 01:00 น.")).toBe("2026-09-18T18:00:00.000Z");
    expect(parseDwrDate("27/11/68 09:45 น.")).toBe("2025-11-27T02:45:00.000Z");
    expect(parseDwrDate("garbage")).toBeNull();
    expect(parseDwrDate(null)).toBeNull();
  });

  it("flags a station that stopped reporting months ago as stale, a current one not", async () => {
    vi.resetModules();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    // Build "dd/mm/yy HH:MM น." in Bangkok time for "now".
    const bkk = new Date(now.getTime() + 7 * 3_600_000);
    const fresh = `${pad(bkk.getUTCDate())}/${pad(bkk.getUTCMonth() + 1)}/${String((bkk.getUTCFullYear() + 543) % 100).padStart(2, "0")} ${pad(bkk.getUTCHours())}:${pad(bkk.getUTCMinutes())} น.`;
    const base = { stn_type: "RF", province: "นครศรีธรรมราช", status: "0", rain: "0.0", rain12h: "0.0", soil: "50" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        { ...base, stn: "OLD", name: "stopped", latitude: "8.4", longitude: "99.7", date: "27/11/68 09:45 น." },
        { ...base, stn: "NEW", name: "current", latitude: "8.5", longitude: "99.8", date: fresh },
      ]), { status: 200 }),
    );
    const { fetchEwsStations: fresh2 } = await import("./dwrEws.js");
    const feed = await fresh2();
    const byId = Object.fromEntries(feed.features.map((f) => [f.id, f]));
    expect(byId.OLD!.stale).toBe(true);
    expect(byId.OLD!.observedAt).toBe("2025-11-27T02:45:00.000Z");
    expect(byId.NEW!.stale).toBe(false);
    vi.restoreAllMocks();
  });
});
