/**
 * CCTV directory helpers — pure, shared by the camera directory panel, the
 * live-view modal and the map tooltip, so all three speak one vocabulary.
 */
import type { CctvCamera, CctvCategory } from "../map/layers";

export const CCTV_CATEGORIES: CctvCategory[] = ["traffic", "school", "safety", "water", "other"];

export const CCTV_CATEGORY_LABEL: Record<CctvCategory, { en: string; th: string }> = {
  traffic: { en: "Traffic", th: "จราจร" },
  school: { en: "School zone", th: "หน้าโรงเรียน" },
  safety: { en: "Safety zone", th: "เซฟตี้โซน" },
  water: { en: "Water level", th: "ระดับน้ำ" },
  other: { en: "Other", th: "อื่น ๆ" },
};

export interface CctvSummary {
  total: number;
  online: number;
  offline: number;
  byCategory: Record<CctvCategory, number>;
}

export function summarizeCctv(cameras: CctvCamera[]): CctvSummary {
  const byCategory: Record<CctvCategory, number> = { traffic: 0, school: 0, safety: 0, water: 0, other: 0 };
  let online = 0;
  let offline = 0;
  for (const c of cameras) {
    byCategory[c.category ?? "other"]++;
    if (c.status === "online") online++;
    else if (c.status === "offline") offline++;
  }
  return { total: cameras.length, online, offline, byCategory };
}

export interface CctvFilter {
  category: CctvCategory | "all";
  query: string;
}

const CATEGORY_ORDER = Object.fromEntries(CCTV_CATEGORIES.map((c, i) => [c, i])) as Record<CctvCategory, number>;

/** Filter by category + free text (name or camera id), sorted category → id. */
export function filterCameras(cameras: CctvCamera[], { category, query }: CctvFilter): CctvCamera[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  return cameras
    .filter((c) => category === "all" || (c.category ?? "other") === category)
    .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.sourceId ?? c.id).toLowerCase().includes(q))
    .sort(
      (a, b) =>
        CATEGORY_ORDER[a.category ?? "other"] - CATEGORY_ORDER[b.category ?? "other"] ||
        (a.sourceId ?? a.id).localeCompare(b.sourceId ?? b.id, "en", { numeric: true }),
    );
}

export function statusLabel(c: Pick<CctvCamera, "status">): string {
  return c.status === "online" ? "Online" : c.status === "offline" ? "Offline" : "Status unknown";
}

/** Cameras worth putting on the video wall: anything not known to be offline
 *  that actually has an embeddable or playable stream. */
export function wallCandidates(cameras: CctvCamera[]): CctvCamera[] {
  return cameras.filter((c) => c.status !== "offline" && !!(c.embedUrl || c.hlsUrl));
}

const STATUS_RANK: Record<string, number> = { online: 0, unknown: 1, offline: 2 };

/** The "always works" wall: online first, then status-unknown, offline last.
 *  Stable within a rank (category → id) so a camera keeps its slot while
 *  paging through the city. Feeds the 12-per-side paged wall — the capture
 *  pool only ever holds a few still-frame grabs, so paging is what keeps
 *  200+ cameras watchable on city bandwidth. */
export function reliableWall(cameras: CctvCamera[]): CctvCamera[] {
  return wallCandidates(cameras).sort((a, b) => {
    const ra = STATUS_RANK[a.status ?? "unknown"] ?? 1;
    const rb = STATUS_RANK[b.status ?? "unknown"] ?? 1;
    if (ra !== rb) return ra - rb;
    return (
      CATEGORY_ORDER[a.category ?? "other"] - CATEGORY_ORDER[b.category ?? "other"] ||
      (a.sourceId ?? a.id).localeCompare(b.sourceId ?? b.id, "en", { numeric: true })
    );
  });
}
