import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { inBbox } from "../lib/bbox.js";
import { fetchJsonOrThrow } from "./common.js";
import { NST_CCTV_VENDOR, fetchNstCctv } from "./cctvNst.js";

const ENDPOINT = "https://camera.longdo.com/feed/?command=json";
const TTL_SECONDS = 600; // 10 min — camera list rarely changes

export { NST_CCTV_VENDOR } from "./cctvNst.js";

/** Normalised camera purpose — the NST municipal network's four groups. */
export type CctvCategory = "traffic" | "school" | "safety" | "water" | "other";
export type CctvStatus = "online" | "offline" | "unknown";

export interface CctvCamera {
  id: string;
  /** Upstream id without our vendor prefix (e.g. "TF056"). */
  sourceId?: string;
  name: string;
  lat: number;
  lng: number;
  vendor: "longdo" | "bma" | "exat" | typeof NST_CCTV_VENDOR;
  category?: CctvCategory;
  status?: CctvStatus;
  /** JPEG snapshot URL (Longdo). */
  imageUrl?: string;
  /** Real HLS playlist (Longdo). */
  hlsUrl?: string;
  /** HTML player page to <iframe> — SD (NST municipal MediaMTX reader). */
  embedUrl?: string;
  /** HD variant of embedUrl. */
  embedHdUrl?: string;
  organization?: string;
  updatedAt?: string;
}

interface LongdoCamera {
  camid?: string;
  title?: string;
  latitude?: string | number;
  longitude?: string | number;
  imgurl?: string;
  hls_url?: string;
  organization?: string;
  lastupdate?: string;
}

function num(v: string | number | undefined): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchCctvInner(): Promise<NormalizedFeed<CctvCamera>> {
  return cached("cctv-longdo", TTL_SECONDS, async () => {
    const fetchedAt = new Date().toISOString();
    const payload = await fetchJsonOrThrow<{ cameras?: LongdoCamera[] } | LongdoCamera[]>(ENDPOINT);
    const cameras = Array.isArray(payload) ? payload : payload?.cameras ?? [];

    const features: CctvCamera[] = [];
    for (const cam of cameras) {
      const lat = num(cam.latitude);
      const lng = num(cam.longitude);
      if (lat === null || lng === null) continue;
      if (!inBbox(lng, lat)) continue;
      features.push({
        id: `longdo-${cam.camid ?? `${lng}-${lat}`}`,
        sourceId: cam.camid ?? undefined,
        name: cam.title?.trim() || "Camera",
        lat,
        lng,
        vendor: "longdo",
        category: "traffic",
        status: "unknown",
        imageUrl: cam.imgurl,
        hlsUrl: cam.hls_url,
        organization: cam.organization,
        updatedAt: cam.lastupdate,
      });
    }

    return {
      features,
      meta: {
        source: "longdo-cameras",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "scenario",
      },
    };
  });
}

// First-boot outage (throw + no stale to fall back on) → a calm scenario
// feed, not a 500 through safeFeed.
export async function fetchCctv(): Promise<NormalizedFeed<CctvCamera>> {
  try {
    return await fetchCctvInner();
  } catch {
    const fetchedAt = new Date().toISOString();
    return {
      features: [],
      meta: {
        source: "longdo-cameras",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "scenario",
      },
    };
  }
}

/**
 * Combined CCTV feed — the Longdo national index + the NST municipal network
 * (nstcctv.nakhoncity.org). Each adapter falls back to an empty feed on its
 * own outage, so the worst case is one source, never a 500. Ids are vendor-
 * prefixed ("longdo-…", "nstcctv-…") so the two namespaces cannot collide.
 */
export async function fetchCctvAll(): Promise<NormalizedFeed<CctvCamera>> {
  const [longdo, nst] = await Promise.all([fetchCctv(), fetchNstCctv()]);
  const fetchedAt = new Date().toISOString();
  const features = [...nst.features, ...longdo.features];
  const down = [
    nst.features.length === 0 ? "nstcctv.nakhoncity.org" : null,
    longdo.features.length === 0 ? "Longdo" : null,
  ].filter(Boolean);
  const notes = [nst.meta.note, down.length ? `no cameras from ${down.join(" + ")}` : null].filter(Boolean);
  return {
    features,
    meta: {
      source: "cctv-combined",
      fetchedAt,
      ageMinutes: cacheAgeMinutes(fetchedAt),
      fallbackTier: features.length > 0 ? "live" : "unavailable",
      note: notes.length ? notes.join(" · ") : undefined,
    },
  };
}
