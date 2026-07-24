import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchCityReports } from "./adapters/cityReporter.js";
import { fetchItic } from "./adapters/itic.js";
import { fetchNews } from "./adapters/news.js";
async function tryArchiveApi() {
  if (typeof process === "undefined" || !process.versions?.node) return null;
  try {
    return await import("./lib/newsArchive.js");
  } catch {
    return null;
  }
}
import { fetchWeather } from "./adapters/weather.js";
import { fetchPrecipNowcast, fetchZonePrecipNowcast } from "./adapters/precipNowcast.js";
import { fetchWrfRainOutlook, fetchWrfRainGrid } from "./adapters/wrfRain.js";
import { fetchAirQuality, fetchAirQualityTrend } from "./adapters/airQuality.js";
import {
  fetchGoogleGeocode,
  fetchGooglePlaces,
  fetchGoogleAirQuality,
  fetchStreetViewMeta,
  streetViewImageUrl,
} from "./adapters/google.js";
import { fetchCctv } from "./adapters/cctv.js";
import { fetchTrends } from "./adapters/trends.js";
import { fetchExecutiveSnapshot, deriveAlerts } from "./adapters/executive.js";
import { fetchMarkets } from "./adapters/markets.js";
import { chat, ChatError, type ChatMessage } from "./adapters/chat.js";
import { fetchIsochrone } from "./adapters/isochrone.js";
import { validateCvEvent, recordCvEvent, listCvEvents, cvEventStats, CvValidationError } from "./lib/cvEvents.js";
import { isValidLatLng } from "./lib/bbox.js";
import { fetchFloodGauges, fetchDamStatus } from "./adapters/flood.js";
import { fetchSouthernFloodRisk, fetchSouthernRiverCascade } from "./adapters/flooddash.js";
import { fetchWaterGauges, fetchRainfall } from "./adapters/thaiwater.js";
import { fetchWaterBalance } from "./adapters/waterBalance.js";
import { fetchNationalWaterways } from "./adapters/waterways.js";
import { fetchHistoricalRainfall } from "./adapters/historicalRain.js";
import { fetchNationalFloodProne } from "./adapters/floodProne.js";
import { fetchFloodRiskVillages } from "./adapters/flood-risk-villages.js";
import { fetchUnosit2021Exposure } from "./adapters/unosatExposure.js";
import { fetchEwsStations } from "./adapters/dwrEws.js";
import { fetchRidReservoirs } from "./adapters/rid.js";
import { fetchFlights } from "./adapters/flights.js";
import { fetchDatagoPoints, fetchDatagoDatasets, fetchReservoirs, fetchDisasterStats, fetchFahfon, fetchProvincialKPIs } from "./adapters/datago.js";
import { fetchTourismVisitors } from "./adapters/tourism-visitors.js";
import { fetchFacebookPosts } from "./adapters/facebook.js";
import { buildAtlasSnapshot, getAtlasModule, ATLAS_SOURCES } from "./data/index.js";
import {
  searchCorpus, askConcierge, computeInsights, readArchive,
  academyTracks, getLesson, GLOSSARY, DATA_DICTIONARY,
} from "./platform/index.js";
import { fetchGistdaPoi, fetchGistdaSolar, fetchGistdaLandUse } from "./adapters/gistda.js";
import { fetchAqicnNst } from "./adapters/aqicn.js";
import { fetchAir4Thai } from "./adapters/air4thai.js";
import { fetchNasaEarth } from "./adapters/nasa-power.js";
import { SOURCE_CATALOG, CHONBURI } from "@nst/shared";
import type { NormalizedFeed, AirQualityPoint, IncidentFeature, IntelligenceItem, ExecutiveSnapshot, MarketSnapshot } from "@nst/shared";
import { recordAdapterSuccess, recordAdapterError, getAllHealth, getSystemStatus } from "./lib/health.js";
import { getMqttStatus } from "./adapters/mqttBridge.js";
import { twinDbStatus } from "./lib/twinDb.js";
import twinApp from "./routes/twin.js";
import floodRiskVillagesApp from "./routes/flood-risk-villages.js";
import damageHotspotsApp from "./routes/damage-hotspots.js";

type Bindings = {
  ENVIRONMENT?: string;
  GEMINI_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
  FMP_API_KEY?: string;
  FRED_API_KEY?: string;
  VIABUS_TOKEN?: string;
  VIABUS_BASE_URL?: string;
  AQICN_TOKEN?: string;
  ACLED_API_KEY?: string;
  ACLED_EMAIL?: string;
  FACEBOOK_PAGE_ID?: string;
  FACEBOOK_PAGE_TOKEN?: string;
  DATA_GO_TH_TOKEN?: string;
  DATABASE_URL?: string;
  SUPABASE_DB_URL?: string;
  SUPABASE_DATABASE_URL?: string;
  GEOAPIFY_API_KEY?: string;
  AIRLABS_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const ALLOWED_ORIGINS = new Set([
  "https://nst.nonarkara.org",
  "https://nst-control-tower.pages.dev",
  "http://localhost:5173",
  "http://localhost:8787",
]);

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      if (ALLOWED_ORIGINS.has(origin)) return origin;
      if (origin.startsWith("http://localhost:")) return origin;
      if (/^https:\/\/(?:[a-z0-9-]+\.)?nst-control-tower\.pages\.dev$/.test(origin)) return origin;
      return "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

app.get("/", (c) =>
  c.json({
    service: "nst-control-tower-api",
    routes: [
      "/api/health",
      "/api/db/status",
      "/api/sources",
      "/api/incidents/city-reports",
      "/api/incidents/itic",
      "/api/news",
      "/api/news/archive",
      "/api/news/digest",
      "/api/news/stats",
      "/api/weather",
      "/api/precip-nowcast",
      "/api/precip-nowcast/zones",
      "/api/wrf/rain-outlook",
      "/api/wrf/rain-grid",
      "/api/air-quality",
      "/api/air-quality/trend",
      "/api/air-quality/air4thai",
      "/api/cctv/longdo",
      "/api/trends",
      "/api/markets",
      "/api/executive",
      "/api/flood/gauges",
      "/api/flood/dam",
      "/api/flood/national-prone",
      "/api/flood/unosat-2021",
      "/api/flood/south/risk",
      "/api/flood/south/rivers",
      "/api/flood-risk-villages",
      "/api/water/national-waterways",
      "/api/water/balance",
      "/api/rainfall/historical",
      "/api/datago/points",
      "/api/datago/datasets",
      "/api/datago/reservoirs",
      "/api/datago/disasters",
      "/api/datago/fahfon",
      "/api/datago/provincial-kpis",
      "/api/tourism-visitors",
      "/api/social/facebook",
      "/api/chat",
      "/api/health/detailed",
      "/api/health/keys",
      "/api/twin/objects",
      "/api/twin/relations",
      "/api/twin/state",
      "/api/twin/snapshot",
      "/api/damage-hotspots",
      "/api/gistda/poi",
      "/api/gistda/solar",
      "/api/gistda/landuse",
      "/api/nasa/earth-readings",
    ],
  }),
);

app.get("/api/sources", (c) => c.json({ sources: SOURCE_CATALOG }));

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    at: new Date().toISOString(),
    env: c.env.ENVIRONMENT ?? "unknown",
  }),
);

app.get("/api/health/detailed", (c) => {
  const sys = getSystemStatus();
  return c.json({
    system: sys,
    adapters: getAllHealth(),
    mqtt: getMqttStatus(),
    at: new Date().toISOString(),
  });
});

/**
 * Which optional API keys are configured. Drives the "needs key" UX in the
 * layer palette + SOURCES catalog. Never returns key values — only presence.
 */
const API_KEY_REGISTRY: { env: keyof Bindings; label: string; powers: string; getAt: string }[] = [
  { env: "AQICN_TOKEN",       label: "AQICN",       powers: "World Air Quality Index station readings",            getAt: "https://aqicn.org/data-platform/token/" },
  { env: "GEMINI_API_KEY",    label: "Gemini",      powers: "AI chat assistant + news summarisation",              getAt: "https://aistudio.google.com/apikey" },
  { env: "FMP_API_KEY",       label: "FMP",         powers: "Market data (executive briefing economic indicators)", getAt: "https://site.financialmodelingprep.com/developer/docs" },
  { env: "FRED_API_KEY",      label: "FRED",        powers: "US/Thai macro-economic series (executive)",            getAt: "https://fred.stlouisfed.org/docs/api/api_key.html" },
  { env: "FACEBOOK_PAGE_TOKEN", label: "Facebook",  powers: "Municipal Facebook page posts",                        getAt: "https://developers.facebook.com/docs/pages-api" },
  { env: "DATA_GO_TH_TOKEN",  label: "data.go.th",  powers: "Thai open-data: reservoirs, disasters, provincial KPIs", getAt: "https://data.go.th" },
  { env: "AIRLABS_API_KEY",   label: "AirLabs",     powers: "NST airport FIDS — arrivals & departures (free: 1,000 req/month)", getAt: "https://airlabs.co" },
  { env: "GOOGLE_MAPS_API_KEY", label: "Google Maps", powers: "Street View, Geocoding, Places, Air Quality (server-side); 3D tiles + traffic (client)", getAt: "https://console.cloud.google.com/apis/credentials" },
];

app.get("/api/health/keys", (c) => {
  const keys = API_KEY_REGISTRY.map((k) => ({
    key: k.env,
    label: k.label,
    powers: k.powers,
    getAt: k.getAt,
    configured: Boolean(c.env[k.env] && String(c.env[k.env]).trim().length > 0),
  }));
  const configured = keys.filter((k) => k.configured).length;
  c.header("Cache-Control", "no-store");
  return c.json({ keys, configured, total: keys.length, at: new Date().toISOString() });
});

app.get("/api/db/status", async (c) => {
  c.header("Cache-Control", "no-store");
  return c.json(await twinDbStatus());
});

interface FeedMeta {
  meta: { ageMinutes: number; fallbackTier: string; source: string };
}

function setMetaHeaders(c: { header: (k: string, v: string) => void }, feed: FeedMeta) {
  c.header("x-source", feed.meta.source);
  c.header("x-age-minutes", String(feed.meta.ageMinutes));
  c.header("x-fallback-tier", feed.meta.fallbackTier);
}

const rateLimiter = new Map<string, { count: number; resetAt: number }>();
// The dashboard legitimately fans out ~40-50 feed requests on first load, plus
// the Atlas + Knowledge Platform. 120/min/IP tripped under a normal refresh, so
// the ceiling is generous; abusive clients are still bounded.
const RATE_LIMIT = 600;

function getClientIp(c: { req: { header: (k: string) => string | undefined }; env: Bindings }): string {
  return c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function cleanupStaleLimiters() {
  const now = Date.now();
  for (const [ip, entry] of rateLimiter) {
    if (now > entry.resetAt) rateLimiter.delete(ip);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateLimiter.size > 1000) cleanupStaleLimiters();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

app.use("/api/*", async (c, next) => {
  const ip = getClientIp(c);
  if (isRateLimited(ip)) {
    return c.json({ error: "Rate limit exceeded. Slow down." }, 429);
  }
  await next();
});

async function safeFeed<T>(
  c: { header: (k: string, v: string) => void; json: (obj: unknown, status?: number) => Response },
  fetcher: () => Promise<NormalizedFeed<T>>,
  adapterName?: string,
): Promise<Response> {
  try {
    const feed = await fetcher();
    setMetaHeaders(c, feed);
    if (adapterName) {
      // Treat "unavailable" fallback tier as a health error so the SOURCES catalog
      // can surface missing-API-key conditions (and other silent failures) instead
      // of just showing a green dot for a feed that returns zero features.
      if (feed.meta.fallbackTier === "unavailable") {
        recordAdapterError(adapterName, feed.meta.note ?? `Adapter unavailable (${feed.meta.source})`);
      } else {
        recordAdapterSuccess(adapterName, feed.meta.ageMinutes);
      }
    }
    return c.json(feed);
  } catch (err) {
    const message = (err as Error).message ?? "Internal server error";
    console.error(`API error [${adapterName ?? "unknown"}]:`, message);
    if (adapterName) recordAdapterError(adapterName, message);
    return c.json({ error: message }, 500);
  }
}

app.get("/api/incidents/city-reports", async (c) => safeFeed(c, fetchCityReports, "city-reports"));
app.get("/api/incidents/itic", async (c) => safeFeed(c, fetchItic, "itic"));
app.get("/api/news", async (c) => safeFeed(c, fetchNews, "news"));

app.get("/api/news/archive", async (c) => {
  const mod = await tryArchiveApi();
  if (!mod) return c.json({ error: "Archive only available on Node runtime" }, 503);
  const q = c.req.query();
  const limit = q.limit ? Math.min(Math.max(Number.parseInt(q.limit, 10) || 200, 1), 5000) : 200;
  const records = await mod.readNewsArchive({
    since: q.since,
    until: q.until,
    source: q.source,
    language: q.language as never,
    q: q.q,
    limit,
  });
  c.header("Cache-Control", "public, max-age=60");
  return c.json({ records, count: records.length });
});

app.get("/api/news/digest", async (c) => {
  const mod = await tryArchiveApi();
  if (!mod) return c.json({ error: "Archive only available on Node runtime" }, 503);
  const periodParam = c.req.query("period");
  const period = periodParam === "24h" || periodParam === "30d" ? periodParam : "7d";
  const digest = await mod.digestNewsArchive(period);
  c.header("Cache-Control", "public, max-age=300");
  return c.json(digest);
});

app.get("/api/news/stats", async (c) => {
  const mod = await tryArchiveApi();
  if (!mod) return c.json({ error: "Archive only available on Node runtime" }, 503);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(await mod.newsArchiveStats());
});

app.get("/api/weather", async (c) => safeFeed(c, fetchWeather, "weather"));
app.get("/api/precip-nowcast", async (c) => safeFeed(c, fetchPrecipNowcast, "precip-nowcast"));
app.get("/api/precip-nowcast/zones", async (c) => safeFeed(c, fetchZonePrecipNowcast, "precip-nowcast-zones"));
app.get("/api/wrf/rain-outlook", async (c) => safeFeed(c, fetchWrfRainOutlook, "wrf-rain-outlook"));
app.get("/api/wrf/rain-grid", async (c) => {
  const raw = Number(c.req.query("day") ?? "1");
  const day = (raw === 2 ? 2 : raw === 3 ? 3 : 1) as 1 | 2 | 3;
  return safeFeed(c, () => fetchWrfRainGrid(day), "wrf-rain-grid");
});
app.get("/api/air-quality", async (c) => safeFeed(c, fetchAirQuality, "air-quality"));
app.get("/api/air-quality/trend", async (c) => safeFeed(c, fetchAirQualityTrend, "air-quality-trend"));
app.get("/api/air-quality/aqicn", async (c) => safeFeed(c, () => fetchAqicnNst({ AQICN_TOKEN: c.env.AQICN_TOKEN }), "aqicn"));
app.get("/api/air-quality/air4thai", async (c) => safeFeed(c, fetchAir4Thai, "air4thai"));
app.get("/api/cctv/longdo", async (c) => safeFeed(c, fetchCctv, "cctv"));
app.get("/api/trends", async (c) => safeFeed(c, fetchTrends, "trends"));
app.get("/api/flood/gauges", async (c) => safeFeed(c, fetchFloodGauges, "flood-gauges"));
app.get("/api/flood/dam", async (c) => safeFeed(c, fetchDamStatus, "flood-dam"));
app.get("/api/water/gauges", async (c) => safeFeed(c, fetchWaterGauges, "thaiwater-gauges"));
app.get("/api/water/rain", async (c) => safeFeed(c, fetchRainfall, "thaiwater-rain"));
app.get("/api/water/ews", async (c) => safeFeed(c, fetchEwsStations, "dwr-ews"));
app.get("/api/water/reservoirs-rid", async (c) => safeFeed(c, fetchRidReservoirs, "rid-reservoirs"));
app.get("/api/water/national-waterways", async (c) => safeFeed(c, fetchNationalWaterways, "national-waterways"));
app.get("/api/water/balance", async (c) => safeFeed(c, fetchWaterBalance, "water-balance"));
app.get("/api/rainfall/historical", async (c) => {
  const qLat = parseFloat(c.req.query("lat") ?? "");
  const qLng = parseFloat(c.req.query("lng") ?? "");
  const hasLat = Number.isFinite(qLat);
  const hasLng = Number.isFinite(qLng);
  if ((hasLat || hasLng) && !isValidLatLng(hasLat ? qLat : 8.44, hasLng ? qLng : 99.93)) {
    return c.json({ error: "lat must be within -90..90 and lng within -180..180" }, 400);
  }
  const lat = hasLat ? qLat : 8.44;
  const lng = hasLng ? qLng : 99.93;
  return safeFeed(c, () => fetchHistoricalRainfall({ lat, lng }), "historical-rainfall");
});
app.get("/api/flood/national-prone", async (c) => safeFeed(c, fetchNationalFloodProne, "national-flood-prone"));
app.get("/api/flood/unosat-2021", async (c) => safeFeed(c, fetchUnosit2021Exposure, "unosat-2021-exposure"));
app.get("/api/flood/south/risk", async (c) => safeFeed(c, fetchSouthernFloodRisk, "flooddash-south-risk"));
app.get("/api/flood/south/rivers", async (c) => safeFeed(c, fetchSouthernRiverCascade, "flooddash-south-rivers"));
app.get("/api/flights", async (c) => safeFeed(c, () => fetchFlights({ AIRLABS_API_KEY: c.env.AIRLABS_API_KEY }), "flights-nst"));

// ── Google Maps Platform (server-side; key never reaches the browser) ──────────
app.get("/api/google/geocode", async (c) =>
  safeFeed(c, () => fetchGoogleGeocode(c.req.query("q") ?? "", { GOOGLE_MAPS_API_KEY: c.env.GOOGLE_MAPS_API_KEY }), "google-geocode"));
app.get("/api/google/places", async (c) =>
  safeFeed(c, () => fetchGooglePlaces(c.req.query("q") ?? "", { GOOGLE_MAPS_API_KEY: c.env.GOOGLE_MAPS_API_KEY }), "google-places"));
app.get("/api/google/air-quality", async (c) => {
  const [lng, lat] = CHONBURI.center;
  const qLat = Number.parseFloat(c.req.query("lat") ?? "");
  const qLng = Number.parseFloat(c.req.query("lng") ?? "");
  const hasLat = Number.isFinite(qLat);
  const hasLng = Number.isFinite(qLng);
  if ((hasLat || hasLng) && !isValidLatLng(hasLat ? qLat : lat, hasLng ? qLng : lng)) {
    return c.json({ error: "lat must be within -90..90 and lng within -180..180" }, 400);
  }
  return safeFeed(c, () => fetchGoogleAirQuality(
    hasLat ? qLat : lat,
    hasLng ? qLng : lng,
    { GOOGLE_MAPS_API_KEY: c.env.GOOGLE_MAPS_API_KEY },
  ), "google-air-quality");
});
app.get("/api/streetview/meta", async (c) => {
  const [lng, lat] = CHONBURI.center;
  const qLat = Number.parseFloat(c.req.query("lat") ?? "");
  const qLng = Number.parseFloat(c.req.query("lng") ?? "");
  const hasLat = Number.isFinite(qLat);
  const hasLng = Number.isFinite(qLng);
  if ((hasLat || hasLng) && !isValidLatLng(hasLat ? qLat : lat, hasLng ? qLng : lng)) {
    return c.json({ error: "lat must be within -90..90 and lng within -180..180" }, 400);
  }
  return safeFeed(c, () => fetchStreetViewMeta(
    hasLat ? qLat : lat,
    hasLng ? qLng : lng,
    { GOOGLE_MAPS_API_KEY: c.env.GOOGLE_MAPS_API_KEY },
  ), "google-streetview");
});
// Image proxy — streams Street View Static bytes so the key stays server-side.
app.get("/api/streetview", async (c) => {
  const key = c.env.GOOGLE_MAPS_API_KEY;
  if (!key) return c.json({ error: "GOOGLE_MAPS_API_KEY not set" }, 503);
  const [lng, lat] = CHONBURI.center;
  const qLat = Number.parseFloat(c.req.query("lat") ?? "");
  const qLng = Number.parseFloat(c.req.query("lng") ?? "");
  const num = (v: string | undefined): number | undefined => {
    const n = Number.parseFloat(v ?? "");
    return Number.isFinite(n) ? n : undefined;
  };
  const url = streetViewImageUrl(
    {
      lat: Number.isFinite(qLat) ? qLat : lat,
      lng: Number.isFinite(qLng) ? qLng : lng,
      heading: num(c.req.query("heading")),
      pitch: num(c.req.query("pitch")),
      fov: num(c.req.query("fov")),
      size: c.req.query("size") ?? undefined,
    },
    key,
  );
  const upstream = await fetch(url);
  if (!upstream.ok) return c.json({ error: `Street View ${upstream.status}` }, 502);
  c.header("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(await upstream.arrayBuffer());
});

// WAQI / AQICN air-quality tile proxy — streams the US-EPA-AQI raster so the
// AQICN token stays server-side (never in a client tile URL). This is the
// AirDash "field" overlay: where the air thickens across the province. A 1×1
// transparent PNG is returned when the token is unset so the map degrades
// silently instead of 404-flooding the console.
const TRANSPARENT_PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);
app.get("/api/air/waqi/:z/:x/:y", async (c) => {
  const token = c.env.AQICN_TOKEN;
  const clear = () => {
    c.header("Content-Type", "image/png");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(TRANSPARENT_PNG.buffer as ArrayBuffer);
  };
  if (!token) return clear();
  const z = Number.parseInt(c.req.param("z"), 10);
  const x = Number.parseInt(c.req.param("x"), 10);
  // strip any .png suffix a tile client may append to {y}
  const y = Number.parseInt(String(c.req.param("y")).replace(/\.png$/, ""), 10);
  if (![z, x, y].every(Number.isFinite)) return c.json({ error: "bad tile coords" }, 400);
  const url = `https://tiles.waqi.info/tiles/usepa-aqi/${z}/${x}/${y}.png?token=${encodeURIComponent(token)}`;
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!upstream.ok) return clear();
    c.header("Content-Type", upstream.headers.get("content-type") ?? "image/png");
    c.header("Cache-Control", "public, max-age=600");
    return c.body(await upstream.arrayBuffer());
  } catch {
    return clear();
  }
});

// ── NST Data Atlas — static outcome-data layer from the Municipal Data Bible ──
app.get("/api/atlas", (c) => {
  const snap = buildAtlasSnapshot();
  setMetaHeaders(c, snap);
  return c.json(snap);
});
app.get("/api/atlas/sources", (c) => c.json({ sources: ATLAS_SOURCES, count: ATLAS_SOURCES.length }));
app.get("/api/atlas/:module", (c) => {
  const m = getAtlasModule(c.req.param("module"));
  if (!m) return c.json({ error: "Unknown atlas module" }, 404);
  return c.json(m);
});

// ── Yala Knowledge Platform — search / academy / archive / insights / concierge ──
app.get("/api/search", (c) => {
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? 30);
  const type = c.req.query("type") as import("@nst/shared").SearchDocType | undefined;
  return c.json(searchCorpus(q, { limit: Number.isFinite(limit) ? limit : 30, type }));
});
app.get("/api/academy", (c) => c.json({ tracks: academyTracks() }));
app.get("/api/academy/:lesson", (c) => {
  const l = getLesson(c.req.param("lesson"));
  if (!l) return c.json({ error: "Unknown lesson" }, 404);
  return c.json(l);
});
app.get("/api/glossary", (c) => c.json({ terms: GLOSSARY, count: GLOSSARY.length }));
app.get("/api/dictionary", (c) => c.json({ entries: DATA_DICTIONARY, count: DATA_DICTIONARY.length }));
// Pass a real timestamp so each insight's `ts` reflects when it was computed,
// not the 2026-06-17 Yala-fork fixture that was the default.
app.get("/api/insights", (c) => c.json(computeInsights(new Date().toISOString())));
app.get("/api/archive", async (c) => {
  const metrics = c.req.query("metrics");
  return c.json(await readArchive(metrics ? metrics.split(",") : undefined));
});
app.get("/api/concierge", async (c) =>
  c.json(await askConcierge(c.req.query("q") ?? "", { GEMINI_API_KEY: c.env.GEMINI_API_KEY })),
);
app.post("/api/concierge", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { question?: string };
  return c.json(await askConcierge(body.question ?? "", { GEMINI_API_KEY: c.env.GEMINI_API_KEY }));
});
app.get("/api/datago/points", (c) => {
  const feed = fetchDatagoPoints();
  setMetaHeaders(c, feed);
  return c.json(feed);
});
app.get("/api/datago/datasets",  async (c) => safeFeed(c, fetchDatagoDatasets, "datago-datasets"));
app.get("/api/datago/reservoirs", async (c) => {
  const token = c.env.DATA_GO_TH_TOKEN ?? "";
  return safeFeed(c, () => fetchReservoirs(token), "reservoirs");
});
app.get("/api/datago/disasters",  async (c) => {
  const token = c.env.DATA_GO_TH_TOKEN ?? "";
  return safeFeed(c, () => fetchDisasterStats(token), "disasters");
});
app.get("/api/datago/fahfon",     async (c) => {
  const token = c.env.DATA_GO_TH_TOKEN ?? "";
  return safeFeed(c, () => fetchFahfon(token), "fahfon");
});
app.get("/api/datago/provincial-kpis", async (c) => {
  const token = c.env.DATA_GO_TH_TOKEN ?? "";
  return safeFeed(c, () => fetchProvincialKPIs(token));
});
app.get("/api/tourism-visitors", async (c) => safeFeed(c, fetchTourismVisitors, "tourism-visitors"));
app.get("/api/gistda/poi",     async (c) => safeFeed(c, fetchGistdaPoi, "gistda-poi"));
app.get("/api/gistda/solar",   async (c) => {
  const month = c.req.query("month") ? Number(c.req.query("month")) : undefined;
  return safeFeed(c, () => fetchGistdaSolar(month), "gistda-solar");
});
app.get("/api/gistda/landuse", async (c) => safeFeed(c, fetchGistdaLandUse, "gistda-landuse"));
app.get("/api/nasa/earth-readings", async (c) => safeFeed(c, fetchNasaEarth, "nasa-power"));
app.get("/api/social/facebook", async (c) =>
  safeFeed(c, () => fetchFacebookPosts({ FACEBOOK_PAGE_ID: c.env.FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN: c.env.FACEBOOK_PAGE_TOKEN }), "facebook"),
);
app.get("/api/markets", async (c) =>
  safeFeed(c, () => fetchMarkets({ FMP_API_KEY: c.env.FMP_API_KEY, FRED_API_KEY: c.env.FRED_API_KEY }), "markets"),
);

app.get("/api/executive", async (c) => {
  try {
    const snapshot = fetchExecutiveSnapshot();
    const [aq, cr, itic, newsFeed] = await Promise.allSettled([
      fetchAirQuality().catch(() => ({ features: [] as AirQualityPoint[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } })),
      fetchCityReports().catch(() => ({ features: [] as IncidentFeature[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } })),
      fetchItic().catch(() => ({ features: [] as IncidentFeature[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } })),
      fetchNews().catch(() => ({ features: [] as IntelligenceItem[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } })),
    ]);

    const aqOk = aq.status === "fulfilled" ? aq.value : { features: [] as AirQualityPoint[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } };
    const crOk = cr.status === "fulfilled" ? cr.value : { features: [] as IncidentFeature[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } };
    const iticOk = itic.status === "fulfilled" ? itic.value : { features: [] as IncidentFeature[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } };
    const newsOk = newsFeed.status === "fulfilled" ? newsFeed.value : { features: [] as IntelligenceItem[], meta: { source: "", fetchedAt: "", ageMinutes: 0, fallbackTier: "unavailable" as const } };

    const aqiVal = aqOk.features[0]?.aqi ?? null;
    const openIncidents = crOk.features.filter((r) => r.status !== "resolved").length + iticOk.features.length;
    const newsItems = newsOk.features.map((n) => ({ title: n.title, score: n.score, publishedAt: n.publishedAt }));

    const alerts = deriveAlerts(aqiVal, openIncidents, newsItems);
    const data: ExecutiveSnapshot = { ...snapshot.features[0], alerts };
    const feed: NormalizedFeed<ExecutiveSnapshot> = { features: [data], meta: snapshot.meta };
    setMetaHeaders(c, feed);
    return c.json(feed);
  } catch (err) {
    console.error("Executive API error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

const chatLimiter = new Map<string, { count: number; resetAt: number }>();
const CHAT_RATE_LIMIT = 20;

function isChatRateLimited(ip: string): boolean {
  const now = Date.now();
  if (chatLimiter.size > 500) {
    for (const [k, v] of chatLimiter) if (now > v.resetAt) chatLimiter.delete(k);
  }
  const entry = chatLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    chatLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= CHAT_RATE_LIMIT) return true;
  entry.count++;
  return false;
}

app.post("/api/chat", async (c) => {
  const ip = getClientIp(c);
  if (isChatRateLimited(ip)) {
    return c.json({ error: "Chat rate limit exceeded. Wait a minute." }, 429);
  }
  const geminiApiKey = c.env.GEMINI_API_KEY;
  const ollamaBaseUrl = c.env.OLLAMA_BASE_URL;
  const ollamaModel = c.env.OLLAMA_MODEL;
  if (!geminiApiKey && !ollamaBaseUrl) {
    recordAdapterError("chat", "Missing GEMINI_API_KEY (and no OLLAMA_BASE_URL fallback) — chat disabled");
    return c.json({ error: "Chat service not configured" }, 503);
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  try {
    const result = await chat({ messages: body.messages ?? [] }, { geminiApiKey, ollamaBaseUrl, ollamaModel });
    c.header("x-source", result.meta.source);
    c.header("x-fallback-tier", result.meta.fallbackTier);
    return c.json(result);
  } catch (err) {
    if (err instanceof ChatError) {
      return c.json({ error: err.message }, err.status as 400 | 429 | 502 | 503);
    }
    console.error("[chat] unexpected:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.route("/api/twin", twinApp);
app.route("/api/damage-hotspots", damageHotspotsApp);
app.route("/api/flood-risk-villages", floodRiskVillagesApp);

// ── Geoapify Isochrone ────────────────────────────────────────────────────────
// GET /api/isochrone?lng=100.99&lat=13.36&minutes=15&mode=walk
app.get("/api/isochrone", async (c) => {
  const lng = parseFloat(c.req.query("lng") ?? "");
  const lat = parseFloat(c.req.query("lat") ?? "");
  const minutes = parseInt(c.req.query("minutes") ?? "15", 10);
  const mode = (c.req.query("mode") ?? "walk") as Parameters<typeof fetchIsochrone>[3];

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return c.json({ error: "lng and lat must be finite numbers" }, 400);
  }
  if (minutes < 1 || minutes > 120) {
    return c.json({ error: "minutes must be between 1 and 120" }, 400);
  }
  const validModes = new Set(["walk", "bicycle", "drive", "approximated_transit"]);
  if (!validModes.has(mode)) {
    return c.json({ error: "mode must be walk|bicycle|drive|approximated_transit" }, 400);
  }

  return safeFeed(c, () =>
    fetchIsochrone(lng, lat, minutes, mode, c.env.GEOAPIFY_API_KEY));
});

// ── CCTV computer-vision events ───────────────────────────────────────────────
app.post("/api/cctv/cv-events", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const messages = Array.isArray(body) ? body : [body];
  let accepted = 0;
  const errors: string[] = [];
  for (const raw of messages) {
    try {
      const event = validateCvEvent(raw);
      recordCvEvent(event);
      accepted++;
    } catch (err) {
      if (err instanceof CvValidationError) {
        errors.push(err.message);
      }
    }
  }
  return c.json({ accepted, errors }, errors.length > 0 && accepted === 0 ? 400 : 200);
});

app.get("/api/cctv/cv-events", async (c) => {
  const events = listCvEvents({
    cameraId: c.req.query("cameraId"),
    since: c.req.query("since"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : undefined,
    cls: c.req.query("class"),
  });
  return c.json({ events, count: events.length });
});

app.get("/api/cctv/cv-events/stats", (c) => c.json(cvEventStats()));

export default app;
