import { describe, expect, it } from "vitest";
import {
  compareCells,
  countByFilter,
  csvFileName,
  filterLedger,
  filterTables,
  fmtCell,
  matchesQuery,
  nextSort,
  sortRows,
  toCsv,
} from "./workbenchLib";
import type { Cell, LedgerDataset, TableSummary } from "./workbenchTypes";

function table(over: Partial<TableSummary>): TableSummary {
  return {
    id: "t",
    datasetId: "d",
    title: "ตาราง",
    resource: "",
    sheet: "",
    format: "CSV",
    org: "สำนักงานจังหวัด",
    domain: "other",
    sourceRows: 10,
    sourceColumns: 0,
    rows: 10,
    truncated: false,
    hasCoords: false,
    hasPlace: false,
    hasTime: false,
    numeric: 0,
    otherProvince: false,
    columns: [],
    sourceUrl: "https://data.go.th/dataset/d",
    fileUrl: "",
    updated: "2026-01-01",
    ...over,
  };
}

const TABLES: TableSummary[] = [
  table({ id: "flood", title: "ความเสี่ยงจากอุทกภัย", hasCoords: true, hasPlace: true, domain: "environment" }),
  table({ id: "pop", title: "ประชากร", hasPlace: true, hasTime: true, numeric: 3, domain: "governance" }),
  table({ id: "temples", title: "วัดในจังหวัด", domain: "culture", columns: [{ name: "ชื่อวัด", kind: "text", filled: 1, distinct: 1 }] }),
];

describe("filterTables", () => {
  it("returns every table for the 'all' filter with no query", () => {
    expect(filterTables(TABLES, { filter: "all", query: "", domain: null })).toHaveLength(3);
  });

  it("spatial-ready includes place-name-only tables, coords does not", () => {
    const spatial = filterTables(TABLES, { filter: "spatial", query: "", domain: null }).map((t) => t.id);
    const coords = filterTables(TABLES, { filter: "coords", query: "", domain: null }).map((t) => t.id);
    expect(spatial).toEqual(["flood", "pop"]);
    expect(coords).toEqual(["flood"]);
  });

  it("combines filter, domain and a query that matches column names", () => {
    expect(filterTables(TABLES, { filter: "all", query: "ชื่อวัด", domain: "culture" }).map((t) => t.id)).toEqual(["temples"]);
    expect(filterTables(TABLES, { filter: "time", query: "", domain: "culture" })).toEqual([]);
  });

  it("counts tables per filter", () => {
    expect(countByFilter(TABLES)).toEqual({ all: 3, spatial: 2, coords: 1, time: 1, numeric: 1 });
  });
});

describe("matchesQuery", () => {
  it("requires every term (AND), case-insensitive", () => {
    expect(matchesQuery(["Flood Risk", "อำเภอ"], "flood อำเภอ")).toBe(true);
    expect(matchesQuery(["Flood Risk"], "flood fire")).toBe(false);
    expect(matchesQuery(["x"], "   ")).toBe(true);
  });
});

describe("filterLedger", () => {
  const ledger: LedgerDataset[] = [
    { id: "a", title: "แผนพัฒนา", org: "o", domain: "plan", updated: "", sourceUrl: "", tables: 0,
      resources: [{ idx: 0, name: "pdf", format: "PDF", url: "", status: "list-only", reason: "", tables: [] }] },
    { id: "b", title: "ประชากร", org: "o", domain: "governance", updated: "", sourceUrl: "", tables: 1,
      resources: [{ idx: 0, name: "csv", format: "CSV", url: "", status: "parsed", reason: "", tables: ["b"] }] },
  ];
  it("filters by resource status and text", () => {
    expect(filterLedger(ledger, { query: "", status: "list-only", domain: null }).map((d) => d.id)).toEqual(["a"]);
    expect(filterLedger(ledger, { query: "ประชากร", status: "all", domain: null }).map((d) => d.id)).toEqual(["b"]);
  });
});

describe("sorting", () => {
  const rows: Cell[][] = [["ข", 10], ["ก", 2], ["", null], ["ค", 1_530_435]];

  it("sorts numbers numerically and keeps empties last in both directions", () => {
    expect(sortRows(rows, 1, "asc").map((r) => r[1])).toEqual([2, 10, 1_530_435, null]);
    expect(sortRows(rows, 1, "desc").map((r) => r[1])).toEqual([1_530_435, 10, 2, null]);
  });

  it("sorts Thai text with Thai collation", () => {
    expect(sortRows(rows, 0, "asc").map((r) => r[0])).toEqual(["ก", "ข", "ค", ""]);
  });

  it("does not mutate the input and returns a copy when unsorted", () => {
    const copy = rows.map((r) => [...r]);
    const out = sortRows(rows, null, "asc");
    expect(out).not.toBe(rows);
    expect(rows).toEqual(copy);
  });

  it("orders numbers before text in a mixed column", () => {
    expect(compareCells(5, "x", "asc")).toBeLessThan(0);
  });

  it("cycles asc → desc → off on repeated header clicks", () => {
    const a = nextSort({ col: null, dir: "asc" }, 2);
    const b = nextSort(a, 2);
    const c = nextSort(b, 2);
    expect(a).toEqual({ col: 2, dir: "asc" });
    expect(b).toEqual({ col: 2, dir: "desc" });
    expect(c.col).toBeNull();
    expect(nextSort(b, 0)).toEqual({ col: 0, dir: "asc" });
  });
});

describe("toCsv", () => {
  it("adds a BOM, CRLF line ends and quotes commas, quotes and newlines", () => {
    const csv = toCsv(["ชื่อ", "จำนวน"], [["a,b", 1_530_435], ['say "hi"', null], ["x\ny", 2.5]]);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toBe('\ufeffชื่อ,จำนวน\r\n"a,b",1530435\r\n"say ""hi""",\r\n"x\ny",2.5\r\n');
  });

  it("makes a safe file name", () => {
    expect(csvFileName("os_4061__r00/../x")).toBe("nst-os_4061__r00-x.csv");
  });
});

describe("fmtCell", () => {
  it("adds thousands separators to numbers only", () => {
    expect(fmtCell(1530435)).toBe("1,530,435");
    expect(fmtCell("2567")).toBe("2567");
    expect(fmtCell(null)).toBe("");
  });
});
