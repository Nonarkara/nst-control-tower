/**
 * Shapes of the static open-data workbench JSON written by
 * scripts/prep_workbench.py into public/data/workbench/.
 */

export type ColumnKind = "number" | "time" | "coord" | "place" | "id" | "text";

export interface ColumnProfile {
  name: string;
  kind: ColumnKind;
  filled: number;
  distinct: number;
}

export interface TableSummary {
  id: string;
  datasetId: string;
  title: string;
  resource: string;
  sheet: string;
  format: string;
  org: string;
  domain: string;
  sourceRows: number;
  /** Columns in the source file; only the first 80 are kept for very wide tables. */
  sourceColumns: number;
  rows: number;
  truncated: boolean;
  hasCoords: boolean;
  hasPlace: boolean;
  hasTime: boolean;
  numeric: number;
  /** Place columns name other provinces but never นครศรีธรรมราช (national files). */
  otherProvince: boolean;
  columns: ColumnProfile[];
  sourceUrl: string;
  fileUrl: string;
  updated: string;
}

export type ResourceStatus =
  | "parsed"
  | "duplicate"
  | "list-only"
  | "oversize"
  | "fetch-failed"
  | "parse-failed"
  | "out-of-scope";

export interface LedgerResource {
  idx: number;
  name: string;
  format: string;
  url: string;
  status: ResourceStatus;
  reason: string;
  tables: string[];
}

export interface LedgerDataset {
  id: string;
  title: string;
  org: string;
  domain: string;
  updated: string;
  sourceUrl: string;
  tables: number;
  resources: LedgerResource[];
}

export interface DomainCount {
  key: string;
  th: string;
  en: string;
  datasets: number;
  tables: number;
}

export interface WorkbenchStats {
  datasets: number;
  resources: number;
  inScope: number;
  outOfScope: number;
  tables: number;
  sourceRows: number;
  sampledRows: number;
  spatial: number;
  coords: number;
  time: number;
  numeric: number;
  otherProvince: number;
  listOnly: number;
  failed: number;
  noTable: number;
  byStatus: Record<ResourceStatus, number>;
}

export interface WorkbenchIndex {
  query: string;
  crawledAt: string | null;
  generatedAt: string;
  maxRows: number;
  stats: WorkbenchStats;
  domains: DomainCount[];
  tables: TableSummary[];
  ledger: LedgerDataset[];
}

export type Cell = string | number | null;

export interface TableData {
  id: string;
  columns: string[];
  rows: Cell[][];
}
