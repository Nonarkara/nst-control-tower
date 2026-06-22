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
import { fetchPrecipNowcast } from "./adapters/precipNowcast.js";
import { fetchAirQuality, fetchAirQualityTrend } from "./adapters/airQuality.js";
import { fetchCctv } from "./adapters/cctv.js";
import { fetchTrends } from "./adapters/trends.js";
import { fetchExecutiveSnapshot, deriveAlerts } from "./adapters/executive.js";
import { fetchMarkets } from "./adapters/markets.js";
import { chat, ChatError, type ChatMessage } from "./adapters/chat.js";
import { fetchIsochrone } from "./adapters/isochrone.js";
import { validateCvEvent, recordCvEvent, listCvEvents, cvEventStats, CvValidationError } from "./lib/cvEvents.js";
import { fetchFloodGauges, fetchDamStatus } from "./adapters/flood.js";
import { fetchWaterGauges, fetchRainfall } from "./adapters/thaiwater.js";
import { fetchEwsStations } from "./adapters/dwrEws.js";
import { fetchRidReservoirs } from "./adapters/rid.js";
import { fetchFlights } from "./adapters/flights.js";
import { fetchDatagoPoints, fetchDatagoDatasets, fetchReservoirs, fetchDisasterStats, fetchFahfon, fetchProvincialKPIs } from "./adapters/datago.js";
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
import { SOURCE_CATALOG } from "@nst/shared";
import type { NormalizedFeed, AirQualityPoint, IncidentFeature, IntelligenceItem, ExecutiveSnapshot, MarketSnapshot } from "@nst/shared";
import { recordAdapterSuccess, recordAdapterError, getAllHealth, getSystemStatus } from "./lib/health.js";
import { getMqttStatus } from "./adapters/mqttBridge.js";
import { twinDbStatus } from "./lib/twinDb.js";
import twinApp from "./routes/twin.js";

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
      "/api/air-quality",
      "/api/air-quality/trend",
      "/api/air-quality/air4thai",
      "/api/cctv/longdo",
      "/api/trends",
      "/api/markets",
      "/api/executive",
      "/api/flood/gauges",
      "/api/flood/dam",
      "/api/datago/points",
      "/api/datago/datasets",
      "/api/datago/reservoirs",
      "/api/datago/disasters",
      "/api/datago/fahfon",
      "/api/datago/provincial-kpis",
      "/api/social/facebook",
      "/api/chat",
      "/api/health/detailed",
      "/api/health/keys",
      "/api/twin/objects",
      "/api/twin/relations",
      "/api/twin/state",
      "/api/twin/snapshot",
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
app.get("/api/flights", async (c) => safeFeed(c, () => fetchFlights({ AIRLABS_API_KEY: c.env.AIRLABS_API_KEY }), "flights-nst"));

// ── Yala Data Atlas — static outcome-data layer from the Municipal Data Bible ──
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
app.get("/api/insights", (c) => c.json(computeInsights()));
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
