import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { inBbox } from "../lib/bbox.js";
import { fetchJsonOrThrow } from "./common.js";
import type { CctvCategory, CctvCamera, CctvStatus } from "./cctv.js";

/**
 * NST Municipality CCTV — https://nstcctv.nakhoncity.org/
 *
 * The municipal aggregator publishes a public camera list at
 * `/api/cameras/public` (no auth — verified). Cameras are grouped by Thai
 * category string (1.กล้องดูการจราจร / 2.กล้องหน้าโรงเรียน /
 * 3.กล้อง Safety Zone / 4.กล้องดูระดับน้ำ) and the upstream serves the live
 * HLS-like streams from `/cam/{id}/` (HD) and `/cam/{id}_sub/` (SD), which
 * the official site embeds via <iframe>.
 *
 * Streams are MediaMTX HTML reader pages — never HLS playlists or JPEG
 * snapshots — so we only surface `embedUrl` + `embedHdUrl`. The CctvStreamModal
 * recognises the nst-municipality vendor and renders an iframe directly.
 */
const ENDPOINT = "https://nstcctv.nakhoncity.org/api/cameras/public";
const STATUS_ENDPOINT = "https://nstcctv.nakhoncity.org/api/camera-status";
const STREAM_BASE = "https://nstcctv.nakhoncity.org";
const TTL_SECONDS = 600; // 10 min — physical camera inventory rarely changes

export const NST_CCTV_VENDOR = "nst-municipality" as const;

/** Upstream id prefix → CctvCategory. The official site uses two-letter
 *  Thai-flavored prefixes (TF / SC / SZ / WL) which are stable and a more
 *  reliable signal than the human-readable Thai group string. We fall back
 *  to the group string for any non-prefixed id. */
export function nstCctvCategory(id: string, group: string | undefined): CctvCategory {
  const upId = id.toUpperCase();
  if (upId.startsWith("TF")) return "traffic";
  if (upId.startsWith("SC")) return "school";
  if (upId.startsWith("SZ")) return "safety";
  if (upId.startsWith("WL")) return "water";
  if (!group) return "other";
  const g = group.toLowerCase();
  // 1.กล้องดูการจราจร — traffic
  if (g.startsWith("1.") || g.includes("การจราจร") || g.includes("จราจร")) return "traffic";
  // 2.กล้องหน้าโรงเรียน — school zone
  if (g.startsWith("2.") || g.includes("โรงเรียน") || g.includes("หน้า ร.ร")) return "school";
  // 3.กล้อง Safety Zone — safety / intersection watch
  if (g.startsWith("3.") || g.includes("safety")) return "safety";
  // 4.กล้องดูระดับน้ำ — water level
  if (g.startsWith("4.") || g.includes("ระดับน้ำ") || g.includes("คลอง")) return "water";
  return "other";
}

/** Fetch the live online/offline status map (separate cache so the inventory
 *  and the status have independent TTLs). Returns null on outage — the
 *  camera list still surfaces with `status: "unknown"` and the meta.note
 *  advertises that status is unavailable. */
async function fetchStatusMap(): Promise<Record<string, "online" | "offline"> | null> {
  return cached("cctv-nst-status", 60, async () => {
    try {
      const payload = await fetchJsonOrThrow<Record<string, string>>(STATUS_ENDPOINT);
      const out: Record<string, "online" | "offline"> = {};
      for (const [k, v] of Object.entries(payload ?? {})) {
        if (v === "online" || v === "offline") out[k] = v;
      }
      return out;
    } catch {
      return null;
    }
  });
}

interface NstCamera {
  id?: string;
  name?: string;
  group?: string;
  lat?: number;
  lng?: number;
}

async function fetchNstCctvInner(): Promise<NormalizedFeed<CctvCamera>> {
  return cached("cctv-nst-municipality", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const payload = await fetchJsonOrThrow<NstCamera[]>(ENDPOINT);
    const list = Array.isArray(payload) ? payload : [];
    const statusMap = await fetchStatusMap();

    const features: CctvCamera[] = [];
    let onlineCount = 0;
    for (const cam of list) {
      const lat = typeof cam.lat === "number" && Number.isFinite(cam.lat) ? cam.lat : null;
      const lng = typeof cam.lng === "number" && Number.isFinite(cam.lng) ? cam.lng : null;
      const id = typeof cam.id === "string" ? cam.id.trim() : "";
      if (!id || lat === null || lng === null) continue;
      if (!inBbox(lng, lat)) continue;
      const category = nstCctvCategory(id, cam.group);
      const status: CctvStatus = (statusMap?.[id] as CctvStatus | undefined) ?? "unknown";
      if (status === "online") onlineCount++;
      features.push({
        id: `nstcctv-${id}`,
        sourceId: id,
        name: cam.name?.trim() || id,
        lat,
        lng,
        vendor: NST_CCTV_VENDOR,
        category,
        status,
        // SD iframe URL — what the upstream site itself uses for the popup
        // player. The CctvStreamModal embeds it via <iframe>.
        embedUrl: `${STREAM_BASE}/cam/${encodeURIComponent(id)}_sub/`,
        // HD iframe URL — surfaced so the modal can offer SD↔HD toggle.
        embedHdUrl: `${STREAM_BASE}/cam/${encodeURIComponent(id)}/`,
        // Upstream category string (Thai) — passed through verbatim so the
        // modal/legend can group on it without us inventing a mapping.
        organization: cam.group?.trim() || undefined,
      });
    }

    const note =
      statusMap === null
        ? "nstcctv.nakhoncity.org status unavailable — live online/offline cannot be determined"
        : `${onlineCount}/${features.length} municipal cameras online`;

    return {
      features,
      meta: {
        source: "nstcctv-public",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "scenario",
        ...(note ? { note } : {}),
      },
    };
  });
}

// First-boot outage (throw + no stale to fall back on) → a calm scenario
// feed, not a 500 through safeFeed. Same fallback contract as the Longdo
// adapter — keeps the combined feed resilient when either source is down.
export async function fetchNstCctv(): Promise<NormalizedFeed<CctvCamera>> {
  try {
    return await fetchNstCctvInner();
  } catch {
    const fetchedAt = new Date().toISOString();
    return {
      features: [],
      meta: {
        source: "nstcctv-public",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "scenario",
      },
    };
  }
}
