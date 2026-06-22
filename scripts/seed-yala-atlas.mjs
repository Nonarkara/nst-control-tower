#!/usr/bin/env node
/**
 * Seed a local SQLite "Yala Data Atlas" database from the live /api/atlas
 * snapshot. The atlas is static reference data digitized from the Municipal
 * Data Source Bible — this gives it a real, queryable database base on the Mac
 * (handover-ready, demoable with plain SQL) alongside the in-app visual layer.
 *
 *   1. start the API:  PORT=8789 pnpm --filter @yala/api start:node
 *   2. seed:           node scripts/seed-yala-atlas.mjs
 *   3. query:          sqlite3 apps/api/var/yala-atlas.db "select * from indicator where status='critical'"
 *
 * Uses the system `sqlite3` CLI (ships with macOS) — no npm dependency.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const API = process.env.ATLAS_API ?? "http://localhost:8789";
const OUT_DIR = resolve(ROOT, "apps/api/var");
const DB = resolve(OUT_DIR, "yala-atlas.db");
const SQL = resolve(OUT_DIR, "yala-atlas.sql");
const JSON_OUT = resolve(OUT_DIR, "yala-atlas.json");

const q = (v) =>
  v == null ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`→ fetching ${API}/api/atlas`);
  const res = await fetch(`${API}/api/atlas`);
  if (!res.ok) throw new Error(`API ${res.status} — is the Yala API running on ${API}?`);
  const snap = await res.json();
  writeFileSync(JSON_OUT, JSON.stringify(snap, null, 1));

  const lines = [
    "PRAGMA foreign_keys=OFF;",
    "BEGIN;",
    "DROP TABLE IF EXISTS atlas_module; DROP TABLE IF EXISTS indicator; DROP TABLE IF EXISTS chart; DROP TABLE IF EXISTS source;",
    "CREATE TABLE atlas_module (id TEXT PRIMARY KEY, title TEXT, title_th TEXT, summary TEXT, accent TEXT);",
    "CREATE TABLE indicator (module_id TEXT, id TEXT, label TEXT, value TEXT, unit TEXT, benchmark_label TEXT, benchmark_value TEXT, rank_pos INT, rank_of INT, status TEXT, source TEXT, year INT, note TEXT);",
    "CREATE TABLE chart (module_id TEXT, idx INT, kind TEXT, title TEXT, spec_json TEXT);",
    "CREATE TABLE source (id TEXT, name TEXT, domain TEXT, url TEXT, auth TEXT, format TEXT, free TEXT, status TEXT, yala TEXT);",
  ];

  let nInd = 0, nChart = 0;
  for (const m of snap.modules) {
    lines.push(`INSERT INTO atlas_module VALUES (${q(m.id)},${q(m.title)},${q(m.titleTh)},${q(m.summary)},${q(m.accent)});`);
    for (const i of m.indicators) {
      nInd++;
      lines.push(
        `INSERT INTO indicator VALUES (${q(m.id)},${q(i.id)},${q(i.label)},${q(String(i.value))},${q(i.unit)},` +
          `${q(i.benchmark?.label)},${q(i.benchmark != null ? String(i.benchmark.value) : null)},` +
          `${q(i.rank?.pos)},${q(i.rank?.of)},${q(i.status)},${q(i.source)},${q(i.year)},${q(i.note)});`,
      );
    }
    m.charts.forEach((c, idx) => {
      nChart++;
      lines.push(`INSERT INTO chart VALUES (${q(m.id)},${idx},${q(c.kind)},${q(c.title)},${q(JSON.stringify(c))});`);
    });
  }
  for (const s of snap.sources) {
    lines.push(
      `INSERT INTO source VALUES (${q(s.id)},${q(s.name)},${q(s.domain)},${q(s.url)},${q(s.auth)},${q(s.format)},${q(s.free)},${q(s.status)},${q(s.yala)});`,
    );
  }
  lines.push("COMMIT;");
  writeFileSync(SQL, lines.join("\n"));

  execFileSync("sqlite3", [DB], { input: `.read ${SQL}\n`, stdio: ["pipe", "inherit", "inherit"] });

  console.log(`✓ seeded ${DB}`);
  console.log(`  ${snap.modules.length} modules · ${nInd} indicators · ${nChart} charts · ${snap.sources.length} sources`);
  const sample = execFileSync(
    "sqlite3",
    [DB, "-header", "-column", "SELECT module_id, label, value, status FROM indicator WHERE status='critical' LIMIT 8;"],
    { encoding: "utf8" },
  );
  console.log("\nSample — critical outcome indicators:\n" + sample);
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
