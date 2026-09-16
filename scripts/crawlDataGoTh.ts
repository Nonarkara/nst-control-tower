/**
 * scripts/crawlDataGoTh.ts — enumerate the 216 NST datasets on data.go.th
 * (CKAN 2.10.1), fetch per-dataset metadata, and download small resources.
 *
 * Output:
 *   apps/api/datasets/manifest.json         — every dataset + every resource
 *   apps/api/datasets/meta/{id}.json        — raw CKAN package_show JSON, one per dataset
 *   apps/api/datasets/files/{id}/{n}.{ext}  — downloaded resource (≤ MAX_BYTES, see .env)
 *
 * Limit (HTTP-bytes) — per the user's chosen scope ("metadata + small files ≤10 MB").
 * Big resources are listed in the manifest with the original data.go.th URL, so the
 * catalog page can show a "open at source" link instead of shipping a copy.
 */

import { mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync, createWriteStream } from "node:fs";
import { join, extname, resolve } from "node:path";

const Q = "นครศรีธรรมราช";
const CKAN = "https://data.go.th/api/3/action";
const ROOT = resolve(process.cwd(), "apps/api/datasets");
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per resource
const PAGE = 100;

interface Resource {
  id: string;
  url: string;
  name: string;
  description: string;
  format: string;
  size: number | null;
  created: string;
  lastModified: string | null;
  localPath: string | null;       // null if not downloaded (>10 MB or fetch failed)
  downloadStatus: "ok" | "oversize" | "fetch-failed" | "skipped";
  downloadSize: number | null;
}

interface Dataset {
  id: string;                    // CKAN name (slug)
  title: string;
  titleTh: string;
  orgName: string;
  notes: string;
  notesTh: string;
  numResources: number;
  resources: Resource[];
  license: string;
  created: string;
  updated: string;
  tags: string[];
  groups: string[];
}

interface Manifest {
  query: string;
  fetchedAt: string;
  count: number;
  totalBytes: number;
  downloadedFiles: number;
  oversizeFiles: number;
  datasets: Dataset[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string): Promise<unknown> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "nst-control-tower/1.0", Accept: "application/json" },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
      const data = (await r.json()) as { success?: boolean; result?: unknown };
      if (!data.success) throw new Error("CKAN success=false for " + url);
      return data.result;
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(800 * attempt);
    }
  }
  throw new Error("unreachable");
}

async function listAll(): Promise<unknown[]> {
  const all: unknown[] = [];
  let start = 0;
  while (true) {
    const url = `${CKAN}/package_search?q=${encodeURIComponent(Q)}&rows=${PAGE}&start=${start}`;
    const res = (await fetchJson(url)) as {
      results: unknown[];
      count: number;
    };
    all.push(...res.results);
    start += res.results.length;
    if (start >= res.count || res.results.length === 0) break;
    if (start > 1500) break; // safety
  }
  return all;
}

async function showOne(name: string): Promise<unknown> {
  return fetchJson(`${CKAN}/package_show?id=${encodeURIComponent(name)}`);
}

interface CkanResource {
  id: string;
  url: string;
  name: string;
  description?: string;
  format?: string;
  size?: number | null;
  created: string;
  last_modified?: string | null;
  [k: string]: unknown;
}

interface CkanPackage {
  id: string;
  name: string;
  title: string;
  notes?: string;
  metadata_created: string;
  metadata_modified: string;
  license_title?: string;
  organization?: { title?: string; name?: string };
  resources: CkanResource[];
  tags?: { name: string }[];
  groups?: { title?: string; name?: string }[];
  [k: string]: unknown;
}

function resourceId(pkgId: string, resId: string, idx: number): string {
  return `${pkgId}--${idx}-${resId.slice(0, 8)}`;
}

function safeExt(url: string, format?: string): string {
  if (format) {
    const f = format.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (f.length > 0 && f.length <= 5) return "." + f;
  }
  const m = url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i);
  return m ? "." + m[1].toLowerCase() : "";
}

async function downloadResource(pkgId: string, res: CkanResource, idx: number): Promise<{
  localPath: string | null;
  status: Resource["downloadStatus"];
  size: number | null;
}> {
  // Skip non-data resources (API endpoints, WMS, etc.)
  if (!res.url || res.url.startsWith("http://") === false && res.url.startsWith("https://") === false) {
    return { localPath: null, status: "skipped", size: null };
  }
  const declared = typeof res.size === "number" ? res.size : null;
  if (declared !== null && declared > MAX_BYTES) {
    return { localPath: null, status: "oversize", size: declared };
  }
  const ext = safeExt(res.url, res.format);
  const fileName = `r${String(idx).padStart(2, "0")}${ext}`;
  const dir = join(ROOT, "files", pkgId);
  const fullPath = join(dir, fileName);
  try {
    await mkdir(dir, { recursive: true });
    let got = 0;
    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const r = await fetch(res.url, {
        headers: { "User-Agent": "nst-control-tower/1.0" },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!r.ok) return { localPath: null, status: "fetch-failed", size: null };
      const len = r.headers.get("content-length");
      if (len && Number(len) > MAX_BYTES) {
        return { localPath: null, status: "oversize", size: Number(len) };
      }
      const body = r.body;
      if (!body) return { localPath: null, status: "fetch-failed", size: null };
      const out = createWriteStream(fullPath);
      const reader = body.getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        got += value.byteLength;
        if (got > MAX_BYTES) {
          aborted = true;
          await reader.cancel();
          break;
        }
        if (!out.write(value)) {
          await new Promise<void>((r2) => out.once("drain", () => r2()));
        }
      }
      await new Promise<void>((r2, rj) => out.end((err: unknown) => (err ? rj(err) : r2())));
    } finally {
      clearTimeout(timer);
    }
    if (aborted || !existsSync(fullPath)) {
      return { localPath: null, status: "oversize", size: got };
    }
    const s = await stat(fullPath);
    return { localPath: `files/${pkgId}/${fileName}`, status: "ok", size: s.size };
  } catch {
    return { localPath: null, status: "fetch-failed", size: null };
  }
}

async function main(): Promise<void> {
  await mkdir(join(ROOT, "files"), { recursive: true });
  await mkdir(join(ROOT, "meta"), { recursive: true });

  const allResults = await listAll();
  console.log(`Listing returned ${allResults.length} datasets.`);

  const datasets: Dataset[] = [];
  let totalBytes = 0;
  let downloadedFiles = 0;
  let oversizeFiles = 0;

  for (let i = 0; i < allResults.length; i++) {
    const row = allResults[i] as { name: string };
    let pkg: CkanPackage;
    try {
      pkg = (await showOne(row.name)) as CkanPackage;
    } catch (err) {
      console.warn(`[${i + 1}/${allResults.length}] skip ${row.name}: ${(err as Error).message}`);
      continue;
    }
    await writeFile(join(ROOT, "meta", `${pkg.name}.json`), JSON.stringify(pkg, null, 2));

    const resources: Resource[] = [];
    for (let r = 0; r < pkg.resources.length; r++) {
      const res = pkg.resources[r];
      if (!res) continue;
      const outcome = await downloadResource(pkg.name, res, r);
      resources.push({
        id: resourceId(pkg.name, res.id, r),
        url: res.url,
        name: res.name ?? "(untitled)",
        description: res.description ?? "",
        format: (res.format ?? "").toUpperCase(),
        size: res.size ?? null,
        created: res.created,
        lastModified: res.last_modified ?? null,
        localPath: outcome.localPath,
        downloadStatus: outcome.status,
        downloadSize: outcome.size,
      });
      if (outcome.status === "ok") {
        if (outcome.size) totalBytes += outcome.size;
        downloadedFiles++;
      } else if (outcome.status === "oversize") {
        oversizeFiles++;
      }
    }

    datasets.push({
      id: pkg.name,
      title: pkg.title ?? pkg.name,
      titleTh: pkg.title ?? pkg.name,
      orgName: pkg.organization?.title ?? "",
      notes: pkg.notes ?? "",
      notesTh: pkg.notes ?? "",
      numResources: pkg.resources.length,
      resources,
      license: pkg.license_title ?? "",
      created: pkg.metadata_created,
      updated: pkg.metadata_modified,
      tags: (pkg.tags ?? []).map((t) => t.name),
      groups: (pkg.groups ?? []).map((g) => g.title ?? g.name ?? ""),
    });

    if ((i + 1) % 10 === 0) {
      console.log(`[${i + 1}/${allResults.length}] processed; ${downloadedFiles} ok / ${oversizeFiles} oversize so far`);
    }
  }

  const manifest: Manifest = {
    query: Q,
    fetchedAt: new Date().toISOString(),
    count: datasets.length,
    totalBytes,
    downloadedFiles,
    oversizeFiles,
    datasets,
  };

  await writeFile(join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${datasets.length} datasets · ${downloadedFiles} files · ${oversizeFiles} oversize · ${(totalBytes / 1024 / 1024).toFixed(1)} MB total`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
