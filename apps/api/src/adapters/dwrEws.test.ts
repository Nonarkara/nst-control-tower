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
    // The upstream sends the type in LOWER case. Measured 2026-10-23 against
    // the live endpoint: "RF" 1,819 · "wl" 455 · "RF " 1 (trailing space).
    // The case-sensitive comparison against "WL" never matched, so every NST
    // water-level station was typed "unknown" and the province had no "water"
    // station at all. The mock carries the real spelling so that regression
    // cannot come back.
    stn_type: "wl",
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
    alert_min: "55",
    alert_max: "4.00",
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
    expect(wl.type).toBe("water"); // lowercase "wl" upstream
    expect(wl.waterLevel).toBeCloseTo(2.42);
    expect(wl.soilMoisture).toBeNull(); // "N/A" → null
    expect(wl.alertMax).toBeCloseTo(4); // DWR's own alert level, in metres
    vi.restoreAllMocks();
  });

  /**
   * The upstream's threshold conventions, measured 2026-10-23 on the live
   * endpoint (2,275 stations nationwide, 86 in NST):
   *
   *  • `alert_max` is 0 for a station with no threshold configured. 0 is not
   *    a level: two NST stations carry it (บ้านพระเลียบ 1.84 m, บ้านไม้เสียบ
   *    1.16 m) and both hold an official status of 0, so reading 0 as a
   *    threshold calls them "at alert level" when the authority has raised
   *    nothing.
   *  • `alert_min` is the constant 55 on every water-level station (455/455)
   *    — not a per-station value, so it is not carried.
   */
  it("normalises the upstream's alert thresholds — 0 is unset, not a level", async () => {
    vi.resetModules();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([
        {
          stn: "STN1796", name: "บ้านพระเลียบ", stn_type: "wl", province: "นครศรีธรรมราช",
          amphoe: "สิชล", latitude: "9.00", longitude: "99.90", status: "0", wl: "1.84",
          alert_min: "55", alert_max: "0", date: "23/10/69 22:00 น.",
        },
        {
          stn: "STN0503", name: "บ้านนางเอื้อย", stn_type: "wl", province: "นครศรีธรรมราช",
          amphoe: "สิชล", latitude: "9.00", longitude: "99.90", status: "0", wl: "2.94",
          alert_min: "55", alert_max: "4.00", date: "23/10/69 22:00 น.",
        },
        {
          // A rain station whose type arrived with a trailing space.
          stn: "STN0001", name: "บ้านทดสอบ", stn_type: "RF ", province: "นครศรีธรรมราช",
          amphoe: "สิชล", latitude: "9.00", longitude: "99.90", status: "0", wl: "0.0",
          rain12h: "0.0", date: "23/10/69 22:00 น.",
        },
      ]), { status: 200 }),
    );
    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };
    const feed = await fresh();
    const byId = new Map(feed.features.map(f => [f.id, f]));

    expect(byId.get("STN1796")?.alertMax).toBeNull(); // 0 → unset, not a threshold
    expect(byId.get("STN0503")?.alertMax).toBeCloseTo(4);
    expect(byId.get("STN0001")?.type).toBe("rain"); // "RF " → trimmed
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

describe("dwrEws — the official layer must not blank on an upstream outage", () => {
  /**
   * Measured 2026-10-24 at 02:11:40 ICT: the upstream answered HTTP 522 and
   * the feed came back with NO DWR stations — while a last-good 86-station
   * snapshot existed and was being served on the very next requests. A cold
   * isolate on a loaded host missed the one-second snapshot-read deadline,
   * the code fell through to the origin, the origin 522'd, and the whole
   * official layer went blank — the one layer a mayor must not lose.
   *
   * This reproduces that exact sequence: the first snapshot read fails, the
   * origin is down, and the second read finds the snapshot that was there
   * all along.
   */
  it("serves the last-good snapshot when the origin is down", async () => {
    vi.resetModules();
    const snapshot = {
      features: [{
        id: "STN0503", name: "บ้านนางเอื้อย", lat: 8.4, lng: 99.9, type: "water",
        tambon: "ทุ่งปรัง", amphoe: "สิชล", basin: "ภาคใต้ฝั่งตะวันออก", status: 0,
        rain: 0, rain12h: 0, rain07h: 0, waterLevel: 2.94, soilMoisture: null,
        soil07h: null, alertMax: 4, warn: null,
        observedAt: new Date(Date.now() - 30 * 60_000).toISOString(), stale: false,
      }],
      meta: {
        source: "dwr-ews", fetchedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
        ageMinutes: 30, fallbackTier: "live",
      },
    };
    let reads = 0;
    vi.stubGlobal("caches", {
      default: {
        match: async () => {
          reads += 1;
          // The first read misses its deadline — the cold-isolate case.
          if (reads === 1) throw new Error("DWR snapshot cache deadline");
          return Response.json(snapshot);
        },
        put: async () => {},
      },
    });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("non-OK 522"));

    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };
    const feed = await fresh();

    expect(feed.features).toHaveLength(1);
    expect(feed.features[0].id).toBe("STN0503");
    // And it is marked as what it is: a last-good snapshot, never live.
    expect(feed.meta.fallbackTier).toBe("cache");
    expect(feed.meta.note).toContain("last-good snapshot");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("a snapshot read that keeps failing is named, and is not 'no snapshot stored'", async () => {
    // Measured 2026-10-26: with the origin 522-ing and a cold isolate's
    // cache read over its deadline, the official layer came back empty with
    // the note "no last-good snapshot is stored" — which is a different
    // fact from the truth. The read is retried, and if it still fails the
    // note says the read failed.
    vi.resetModules();
    vi.stubGlobal("caches", {
      default: {
        match: async () => { throw new Error("DWR snapshot cache deadline"); },
        put: async () => {},
      },
    });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("non-OK 522"));

    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };
    const feed = await fresh();

    expect(feed.features).toHaveLength(0);
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toContain("522");
    expect(feed.meta.note).toContain("could not be read");
    expect(feed.meta.note).not.toContain("no last-good snapshot is stored");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("an outage with no snapshot at all is an honest outage, not a calm feed", async () => {
    vi.resetModules();
    vi.stubGlobal("caches", { default: { match: async () => undefined, put: async () => {} } });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("non-OK 522"));

    const { fetchEwsStations: fresh } = (await import("./dwrEws.js")) as unknown as {
      fetchEwsStations: typeof fetchEwsStations;
    };
    const feed = await fresh();

    expect(feed.features).toHaveLength(0);
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toContain("522");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
