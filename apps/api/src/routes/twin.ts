import { Hono } from "hono";
import type { Context } from "hono";
import {
  upsertTwinObject,
  getTwinObject,
  findTwinObjects,
  deleteTwinObject,
  addTwinRelation,
  getTwinRelations,
  getRelatedObjects,
  writeTwinState,
  getTwinState,
  getTwinStateLatest,
  twinSnapshot,
  TWIN_KINDS,
  type TwinObject,
  type TwinKind,
  type TwinRelationPredicate,
} from "../lib/twinStore.js";

const twinApp = new Hono<{ Bindings: { TWIN_WRITE_TOKEN?: string } }>();

function configuredWriteToken(c: Context<{ Bindings: { TWIN_WRITE_TOKEN?: string } }>): string | undefined {
  const fromBinding = c.env?.TWIN_WRITE_TOKEN?.trim();
  if (fromBinding) return fromBinding;
  if (typeof process !== "undefined" && process.env.TWIN_WRITE_TOKEN?.trim()) {
    return process.env.TWIN_WRITE_TOKEN.trim();
  }
  return undefined;
}

/** Constant-time compare. A length mismatch still returns false without a token oracle beyond equality. */
function tokenMatches(presented: string, expected: string): boolean {
  const a = new TextEncoder().encode(presented);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/**
 * Twin mutations change the series the dashboard presents as the city forecast.
 * Reads stay public. Writes fail closed unless TWIN_WRITE_TOKEN is set and the
 * caller sends `Authorization: Bearer <token>`.
 */
function rejectUnauthenticatedWrite(c: Context<{ Bindings: { TWIN_WRITE_TOKEN?: string } }>): Response | null {
  const expected = configuredWriteToken(c);
  const header = c.req.header("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!expected || !presented || !tokenMatches(presented, expected)) {
    return c.json({ error: "Twin writes require Authorization: Bearer TWIN_WRITE_TOKEN" }, 401);
  }
  return null;
}

// ---- Objects ----

twinApp.get("/objects", async (c) => {
  const q = c.req.query();
  const kind = q.kind as TwinKind | undefined;
  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 100, 1000) : 100;
  let bbox: [number, number, number, number] | undefined;
  if (q.bbox) {
    const parts = q.bbox.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      bbox = parts as [number, number, number, number];
    }
  }
  const items = await findTwinObjects({ kind, bbox, limit });
  return c.json({ items, count: items.length });
});

twinApp.get("/objects/:id", async (c) => {
  const obj = await getTwinObject(c.req.param("id"));
  if (!obj) return c.json({ error: "Not found" }, 404);
  return c.json(obj);
});

twinApp.post("/objects", async (c) => {
  const denied = rejectUnauthenticatedWrite(c);
  if (denied) return denied;
  const body = (await c.req.json().catch(() => ({}))) as Partial<TwinObject>;
  if (!body.id || !body.kind || !body.name) {
    return c.json({ error: "Required: id, kind, name" }, 400);
  }
  if (!(TWIN_KINDS as readonly string[]).includes(body.kind)) {
    return c.json({ error: `Invalid kind: must be one of ${TWIN_KINDS.join(", ")}` }, 400);
  }
  const { lat, lng } = body;
  if (typeof lat !== "number" || !Number.isFinite(lat) || typeof lng !== "number" || !Number.isFinite(lng)) {
    return c.json({ error: "Required: lat, lng (must be finite numbers)" }, 400);
  }
  const obj = await upsertTwinObject({
    id: body.id,
    kind: body.kind as TwinKind,
    name: body.name,
    nameTh: body.nameTh,
    nameEn: body.nameEn,
    lat,
    lng,
    geom: body.geom,
    properties: body.properties ?? {},
    createdAt: body.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return c.json(obj, 201);
});

twinApp.delete("/objects/:id", async (c) => {
  const denied = rejectUnauthenticatedWrite(c);
  if (denied) return denied;
  const ok = await deleteTwinObject(c.req.param("id"));
  if (!ok) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// ---- Relations ----

twinApp.get("/relations", async (c) => {
  const q = c.req.query();
  const items = await getTwinRelations({
    subjectId: q.subjectId,
    objectId: q.objectId,
    predicate: q.predicate as TwinRelationPredicate | undefined,
  });
  return c.json({ items, count: items.length });
});

twinApp.post("/relations", async (c) => {
  const denied = rejectUnauthenticatedWrite(c);
  if (denied) return denied;
  const body = (await c.req.json().catch(() => ({}))) as {
    subjectId: string;
    predicate: TwinRelationPredicate;
    objectId: string;
    properties?: Record<string, unknown>;
  };
  if (!body.subjectId || !body.predicate || !body.objectId) {
    return c.json({ error: "Required: subjectId, predicate, objectId" }, 400);
  }
  const rel = await addTwinRelation({
    id: `${body.subjectId}-${body.predicate}-${body.objectId}-${Date.now()}`,
    subjectId: body.subjectId,
    predicate: body.predicate,
    objectId: body.objectId,
    properties: body.properties ?? {},
    createdAt: new Date().toISOString(),
  });
  return c.json(rel, 201);
});

twinApp.get("/objects/:id/related", async (c) => {
  const items = await getRelatedObjects(c.req.param("id"));
  return c.json({ items, count: items.length });
});

// ---- State (time series) ----

twinApp.get("/state", async (c) => {
  const q = c.req.query();
  const objectId = q.objectId;
  if (!objectId) return c.json({ error: "Required query: objectId" }, 400);
  const limit = q.limit ? Math.min(Math.max(parseInt(q.limit, 10) || 100, 1), 1000) : 100;
  const items = await getTwinState({
    objectId,
    metric: q.metric,
    since: q.since,
    until: q.until,
    limit,
  });
  return c.json({ items, count: items.length });
});

twinApp.get("/state/latest", async (c) => {
  const q = c.req.query();
  const objectId = q.objectId;
  if (!objectId) return c.json({ error: "Required query: objectId" }, 400);
  const point = await getTwinStateLatest({ objectId, metric: q.metric });
  if (!point) return c.json({ error: "No state found" }, 404);
  return c.json(point);
});

twinApp.post("/state", async (c) => {
  const denied = rejectUnauthenticatedWrite(c);
  if (denied) return denied;
  const body = (await c.req.json().catch(() => ({}))) as {
    objectId: string;
    metric: string;
    value: number;
    source: string;
    properties?: Record<string, unknown>;
  };
  if (!body.objectId || !body.metric || typeof body.value !== "number" || !body.source) {
    return c.json({ error: "Required: objectId, metric, value, source" }, 400);
  }
  const point = await writeTwinState({
    time: new Date().toISOString(),
    objectId: body.objectId,
    metric: body.metric,
    value: body.value,
    source: body.source,
    properties: body.properties ?? {},
  });
  return c.json(point, 201);
});

// ---- Predictions (TimesFM zero-shot forecasts persisted by the Python service) ----

const FORECAST_METRICS = [
  { key: "precipitation.forecast", label: "Rain",      unit: "mm",  alertThreshold: 50  },
  { key: "tideHeight.forecast",    label: "Tide",      unit: "m",   alertThreshold: 2.5 },
  { key: "incidentRate.forecast",  label: "Incidents", unit: "/h",  alertThreshold: 5   },
  { key: "aqi.forecast",           label: "AQI",       unit: "",    alertThreshold: 100 },
  { key: "vesselCount.forecast",   label: "Vessels",   unit: "",    alertThreshold: 50  },
] as const;

twinApp.get("/predictions", async (c) => {
  const now = Date.now();
  const generatedSince = now - 2 * 60 * 60 * 1000;
  const requested = Number(c.req.query("horizon") ?? 24);
  const horizon = Number.isInteger(requested) ? Math.max(1, Math.min(requested, 48)) : 24;

  const forecasts = await Promise.all(
    FORECAST_METRICS.map(async (fm) => {
      const items = await getTwinState({
        objectId: "city",
        metric: fm.key,
        since: new Date(now).toISOString(),
        until: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
        limit: 5000,
      });
      // `time` is the prediction target, not when the model ran. Future targets
      // from a dead producer must expire, and overlapping runs must not mix.
      const current = items.filter((pt) => {
        const generated = Date.parse(String(pt.properties?.generated_at ?? ""));
        const target = new Date(pt.time).getTime();
        return Number.isFinite(pt.value) && Number.isFinite(generated)
          && generated >= generatedSince && generated <= now + 5 * 60_000
          && target >= now && target <= now + 48 * 60 * 60 * 1000;
      });
      const latest = Math.max(...current.map((pt) => Date.parse(String(pt.properties?.generated_at))));
      const points = current.filter((pt) => Date.parse(String(pt.properties?.generated_at)) === latest)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .filter((pt, i, all) => i === 0 || new Date(pt.time).getTime() !== new Date(all[i - 1].time).getTime())
        .slice(0, horizon);
      return {
        metric: fm.key,
        label:  fm.label,
        unit:   fm.unit,
        alertThreshold: fm.alertThreshold,
        generatedAt: points.length ? new Date(latest).toISOString() : null,
        horizon: points.map((pt) => {
          const p = pt.properties as Record<string, number> | null;
          return { time: pt.time, p50: pt.value, p10: p?.p10 ?? null, p90: p?.p90 ?? null };
        }),
      };
    })
  );

  return c.json({ forecasts, count: forecasts.length });
});

// ---- Diagnostics ----

twinApp.get("/snapshot", async (c) => c.json(await twinSnapshot()));

export default twinApp;
