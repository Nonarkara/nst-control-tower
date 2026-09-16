/**
 * scripts/buildDatasetManifest.ts — offline rebuild of the data.go.th crawl
 * manifest from already-downloaded cache. Zero network: reads
 * apps/api/datasets/meta/*.json (raw CKAN package_show) + scans
 * apps/api/datasets/files/ for downloaded resources.
 *
 * Output: apps/api/datasets/manifest.json — the same shape
 * scripts/crawlDataGoTh.ts promises but never got to write (the crawl was
 * interrupted after meta + files were fetched).
 *
 * With --emit-ts also writes apps/api/src/data/localDatasets.ts, the slim
 * checked-in index the /api/datago/local-catalog feed serves (Workers can't
 * read the filesystem, so only metadata ships — files/ stays local-only).
 *
 * Usage:
 *   npx tsx scripts/buildDatasetManifest.ts
 *   npx tsx scripts/buildDatasetManifest.ts --emit-ts
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "apps/api/datasets");
const MAX_BYTES = 10 * 1024 * 1024;

interface Resource {
  id: string;
  url: string;
  name: string;
  description: string;
  format: string;
  size: number | null;
  created: string;
  lastModified: string | null;
  localPath: string | null;
  downloadStatus: "ok" | "oversize" | "fetch-failed" | "skipped";
  downloadSize: number | null;
}

interface Dataset {
  id: string;
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

interface CkanResource {
  id: string;
  url?: string;
  name?: string;
  description?: string;
  format?: string;
  size?: number | string | null;
  created?: string;
  last_modified?: string | null;
}

interface CkanPackage {
  id: string;
  name: string;
  title?: string;
  notes?: string;
  metadata_created?: string;
  metadata_modified?: string;
  license_title?: string;
  organization?: { title?: string; name?: string };
  resources?: CkanResource[];
  tags?: { name?: string }[];
  groups?: { title?: string; name?: string }[];
}

function safeExt(url: string, format?: string): string {
  if (format) {
    const f = format.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (f.length > 0 && f.length <= 5) return "." + f;
  }
  const m = url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i);
  return m ? "." + m[1]!.toLowerCase() : "";
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

async function main(): Promise<void> {
  const emitTs = process.argv.includes("--emit-ts");
  const metaDir = join(ROOT, "meta");
  const filesDir = join(ROOT, "files");

  const metaFiles = (await readdir(metaDir)).filter((f) => f.endsWith(".json")).sort();

  const datasets: Dataset[] = [];
  let totalBytes = 0;
  let downloadedFiles = 0;
  let oversizeFiles = 0;

  for (const mf of metaFiles) {
    const pkg = JSON.parse(await readFile(join(metaDir, mf), "utf8")) as CkanPackage;
    const pkgId = pkg.name ?? mf.replace(/\.json$/, "");
    const resources: Resource[] = [];
    const resList = pkg.resources ?? [];

    for (let r = 0; r < resList.length; r++) {
      const res = resList[r]!;
      const url = res.url ?? "";
      const isHttp = url.startsWith("https://") || url.startsWith("http://");
      if (!isHttp) {
        resources.push({
          id: `${pkgId}--${r}-${(res.id ?? "x").slice(0, 8)}`,
          url, name: res.name ?? "(untitled)", description: res.description ?? "",
          format: (res.format ?? "").toUpperCase(), size: numOrNull(res.size),
          created: res.created ?? "", lastModified: res.last_modified ?? null,
          localPath: null, downloadStatus: "skipped", downloadSize: null,
        });
        continue;
      }
      // Reconstruct the downloader's filename to find the cached copy.
      const ext = safeExt(url, res.format);
      const fileName = `r${String(r).padStart(2, "0")}${ext}`;
      const rel = `files/${pkgId}/${fileName}`;
      let localPath: string | null = null;
      let status: Resource["downloadStatus"] = "fetch-failed";
      let dsize: number | null = null;
      try {
        const s = await stat(join(filesDir, pkgId, fileName));
        if (s.size > MAX_BYTES) {
          status = "oversize";
          dsize = s.size;
          oversizeFiles++;
        } else {
          localPath = rel;
          status = "ok";
          dsize = s.size;
          totalBytes += s.size;
          downloadedFiles++;
        }
      } catch {
        // No cached copy — but a same-dir file with another extension may
        // exist (format renamed mid-crawl). Scan the package dir once.
        try {
          const sibs = await readdir(join(filesDir, pkgId));
          const hit = sibs.find((s) => s === `r${String(r).padStart(2, "0")}` || s.startsWith(`r${String(r).padStart(2, "0")}.`));
          if (hit) {
            const s = await stat(join(filesDir, pkgId, hit));
            if (s.size > MAX_BYTES) { status = "oversize"; dsize = s.size; oversizeFiles++; }
            else { localPath = `files/${pkgId}/${hit}`; status = "ok"; dsize = s.size; totalBytes += s.size; downloadedFiles++; }
          }
        } catch { /* no package dir at all */ }
      }
      const declared = numOrNull(res.size);
      if (status === "fetch-failed" && declared !== null && declared > MAX_BYTES) {
        status = "oversize";
        dsize = declared;
        oversizeFiles++;
      }
      resources.push({
        id: `${pkgId}--${r}-${(res.id ?? "x").slice(0, 8)}`,
        url, name: res.name ?? "(untitled)", description: res.description ?? "",
        format: (res.format ?? "").toUpperCase(), size: declared,
        created: res.created ?? "", lastModified: res.last_modified ?? null,
        localPath, downloadStatus: status, downloadSize: dsize,
      });
    }

    datasets.push({
      id: pkgId,
      title: pkg.title ?? pkgId,
      titleTh: pkg.title ?? pkgId,
      orgName: pkg.organization?.title ?? "",
      notes: pkg.notes ?? "",
      notesTh: pkg.notes ?? "",
      numResources: resList.length,
      resources,
      license: pkg.license_title ?? "",
      created: pkg.metadata_created ?? "",
      updated: pkg.metadata_modified ?? "",
      tags: (pkg.tags ?? []).map((t) => t.name ?? "").filter(Boolean),
      groups: (pkg.groups ?? []).map((g) => g.title ?? g.name ?? "").filter(Boolean),
    });
  }

  const manifest: Manifest = {
    query: "นครศรีธรรมราช",
    fetchedAt: new Date().toISOString(),
    count: datasets.length,
    totalBytes,
    downloadedFiles,
    oversizeFiles,
    datasets,
  };

  await writeFile(join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`manifest: ${datasets.length} datasets · ${downloadedFiles} files ok · ${oversizeFiles} oversize · ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);

  if (emitTs) {
    const esc = (s: string) => JSON.stringify(s.length > 280 ? s.slice(0, 280) : s);
    const lines = [
      "/**",
      " * localDatasets — slim checked-in index of the data.go.th crawl",
      ` * (${datasets.length} นครศรีธรรมราช datasets, generated offline).`,
      " *",
      " * Regenerate: npx tsx scripts/buildDatasetManifest.ts --emit-ts",
      " * (reads apps/api/datasets/meta/*.json — the 600 MB files/ cache stays",
      " * local-only; only metadata ships to Workers).",
      " */",
      "",
      "export interface LocalDatasetEntry {",
      "  id: string;",
      "  title: string;",
      "  organization: string;",
      "  notes: string;",
      "  tags: string[];",
      "  formats: string[];",
      "  url: string;",
      "  updatedAt: string;",
      "  resourceCount: number;",
      "  localFiles: number;",
      "}",
      "",
      `export const LOCAL_DATASET_COUNT = ${datasets.length};`,
      "",
      "export const LOCAL_DATASETS: LocalDatasetEntry[] = [",
    ];
    for (const d of datasets) {
      const fmts = [...new Set(d.resources.map((r) => r.format).filter(Boolean))].slice(0, 5);
      const localFiles = d.resources.filter((r) => r.downloadStatus === "ok").length;
      lines.push(
        `  { id: ${JSON.stringify(d.id)}, title: ${esc(d.titleTh)}, organization: ${esc(d.orgName)}, notes: ${esc(d.notesTh.replace(/\s+/g, " ").trim())}, tags: ${JSON.stringify(d.tags.slice(0, 8))}, formats: ${JSON.stringify(fmts)}, url: "https://data.go.th/dataset/${d.id}", updatedAt: ${JSON.stringify(d.updated.slice(0, 10))}, resourceCount: ${d.numResources}, localFiles: ${localFiles} },`,
      );
    }
    lines.push("];", "");
    const out = resolve(process.cwd(), "apps/api/src/data/localDatasets.ts");
    await writeFile(out, lines.join("\n"));
    console.log(`index: ${out} (${datasets.length} entries)`);
  }
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
