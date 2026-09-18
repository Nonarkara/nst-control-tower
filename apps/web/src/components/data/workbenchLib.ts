/**
 * Pure helpers for the open-data workbench — filtering, sorting, CSV export.
 * No React, no DOM: unit-tested in workbenchLib.test.ts.
 */

import type { Cell, LedgerDataset, ResourceStatus, TableSummary } from "./workbenchTypes";

export type TableFilter = "all" | "spatial" | "coords" | "time" | "numeric";
export type SortDir = "asc" | "desc";

export const TABLE_FILTERS: readonly { key: TableFilter; th: string; en: string }[] = [
  { key: "all", th: "ทั้งหมด", en: "All" },
  { key: "spatial", th: "พร้อมเชิงพื้นที่", en: "Spatial-ready" },
  { key: "coords", th: "มีพิกัด", en: "Has coordinates" },
  { key: "time", th: "อนุกรมเวลา", en: "Time series" },
  { key: "numeric", th: "มีตัวเลข", en: "Numeric" },
];

export function matchesFilter(t: TableSummary, filter: TableFilter): boolean {
  switch (filter) {
    case "spatial":
      return t.hasCoords || t.hasPlace;
    case "coords":
      return t.hasCoords;
    case "time":
      return t.hasTime;
    case "numeric":
      return t.numeric > 0;
    default:
      return true;
  }
}

/** Every whitespace-separated term must appear somewhere in the haystack (case-insensitive). */
export function matchesQuery(haystack: readonly string[], query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = haystack.join(" ").toLowerCase();
  return terms.every((term) => text.includes(term));
}

export interface TableQuery {
  filter: TableFilter;
  query: string;
  domain: string | null;
}

export function filterTables(tables: readonly TableSummary[], q: TableQuery): TableSummary[] {
  return tables.filter(
    (t) =>
      matchesFilter(t, q.filter) &&
      (q.domain === null || t.domain === q.domain) &&
      matchesQuery([t.title, t.org, t.resource, t.sheet, ...t.columns.map((c) => c.name)], q.query),
  );
}

export function countByFilter(tables: readonly TableSummary[]): Record<TableFilter, number> {
  const out: Record<TableFilter, number> = { all: 0, spatial: 0, coords: 0, time: 0, numeric: 0 };
  for (const t of tables) {
    for (const f of TABLE_FILTERS) if (matchesFilter(t, f.key)) out[f.key] += 1;
  }
  return out;
}

export interface LedgerQuery {
  query: string;
  status: ResourceStatus | "all";
  domain: string | null;
}

export function filterLedger(ledger: readonly LedgerDataset[], q: LedgerQuery): LedgerDataset[] {
  return ledger.filter(
    (d) =>
      (q.domain === null || d.domain === q.domain) &&
      (q.status === "all" || d.resources.some((r) => r.status === q.status)) &&
      matchesQuery([d.title, d.org, d.id, ...d.resources.map((r) => r.name)], q.query),
  );
}

/** Compare two cells: numbers numerically, text with Thai collation; empties always last. */
export function compareCells(a: Cell, b: Cell, dir: SortDir): number {
  if (a === null || a === "") return b === null || b === "" ? 0 : 1;
  if (b === null || b === "") return -1;
  const sign = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * sign;
  if (typeof a === "number") return -1 * sign;
  if (typeof b === "number") return 1 * sign;
  return a.localeCompare(b, "th", { numeric: true }) * sign;
}

/** Returns a new, sorted array; the input is never mutated. Stable for equal keys. */
export function sortRows(rows: readonly Cell[][], col: number | null, dir: SortDir): Cell[][] {
  if (col === null) return rows.slice();
  return rows
    .map((row, i) => ({ row, i }))
    .sort((x, y) => compareCells(x.row[col] ?? null, y.row[col] ?? null, dir) || x.i - y.i)
    .map((x) => x.row);
}

/** Header click cycles: new column → asc, asc → desc, desc → unsorted. */
export function nextSort(
  current: { col: number | null; dir: SortDir },
  col: number,
): { col: number | null; dir: SortDir } {
  if (current.col !== col) return { col, dir: "asc" };
  if (current.dir === "asc") return { col, dir: "desc" };
  return { col: null, dir: "asc" };
}

function csvField(v: Cell): string {
  if (v === null) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Thai text correctly. */
export function toCsv(columns: readonly string[], rows: readonly Cell[][]): string {
  const lines = [columns.map(csvField).join(","), ...rows.map((r) => r.map(csvField).join(","))];
  return "\ufeff" + lines.join("\r\n") + "\r\n";
}

export function csvFileName(tableId: string): string {
  return `nst-${tableId.replace(/[^A-Za-z0-9_-]+/g, "-")}.csv`;
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function fmtCell(v: Cell): string {
  if (v === null) return "";
  if (typeof v === "number") {
    return Number.isInteger(v) ? v.toLocaleString("en-US") : v.toLocaleString("en-US", { maximumFractionDigits: 6 });
  }
  return v;
}
