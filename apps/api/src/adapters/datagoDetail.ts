/**
 * datagoDetail — friendly preview backend for data.go.th datasets.
 *
 * Two endpoints:
 *   1. /api/datago/dataset-detail?id={ckan-name-or-id} → calls data.go.th's
 *      CKAN `package_show` action, returns a slimmed summary (title,
 *      publisher, license, geo coverage, release date, + the full
 *      resources array with per-file URLs + format + size when present).
 *   2. /api/datago/preview?url={file-url}&format={csv|json} → server-side
 *      proxy that fetches a small CSV/JSON resource, parses the first
 *      ~50 rows, and returns the headers + rows + row count. URL
 *      allowlist is enforced so this proxy can't be turned into a
 *      generic SSRF.
 *
 * Why: the LOCAL_CATALOG entry (`localDatasets.ts`) only carries a single
 * dataset-level url + format pills + file count — clicking a row currently
 * jumps the user to data.go.th's catalog page where most files dump raw
 * CSV/JSON text in the browser. The detail view + preview proxy gives
 * the dashboard an in-app preview without forcing the user away from
 * the panel. Cached 6 h so we don't hammer data.go.th on every modal open.
 */

import type { Context } from "hono";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";

// ───────────────────────────────────────────────────────────────────────────
// Public types — these are what the modal renders.
// ───────────────────────────────────────────────────────────────────────────

interface DatagoResource {
  id: string;
  name: string;
  description: string;
  format: string;            // "CSV", "JSON", "XLSX", "PDF", …
  mimetype: string | null;
  url: string;               // download URL
  size: number | null;       // bytes (when CKAN reports it)
  created: string | null;
  lastModified: string | null;
}

export interface DatagoMetaSummary {
  id: string;
  title: string;
  notes: string;
  organization: string;
  dataSource: string;
  maintainer: string | null;
  licenseTitle: string | null;
  geoCoverage: string | null;
  releaseDate: string | null;
  updateFrequency: string | null;
  dataLanguage: string[];
  dataFormat: string[];
  catalogUrl: string;        // the CKAN catalog page on data.go.th
  resources: DatagoResource[];
  resourceCount: number;
}

interface DatagoPreviewRow {
  headers: string[];
  rows: string[][];
  totalRows: number;
  truncated: boolean;
}

export interface DatagoPreviewResult {
  url: string;
  format: string;
  status: "ok" | "fetch_failed" | "too_large" | "unsupported_format" | "parse_failed" | "blocked_host";
  byteSize: number | null;
  contentType: string | null;
  preview?: DatagoPreviewRow;
  error?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Detail endpoint — slim the package_show response to what the modal needs.
// ───────────────────────────────────────────────────────────────────────────

const CKAN_BASE = "https://data.go.th/api/3/action/package_show";

function pickString(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

function pickNullable(o: Record<string, unknown>, ...keys: string[]): string | null {
  const v = pickString(o, ...keys);
  return v.length > 0 ? v : null;
}

export async function fetchDatasetDetail(idOrName: string): Promise<DatagoMetaSummary | null> {
  return cached(`datago-detail:${idOrName}`, 6 * 60 * 60, async () => {
    const safe = idOrName.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    if (!safe) return null;
    let resp: Response;
    try {
      resp = await fetch(`${CKAN_BASE}?id=${encodeURIComponent(safe)}`, {
        headers: { Accept: "application/json", "User-Agent": "nst-control-tower/1.0" },
      });
    } catch {
      return null;
    }
    if (!resp.ok) return null;
    const body = (await resp.json().catch(() => null)) as { success?: boolean; result?: Record<string, unknown> } | null;
    if (!body || body.success !== true || !body.result) return null;
    const r = body.result;
    const res = Array.isArray(r.resources) ? (r.resources as Record<string, unknown>[]) : [];
    const resources: DatagoResource[] = res.map((rr) => ({
      id: pickString(rr, "id"),
      name: pickString(rr, "name", "description") || "(unnamed)",
      description: pickString(rr, "description"),
      format: pickString(rr, "format").toUpperCase() || "?",
      mimetype: pickNullable(rr, "mimetype"),
      url: pickString(rr, "url"),
      size: typeof rr.size === "number" && Number.isFinite(rr.size) ? rr.size : null,
      created: pickNullable(rr, "created"),
      lastModified: pickNullable(rr, "last_modified"),
    }));

    const dataFormat = Array.isArray(r.data_format) ? (r.data_format as unknown[]).filter((x): x is string => typeof x === "string") : [];
    const dataLanguage = Array.isArray(r.data_language) ? (r.data_language as unknown[]).filter((x): x is string => typeof x === "string") : [];
    const updateFreq = pickString(r, "update_frequency_interval") +
      (pickString(r, "update_frequency_unit") ? " " + pickString(r, "update_frequency_unit") : "");
    const catalogUrl = pickString(r, "url") || `https://data.go.th/dataset/${safe}`;

    return {
      id: pickString(r, "id", "name") || safe,
      title: pickString(r, "title", "name") || safe,
      notes: pickString(r, "notes"),
      organization: pickString(r, "organization", "data_source") || "—",
      dataSource: pickString(r, "data_source") || "—",
      maintainer: pickNullable(r, "maintainer"),
      licenseTitle: pickNullable(r, "license_title"),
      geoCoverage: pickNullable(r, "geo_coverage"),
      releaseDate: pickNullable(r, "data_release_date", "metadata_created"),
      updateFrequency: updateFreq.length > 0 ? updateFreq : null,
      dataLanguage,
      dataFormat,
      catalogUrl,
      resources,
      resourceCount: resources.length,
    } satisfies DatagoMetaSummary;
  }).then((r) => r ?? null);
}

// ───────────────────────────────────────────────────────────────────────────
// Preview proxy — server-side fetch with allowlist + size cap + parser.
// ───────────────────────────────────────────────────────────────────────────

// Allow data.go.th + the catalog download mirrors it points at (e.g.
// catalog.dopa.go.th for DOPA datasets). Anything else is blocked.
const ALLOWED_HOSTS = new Set([
  "data.go.th",
  "filedata.data.go.th",
  "api.data.go.th",
  "ds.data.go.th",
  "dsd.data.go.th",
  "dsd2.data.go.th",
  "dsic.data.go.th",
  "opendata.data.go.th",
  "files.data.go.th",
  "catalog.data.go.th",
]);
const ALLOWED_HOST_SUFFIXES = [".go.th"] as const;

const MAX_BYTES = 256 * 1024;           // 256 KB cap on the fetch
const TIMEOUT_MS = 6_000;
const MAX_ROWS = 50;
const MAX_CELL_CHARS = 200;

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(h)) return true;
  for (const suffix of ALLOWED_HOST_SUFFIXES) {
    if (h.endsWith(suffix)) return true;
  }
  return false;
}

function coerceCell(v: string): string {
  if (v.length > MAX_CELL_CHARS) return v.slice(0, MAX_CELL_CHARS) + "…";
  return v;
}

function parseCsv(text: string): DatagoPreviewRow {
  // Minimal RFC-4180-ish CSV parser. Quotes wrap fields; doubled `""` is
  // an escaped quote; rows split on `\n` outside quotes. Sufficient for
  // the previews we need (no `papaparse` dep available here).
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { cur.push(coerceCell(cell)); cell = ""; }
      else if (ch === "\n") {
        cur.push(coerceCell(cell)); cell = "";
        if (cur.some((c) => c.length > 0)) rows.push(cur);
        cur = [];
      } else if (ch === "\r") {
        // skip — handled by the \n branch
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || cur.length > 0) {
    cur.push(coerceCell(cell));
    if (cur.some((c) => c.length > 0)) rows.push(cur);
  }
  const headers = rows.length > 0 ? rows[0] : [];
  const dataRows = rows.slice(1, MAX_ROWS + 1);
  return {
    headers,
    rows: dataRows,
    totalRows: Math.max(0, rows.length - 1),
    truncated: rows.length - 1 > MAX_ROWS,
  };
}

function parseJson(text: string): DatagoPreviewRow {
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch (e) { throw new Error(`json parse failed: ${(e as Error).message}`); }
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null) {
    const headers = Array.from(
      new Set(parsed.flatMap((row) => Object.keys(row as Record<string, unknown>))),
    );
    const rows: string[][] = [];
    for (const item of parsed.slice(0, MAX_ROWS)) {
      const obj = item as Record<string, unknown>;
      rows.push(headers.map((h) => coerceCell(String(obj[h] ?? ""))));
    }
    return { headers, rows, totalRows: parsed.length, truncated: parsed.length > MAX_ROWS };
  }
  if (Array.isArray(parsed) && parsed.every((v) => typeof v !== "object")) {
    return {
      headers: ["value"],
      rows: (parsed as unknown[]).slice(0, MAX_ROWS).map((v) => [coerceCell(String(v))]),
      totalRows: parsed.length,
      truncated: parsed.length > MAX_ROWS,
    };
  }
  if (parsed && typeof parsed === "object") {
    const entries = Object.entries(parsed as Record<string, unknown>).slice(0, MAX_ROWS);
    return {
      headers: ["key", "value"],
      rows: entries.map(([k, v]) => [k, coerceCell(JSON.stringify(v))]),
      totalRows: entries.length,
      truncated: false,
    };
  }
  return { headers: ["value"], rows: [[coerceCell(String(parsed))]], totalRows: 1, truncated: false };
}

function sniffFormat(ct: string, url: string, hint: string): string {
  if (hint) return hint.toUpperCase();
  const lower = (ct + " " + url).toLowerCase();
  if (lower.includes("csv") || lower.endsWith(".csv")) return "CSV";
  if (lower.includes("json") || lower.endsWith(".json")) return "JSON";
  return "?";
}

export async function fetchPreview(rawUrl: string, formatHint?: string): Promise<DatagoPreviewResult> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return { url: rawUrl, format: formatHint ?? "?", status: "fetch_failed", byteSize: null, contentType: null, error: "url not valid" };
  }
  if (u.protocol !== "https:") {
    return { url: rawUrl, format: formatHint ?? "?", status: "blocked_host", byteSize: null, contentType: null, error: "https only" };
  }
  if (!isAllowedHost(u.hostname)) {
    return { url: rawUrl, format: formatHint ?? "?", status: "blocked_host", byteSize: null, contentType: null, error: `host not allowed: ${u.hostname}` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "nst-control-tower-preview/1.0",
        "Accept": "text/csv, text/plain, application/json, */*",
      },
      redirect: "follow",
    });
  } catch (e) {
    clearTimeout(timer);
    return { url: rawUrl, format: formatHint ?? "?", status: "fetch_failed", byteSize: null, contentType: null, error: (e as Error).message };
  }
  clearTimeout(timer);

  if (!resp.ok) {
    return { url: rawUrl, format: formatHint ?? "?", status: "fetch_failed", byteSize: null, contentType: resp.headers.get("content-type"), error: `HTTP ${resp.status}` };
  }

  const ct = resp.headers.get("content-type") ?? "";
  const declaredSize = Number(resp.headers.get("content-length") ?? "0") || 0;
  if (declaredSize > 0 && declaredSize > MAX_BYTES * 4) {
    return { url: rawUrl, format: formatHint ?? "?", status: "too_large", byteSize: declaredSize, contentType: ct, error: `declared ${declaredSize} bytes` };
  }

  const reader = resp.body?.getReader();
  let received = 0;
  const parts: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > MAX_BYTES) {
          try { await reader.cancel(); } catch { /* ignore */ }
          return { url: rawUrl, format: formatHint ?? "?", status: "too_large", byteSize: received, contentType: ct, error: `exceeded ${MAX_BYTES}B` };
        }
        parts.push(value);
      }
    }
  }
  // Concatenate parts into a single Uint8Array, then decode.
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    merged.set(p, offset);
    offset += p.byteLength;
  }
  const buf = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true }).decode(merged);

  const format = sniffFormat(ct, rawUrl, formatHint ?? "");
  try {
    if (format === "CSV") {
      return { url: rawUrl, format, status: "ok", byteSize: received, contentType: ct, preview: parseCsv(buf) };
    }
    if (format === "JSON") {
      return { url: rawUrl, format, status: "ok", byteSize: received, contentType: ct, preview: parseJson(buf) };
    }
    return { url: rawUrl, format, status: "unsupported_format", byteSize: received, contentType: ct, error: `format ${format} not previewable` };
  } catch (e) {
    return { url: rawUrl, format, status: "parse_failed", byteSize: received, contentType: ct, error: (e as Error).message };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Hono handlers — wire the above into routes. These return tiny JSON shapes
// the modal can render directly.
// ───────────────────────────────────────────────────────────────────────────

export async function datasetDetailHandler(c: Context): Promise<Response> {
  const id = c.req.query("id") ?? "";
  if (!id) return c.json({ error: "missing id" }, 400);
  const detail = await fetchDatasetDetail(id);
  if (!detail) return c.json({ error: "not found" }, 404);
  c.header("Cache-Control", "public, max-age=600"); // browser-side 10 min
  return c.json({
    ...detail,
    _meta: { cacheAgeMinutes: cacheAgeMinutes(new Date().toISOString()) },
  });
}

export async function previewHandler(c: Context): Promise<Response> {
  const url = c.req.query("url") ?? "";
  const format = c.req.query("format") ?? undefined;
  if (!url) return c.json({ error: "missing url" }, 400);
  const result = await fetchPreview(url, format);
  // Preview results aren't cached — they're cheap and the URL set is small.
  return c.json(result);
}

// ───────────────────────────────────────────────────────────────────────────
// Test-only exports (vitest imports `parseCsv` / `parseJson` directly).
// ───────────────────────────────────────────────────────────────────────────
export const __test__ = { parseCsv, parseJson, isAllowedHost };
