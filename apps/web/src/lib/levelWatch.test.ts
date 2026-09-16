import { describe, expect, test } from "vitest";
import type { WaterGauge, GistdaLevelPost } from "@nst/shared";
import type { CctvCamera } from "../map/layers";
import { judgeGauge, rankLevelWatch, summarizeLevelWatch, distanceM } from "./levelWatch";

function gauge(over: Partial<WaterGauge>): WaterGauge {
  return {
    id: "g", name: "gauge", lat: 8.43, lng: 99.96, levelMsl: 1, levelPrev: 1, warningMsl: null, criticalMsl: null,
    diffFromBank: -1, situationLevel: 3, trend: "stable", riverName: "คลองท่าดี", amphoe: "เมือง",
    observedAt: "2026-09-16T00:00:00Z", isKeyStation: false, stationCode: "X.1", bankMsl: 2, fullnessPct: 50,
    dischargeCms: null,
    ...over,
  } as WaterGauge;
}

describe("judgeGauge", () => {
  test("normal station → null", () => {
    expect(judgeGauge(gauge({}))).toBeNull();
  });
  test("overbank (situation 5 or diffFromBank ≥ 0 with a real bank) → critical", () => {
    expect(judgeGauge(gauge({ situationLevel: 5 }))?.level).toBe("critical");
    expect(judgeGauge(gauge({ diffFromBank: 0.1 }))?.level).toBe("critical");
  });
  test("RID bank=0 sentinel is NOT a bank — diffFromBank ≥ 0 alone does not fire", () => {
    const v = judgeGauge(gauge({ stationCode: "ridhydro_TNA.04", bankMsl: 0, diffFromBank: 19.49, fullnessPct: null, criticalMsl: 25.5, levelMsl: 19.49 }));
    expect(v).toBeNull();
  });
  test("RID critical headroom: ≤0 critical, ≤0.5 warning, ≤1.0 watch", () => {
    const base = { stationCode: "ridhydro_TNB.09", bankMsl: 0, fullnessPct: null, criticalMsl: 3.5, diffFromBank: null };
    expect(judgeGauge(gauge({ ...base, levelMsl: 3.6 }))?.level).toBe("critical");
    expect(judgeGauge(gauge({ ...base, levelMsl: 3.2 }))?.level).toBe("warning");
    expect(judgeGauge(gauge({ ...base, levelMsl: 2.7 }))?.level).toBe("watch");
    expect(judgeGauge(gauge({ ...base, levelMsl: 2.0 }))).toBeNull();
    expect(judgeGauge(gauge({ ...base, levelMsl: 3.2 }))?.sources).toEqual(["RID"]);
  });
  test("HII fullness bands: ≥100 critical, ≥90 (or situation 4) warning, ≥80 watch", () => {
    expect(judgeGauge(gauge({ fullnessPct: 101 }))?.level).toBe("critical");
    expect(judgeGauge(gauge({ fullnessPct: 93.6 }))?.level).toBe("warning");
    expect(judgeGauge(gauge({ fullnessPct: 73.5, situationLevel: 4 }))?.level).toBe("warning");
    expect(judgeGauge(gauge({ fullnessPct: 82 }))?.level).toBe("watch");
    expect(judgeGauge(gauge({ fullnessPct: 60 }))).toBeNull();
  });
});

describe("rankLevelWatch", () => {
  const cam: CctvCamera = { id: "nstcctv-WL006", sourceId: "WL006", name: "คลองท่าวัง(สะพานราเมศวร์)", lat: 8.4444, lng: 99.9611, vendor: "nst-municipality", category: "water", status: "online" };
  const farCam: CctvCamera = { ...cam, id: "nstcctv-WL099", sourceId: "WL099", lat: 8.30, lng: 99.90 };
  const offlineCam: CctvCamera = { ...cam, id: "nstcctv-WL098", sourceId: "WL098", status: "offline" };
  const post: GistdaLevelPost = { id: "p4", name: "สะพานราเมศร์", river: "คลองท่าวัง(ท่าชัก)", kind: "post", vMaxM: 0, amphoe: "อ.เมือง", province: "จ.นครศรีธรรมราช", lat: 8.4444, lng: 99.9611 };

  test("orders critical > warning > watch, then fullness, and attaches the nearest online camera + post", () => {
    const rows = rankLevelWatch({
      gauges: [
        gauge({ id: "w", name: "watch", fullnessPct: 82, lat: 8.4440, lng: 99.9605 }),
        gauge({ id: "c", name: "crit", situationLevel: 5, lat: 8.4440, lng: 99.9605 }),
        gauge({ id: "n", name: "normal" }),
        gauge({ id: "h", name: "hi", fullnessPct: 95, lat: 8.20, lng: 99.80 }),
      ],
      posts: [post],
      cameras: [farCam, offlineCam, cam],
    });
    expect(rows.map((r) => r.id)).toEqual(["c", "h", "w"]);
    expect(rows[0]?.camera?.sourceId).toBe("WL006");
    expect(rows[0]?.cameraDistanceM).toBeLessThan(200);
    expect(rows[0]?.post?.name).toBe("สะพานราเมศร์");
    expect(rows[0]?.sources).toEqual(["HII ThaiWater", "GISTDA post", "nstcctv"]);
    // 'hi' is ~30 km from every camera/post → nothing attached.
    expect(rows[1]?.camera).toBeNull();
    expect(rows[1]?.post).toBeNull();
  });

  test("summary counts", () => {
    const rows = rankLevelWatch({ gauges: [gauge({ situationLevel: 5 }), gauge({ id: "b", fullnessPct: 85 }), gauge({ id: "c", levelMsl: null })] });
    const s = summarizeLevelWatch(rows, [gauge({}), gauge({ id: "c", levelMsl: null })]);
    expect(s).toEqual({ critical: 1, warning: 0, watch: 1, total: 2, gaugesConsidered: 1 });
  });
});

describe("distanceM", () => {
  test("~111 km per degree of latitude", () => {
    expect(Math.round(distanceM(8, 99.9, 9, 99.9) / 1000)).toBe(111);
  });
});
