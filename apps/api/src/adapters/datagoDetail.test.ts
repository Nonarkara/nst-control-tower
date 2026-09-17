import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDatasetDetail,
  fetchPreview,
  __test__,
} from "./datagoDetail";

/**
 * datagoDetail adapter contract tests:
 *   - parseCsv: header + row split, quoted commas, escaped "" quotes, \r\n
 *   - parseJson: array of objects → headers from keys, array of scalars,
 *     plain object → key/value pair, scalar fallback
 *   - isAllowedHost: blocks off-list (e.g., example.com) and only-https
 *     via fetchPreview status without making any network call
 *   - fetchDatasetDetail: 200 + JSON success → returns slimmed summary;
 *     non-200 / non-success → returns null. Network errors → null.
 *
 * The cache is module-level — these tests deliberately use a unique
 * id per test to keep them isolated.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function csvResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/csv" },
  });
}

describe("datagoDetail — parseCsv", () => {
  it("splits plain comma-separated rows", () => {
    const r = __test__.parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(r.headers).toEqual(["a", "b", "c"]);
    expect(r.rows).toEqual([["1", "2", "3"], ["4", "5", "6"]]);
    expect(r.totalRows).toBe(2);
    expect(r.truncated).toBe(false);
  });

  it("handles quoted commas and escaped quotes", () => {
    const r = __test__.parseCsv('name,note\n"a,b","he said ""hi"""\n"c","d"');
    expect(r.headers).toEqual(["name", "note"]);
    expect(r.rows[0]).toEqual(["a,b", 'he said "hi"']);
    expect(r.rows[1]).toEqual(["c", "d"]);
  });

  it("handles \\r\\n line endings", () => {
    const r = __test__.parseCsv("a,b\r\n1,2\r\n3,4\r\n");
    expect(r.headers).toEqual(["a", "b"]);
    expect(r.rows).toEqual([["1", "2"], ["3", "4"]]);
  });

  it("truncates long cells at 200 chars + ellipsis", () => {
    const big = "x".repeat(250);
    const r = __test__.parseCsv(`col\n${big}`);
    expect(r.headers).toEqual(["col"]);
    expect(r.rows[0][0].length).toBe(201); // 200 + "…"
    expect(r.rows[0][0].endsWith("…")).toBe(true);
  });

  it("truncates row count at 50 with totalRows carrying the rest", () => {
    let body = "h\n";
    for (let i = 0; i < 75; i++) body += `r${i}\n`;
    const r = __test__.parseCsv(body);
    expect(r.rows.length).toBe(50);
    expect(r.totalRows).toBe(75);
    expect(r.truncated).toBe(true);
  });
});

describe("datagoDetail — parseJson", () => {
  it("array of objects → headers from keys + rows", () => {
    const r = __test__.parseJson(JSON.stringify([
      { a: 1, b: "x" },
      { a: 2, b: "y" },
    ]));
    expect(r.headers).toEqual(["a", "b"]);
    expect(r.rows).toEqual([["1", "x"], ["2", "y"]]);
    expect(r.totalRows).toBe(2);
  });

  it("array of scalars → single 'value' column", () => {
    const r = __test__.parseJson(JSON.stringify(["a", "b", "c"]));
    expect(r.headers).toEqual(["value"]);
    expect(r.rows).toEqual([["a"], ["b"], ["c"]]);
  });

  it("object → key/value table", () => {
    const r = __test__.parseJson(JSON.stringify({ k1: "v1", k2: 42 }));
    expect(r.headers).toEqual(["key", "value"]);
    expect(r.rows).toEqual([
      ["k1", '"v1"'],
      ["k2", "42"],
    ]);
  });

  it("rejects malformed JSON", () => {
    expect(() => __test__.parseJson("not json")).toThrow();
  });
});

describe("datagoDetail — isAllowedHost", () => {
  it("accepts the data.go.th allowlist", () => {
    expect(__test__.isAllowedHost("data.go.th")).toBe(true);
    expect(__test__.isAllowedHost("filedata.data.go.th")).toBe(true);
    expect(__test__.isAllowedHost("catalog.dopa.go.th")).toBe(true); // *.go.th suffix
  });

  it("blocks external hosts", () => {
    expect(__test__.isAllowedHost("example.com")).toBe(false);
    expect(__test__.isAllowedHost("evil.data.go.th.attacker.io")).toBe(false);
    expect(__test__.isAllowedHost("localhost")).toBe(false);
  });
});

describe("fetchPreview — without leaving the machine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks http and unknown hosts without a fetch call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const blocked = await fetchPreview("http://example.com/x.csv");
    expect(blocked.status).toBe("blocked_host");
    const blocked2 = await fetchPreview("https://example.com/x.csv");
    expect(blocked2.status).toBe("blocked_host");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches an allowed CSV, parses, and returns rows", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => csvResponse("name,year\nnuat,2026\nkhao,2025")));
    const r = await fetchPreview("https://data.go.th/file/x.csv", "CSV");
    expect(r.status).toBe("ok");
    expect(r.preview?.headers).toEqual(["name", "year"]);
    expect(r.preview?.rows).toEqual([["nuat", "2026"], ["khao", "2025"]]);
    expect(r.preview?.totalRows).toBe(2);
  });

  it("returns unsupported_format for XLSX without parsing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("PK\u0003\u0004 binary", { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } })));
    const r = await fetchPreview("https://data.go.th/file/x.xlsx", "XLSX");
    expect(r.status).toBe("unsupported_format");
  });

  it("returns fetch_failed when the network errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connection refused"); }));
    const r = await fetchPreview("https://data.go.th/file/x.csv", "CSV");
    expect(r.status).toBe("fetch_failed");
    expect(r.error).toContain("connection refused");
  });

  it("returns too_large when the body grows past MAX_BYTES", async () => {
    // Build a fake stream that always pushes more bytes than the cap.
    const huge = new Uint8Array(300 * 1024);
    const reader = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(huge); c.close(); },
    }).getReader();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      new ReadableStream({ async pull(c) {
        // Walk the reader once so the consumer above reads it as a real body.
        const { value } = await reader.read();
        if (value) c.enqueue(value);
        c.close();
      } }),
      { status: 200, headers: { "Content-Type": "text/csv" } },
    )));
    const r = await fetchPreview("https://data.go.th/file/x.csv", "CSV");
    expect(r.status).toBe("too_large");
  });
});

describe("fetchDatasetDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("dns"); }));
    const r = await fetchDatasetDetail("missing-dns-error");
    expect(r).toBeNull();
  });

  it("returns null on non-200", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 500 })));
    const r = await fetchDatasetDetail("missing-500");
    expect(r).toBeNull();
  });

  it("returns null when CKAN success !== true", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ success: false })));
    const r = await fetchDatasetDetail("missing-success");
    expect(r).toBeNull();
  });

  it("parses a CKAN package_show payload into the slim summary", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      success: true,
      result: {
        id: "uuid-abc",
        title: "Some dataset",
        notes: "Notes about it",
        organization: "Some Org",
        data_source: "Some Source",
        maintainer: "Mr. K.",
        license_title: "Open Data Common",
        geo_coverage: "Province",
        data_release_date: "2026-04-01",
        update_frequency_interval: "1",
        update_frequency_unit: "year",
        data_format: ["CSV", "JSON"],
        data_language: ["ไทย"],
        url: "https://data.go.th/dataset/uuid-abc",
        resources: [
          { id: "r1", name: "file.csv", format: "CSV", mimetype: "text/csv", url: "https://data.go.th/r1.csv", size: 12345, created: "2026-04-01", last_modified: "2026-04-02" },
          { id: "r2", name: "data.json", format: "JSON", url: "https://data.go.th/r2.json" },
        ],
      },
    })));
    const r = await fetchDatasetDetail("uuid-abc");
    expect(r).not.toBeNull();
    expect(r?.title).toBe("Some dataset");
    expect(r?.organization).toBe("Some Org");
    expect(r?.dataFormat).toEqual(["CSV", "JSON"]);
    expect(r?.updateFrequency).toBe("1 year");
    expect(r?.resources.length).toBe(2);
    expect(r?.resources[0].size).toBe(12345);
    expect(r?.resources[1].size).toBeNull();
  });
});
