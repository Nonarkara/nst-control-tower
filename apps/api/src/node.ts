// Node runtime entry — runs the same Hono app on plain Node so we can reach
// Thai government endpoints that workerd local TLS rejects. Production: this
// Mac runs 24/7 behind a Cloudflare Tunnel at chonburi-api.nonarkara.org.
//
// Reliability layers:
//   1. Persistent disk cache (var/cache.json) — restarts boot warm.
//   2. Prewarm loop every 5 min — adapters stay fresh regardless of activity.
//   3. Caffeinate wrapper in the launchd plist keeps the Mac awake.

import { serve } from "@hono/node-server";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import app from "./index.js";
import { hydrateCacheFromDisk, enableCachePersistence, stopCachePersistence } from "./lib/persistence.js";
import { hydrateNewsArchive } from "./lib/newsArchive.js";
import { hydrateBuildingsFromGeoJSON, flushMemoryToDb } from "./lib/twinStore.js";
import { startMqttBridge } from "./adapters/mqttBridge.js";
import { initTwinDb } from "./lib/twinDb.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parsePort(raw: string | undefined): number {
  if (!raw) return 8794;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 1 || n > 65535) {
    console.error(`[nst-api] Invalid PORT "${raw}", falling back to 8794`);
    return 8794;
  }
  return n;
}

(function loadDotenv() {
  try {
    const raw = readFileSync(resolve(__dirname, "../.env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      v = v.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\'/g, "'");
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    // No .env file — fine.
  }
})();

const PORT = parsePort(process.env.PORT);
const HOST = process.env.HOST ?? "127.0.0.1";

const env = {
  ENVIRONMENT: process.env.ENVIRONMENT ?? "node-local",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  FMP_API_KEY: process.env.FMP_API_KEY,
  FRED_API_KEY: process.env.FRED_API_KEY,
  VIABUS_TOKEN: process.env.VIABUS_TOKEN,
  VIABUS_BASE_URL: process.env.VIABUS_BASE_URL,
  AQICN_TOKEN: process.env.AQICN_TOKEN,
  ACLED_API_KEY: process.env.ACLED_API_KEY,
  ACLED_EMAIL: process.env.ACLED_EMAIL,
  DATA_GO_TH_TOKEN: process.env.DATA_GO_TH_TOKEN,
  AIRLABS_API_KEY: process.env.AIRLABS_API_KEY,
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
};

// Initialise twin database (PostgreSQL/PostGIS) if available
await initTwinDb()
  .then((ok) => console.log(`[nst-api] twin DB: ${ok ? "connected" : "not configured (in-memory only)"}`))
  .catch((err) => console.error("[nst-api] twin DB init failed:", err));

// Hydrate twin store from building GeoJSON
(function hydrateTwin() {
  try {
    const raw = readFileSync(resolve(__dirname, "../../web/public/geo/nst/buildings.geojson"), "utf8");
    const count = hydrateBuildingsFromGeoJSON(JSON.parse(raw));
    console.log(`[nst-api] twin store: ${count} buildings hydrated`);
  } catch (err) {
    console.error("[nst-api] twin hydration failed:", (err as Error).message);
  }
})();

// Flush in-memory buildings to PostgreSQL
await flushMemoryToDb()
  .then((n) => { if (n > 0) console.log(`[nst-api] twin store: ${n} buildings persisted to DB`); })
  .catch((err) => console.error("[nst-api] twin DB flush failed:", err));

// Start MQTT bridge if broker URL is configured
if (process.env.MQTT_BROKER_URL) {
  startMqttBridge({
    brokerUrl: process.env.MQTT_BROKER_URL,
    clientId: `chonburi-api-${Date.now()}`,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    topics: process.env.MQTT_TOPICS?.split(",") ?? ["fahfon/+/data", "sensors/+/data"],
  });
  console.log(`[nst-api] MQTT bridge starting: ${process.env.MQTT_BROKER_URL}`);
} else {
  console.log("[nst-api] MQTT_BROKER_URL not set — skipping MQTT bridge");
}

await hydrateNewsArchive()
  .then((n) => console.log(`[nst-api] news archive: ${n} records loaded from disk`))
  .catch((err) => console.error("[nst-api] news archive hydrate failed:", err));

await hydrateCacheFromDisk()
  .then((n) => console.log(`[nst-api] rehydrated ${n} cache entries from disk`))
  .catch((err) => console.error("[nst-api] hydrate failed:", err));

const server = serve(
  {
    fetch: (req) => app.fetch(req, env),
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`[nst-api] node listening on http://${info.address}:${info.port}`);
  },
);

enableCachePersistence(30_000);

const PREWARM_PATHS = [
  "/api/health",
  "/api/news",
  "/api/incidents/city-reports",
  "/api/incidents/itic",
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
  "/api/datago/provincial-kpis",
  // Newer feeds — keep their in-memory cache warm so a browser opening cold
  // gets last-good data immediately. cached() still honors each adapter's TTL,
  // so a 6h-TTL feed only refetches upstream every 6h despite the 5-min poll.
  "/api/gistda/poi",
  "/api/gistda/solar",
  "/api/gistda/landuse",
  "/api/nasa/earth-readings",
  "/api/social/facebook",
];

async function prewarmOnce() {
  const t0 = Date.now();
  const addr = HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
  await Promise.all(
    PREWARM_PATHS.map((p) =>
      fetch(`http://${addr}:${PORT}${p}`).catch(() => undefined),
    ),
  );
  console.log(`[nst-api] prewarm cycle done in ${Date.now() - t0}ms`);
}

setTimeout(() => { void prewarmOnce(); }, 3_000);
setInterval(() => { void prewarmOnce(); }, 5 * 60 * 1000);

// ── Archive snapshotter — records the city's live signals over time so the
// Knowledge Platform's time-machine + insights can learn from history. ───────
async function snapshotOnce() {
  try {
    const { captureSnapshot } = await import("./platform/archive.js");
    const addr = HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
    const base = `http://${addr}:${PORT}`;
    const get = async (p: string) => fetch(`${base}${p}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    const providers: Array<() => Promise<Array<{ ts: string; metric: string; value: number; unit?: string }>>> = [
      async () => {
        const aq: any = await get("/api/air-quality");
        const pm = aq?.features?.[0]?.pm25 ?? aq?.features?.[0]?.value;
        return typeof pm === "number" ? [{ ts: "", metric: "aqi.pm25", value: pm, unit: "µg/m³" }] : [];
      },
      async () => {
        const w: any = await get("/api/weather");
        const t = w?.features?.[0]?.tempC ?? w?.tempC;
        return typeof t === "number" ? [{ ts: "", metric: "weather.temp", value: t, unit: "°C" }] : [];
      },
      async () => {
        const d: any = await get("/api/flood/dam");
        const o = d?.features?.[0]?.outflowCms;
        return typeof o === "number" ? [{ ts: "", metric: "flood.dam.outflow", value: o, unit: "m³/s" }] : [];
      },
      async () => {
        const n: any = await get("/api/news");
        const items: any[] = n?.features ?? [];
        const sec = items.filter((i) => Array.isArray(i.tags) && i.tags.includes("SEC")).length;
        return [
          { ts: "", metric: "news.total", value: items.length },
          { ts: "", metric: "news.sec", value: sec },
        ];
      },
    ];
    const n = await captureSnapshot(providers, new Date().toISOString());
    if (n > 0) console.log(`[nst-api] archived ${n} signal snapshots`);
  } catch {
    // best-effort
  }
}

setTimeout(() => { void snapshotOnce(); }, 20_000);
setInterval(() => { void snapshotOnce(); }, 30 * 60 * 1000);

function shutdown(signal: string) {
  console.log(`[nst-api] ${signal} received, shutting down…`);
  stopCachePersistence();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("[nst-api] uncaughtException", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("[nst-api] unhandledRejection", err);
  process.exit(1);
});
