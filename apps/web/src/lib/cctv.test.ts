import { describe, expect, test } from "vitest";
import type { CctvCamera } from "../map/layers";
import { filterCameras, reliableWall, summarizeCctv, wallCandidates } from "./cctv";

function cam(sourceId: string, extra: Partial<CctvCamera> = {}): CctvCamera {
  return { id: `nstcctv-${sourceId}`, sourceId, name: sourceId, lat: 8.43, lng: 99.96, vendor: "nst-municipality", ...extra };
}

const CAMS: CctvCamera[] = [
  cam("TF010", { category: "traffic", status: "online", name: "สี่แยกหอนาฬิกา", embedUrl: "x" }),
  cam("TF2", { category: "traffic", status: "offline", embedUrl: "x" }),
  cam("WL005", { category: "water", status: "online", name: "คลองหน้าเมือง", embedUrl: "x" }),
  cam("SC004", { category: "school", status: "unknown", embedUrl: "x" }),
  cam("L1", { vendor: "longdo" }),
];

describe("summarizeCctv", () => {
  test("counts status and category, treating a missing category as other", () => {
    const s = summarizeCctv(CAMS);
    expect(s).toMatchObject({ total: 5, online: 2, offline: 1 });
    expect(s.byCategory).toEqual({ traffic: 2, school: 1, safety: 0, water: 1, other: 1 });
  });
});

describe("filterCameras", () => {
  test("filters by category", () => {
    expect(filterCameras(CAMS, { category: "water", query: "" }).map((c) => c.sourceId)).toEqual(["WL005"]);
  });

  test("matches Thai name text and camera id, ignoring case and extra spaces", () => {
    expect(filterCameras(CAMS, { category: "all", query: "คลอง" }).map((c) => c.sourceId)).toEqual(["WL005"]);
    expect(filterCameras(CAMS, { category: "all", query: "  tf010 " }).map((c) => c.sourceId)).toEqual(["TF010"]);
  });

  test("sorts by category order then natural id order", () => {
    expect(filterCameras(CAMS, { category: "all", query: "" }).map((c) => c.sourceId)).toEqual([
      "TF2", "TF010", "SC004", "WL005", "L1",
    ]);
  });
});

describe("wallCandidates", () => {
  test("drops known-offline cameras and cameras with no playable stream", () => {
    expect(wallCandidates(CAMS).map((c) => c.sourceId)).toEqual(["TF010", "WL005", "SC004"]);
  });
});

describe("reliableWall", () => {
  test("orders online first, then unknown, offline never", () => {
    expect(reliableWall(CAMS).map((c) => c.sourceId)).toEqual(["TF010", "WL005", "SC004"]);
  });

  test("keeps a stable slot order so wall paging does not reshuffle", () => {
    const twice = [reliableWall(CAMS).map((c) => c.id), reliableWall(CAMS).map((c) => c.id)];
    expect(twice[0]).toEqual(twice[1]);
  });
});
