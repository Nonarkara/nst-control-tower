import { GOOGLE_MAPS_API_KEY } from "./googleKey";

/**
 * Google Map Tiles API session helper. The 2D tile endpoints require a session
 * token (minted once, valid ~2 weeks) before tiles can be fetched. We mint per
 * map type and cache the in-flight promise so concurrent layers share one token.
 *
 * createSession + tile fetches both carry the key — that's unavoidable for
 * client-side Google tiles, so the key must stay referrer/quota-restricted.
 */
export type GoogleTileType = "satellite" | "traffic" | "roadmap";

interface SessionResponse {
  session?: string;
  expiry?: string;
  error?: { message?: string };
}

const sessionCache = new Map<GoogleTileType, Promise<string | null>>();

function sessionBody(type: GoogleTileType): Record<string, unknown> {
  const base = { language: "en-US", region: "TH" };
  if (type === "traffic") {
    // Transparent overlay carrying only the traffic-flow layer, to sit over the basemap.
    return { ...base, mapType: "roadmap", layerTypes: ["layerTraffic"], overlay: true };
  }
  if (type === "satellite") return { ...base, mapType: "satellite" };
  return { ...base, mapType: "roadmap" };
}

export function getGoogleSession(type: GoogleTileType): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(null);
  const cached = sessionCache.get(type);
  if (cached) return cached;

  const p = fetch(`https://tile.googleapis.com/v1/createSession?key=${GOOGLE_MAPS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionBody(type)),
  })
    .then((r) => (r.ok ? (r.json() as Promise<SessionResponse>) : null))
    .then((d) => d?.session ?? null)
    .catch(() => null);

  sessionCache.set(type, p);
  return p;
}

/** MapLibre raster-source tile template for a minted session. */
export function googleTileTemplate(session: string): string {
  return `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${GOOGLE_MAPS_API_KEY}`;
}
