/**
 * TableViewer — the table itself: sortable columns, the sampled rows, an
 * in-table search, CSV download and the data.go.th source link. Loads
 * tables/{id}.json on open. Full-screen dialog so it works on a phone; the
 * table scrolls horizontally inside its own container.
 */

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "../Dialog";
import { safeUrl } from "../../lib/safeUrl";
import { csvFileName, fmtCell, fmtInt, matchesQuery, nextSort, sortRows, toCsv, type SortDir } from "./workbenchLib";
import type { ColumnKind, DomainCount, TableData, TableSummary } from "./workbenchTypes";
import { TableBadges } from "./TableCatalog";

const PAGE = 300;

const KIND_LABEL: Record<ColumnKind, string> = {
  number: "ตัวเลข",
  time: "เวลา",
  coord: "พิกัด",
  place: "สถานที่",
  id: "รหัส",
  text: "ข้อความ",
};

interface Props {
  table: TableSummary;
  domains: readonly DomainCount[];
  onClose: () => void;
}

function downloadCsv(name: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function TableViewer({ table, domains, onClose }: Props) {
  const [data, setData] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ col: number | null; dir: SortDir }>({ col: null, dir: "asc" });
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);
    fetch(`/data/workbench/tables/${encodeURIComponent(table.id)}.json`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<TableData>;
      })
      .then(setData)
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setError((err as Error).message);
      });
    return () => ctrl.abort();
  }, [table.id]);

  const rows = useMemo(() => {
    if (!data) return [];
    const filtered = query.trim() ? data.rows.filter((r) => matchesQuery(r.map(fmtCell), query)) : data.rows;
    return sortRows(filtered, sort.col, sort.dir);
  }, [data, query, sort]);

  const kinds = table.columns.map((c) => c.kind);
  const domainName = domains.find((d) => d.key === table.domain)?.th ?? table.domain;
  const fileUrl = safeUrl(table.fileUrl);

  const actions = (
    <>
      <button
        type="button"
        className="btn"
        disabled={!data}
        onClick={() => data && downloadCsv(csvFileName(table.id), toCsv(data.columns, rows))}
      >
        ดาวน์โหลด CSV <span className="dwb-sub">Download</span>
      </button>
      <a className="btn" href={table.sourceUrl} target="_blank" rel="noopener noreferrer">
        data.go.th ↗
      </a>
    </>
  );

  return (
    <Dialog
      open
      onClose={onClose}
      size="full"
      className="dwb-viewer"
      eyebrow={`${domainName} · ${table.org || "—"}`}
      title={table.title}
      description={[table.resource, table.sheet ? `ชีต ${table.sheet}` : ""].filter(Boolean).join(" · ") || undefined}
      actions={actions}
    >
      <div className="dwb-viewer__meta">
        <p className="note num">
          {fmtInt(table.sourceRows)} แถวในแหล่ง source rows · {table.columns.length} คอลัมน์ fields · {table.format} · แก้ไข{" "}
          {table.updated || "—"}
          {fileUrl ? (
            <>
              {" · "}
              <a className="link" href={fileUrl} target="_blank" rel="noopener noreferrer">
                ไฟล์ต้นฉบับ / original file ↗
              </a>
            </>
          ) : null}
        </p>
        <TableBadges t={table} />
        {table.truncated ? (
          <p className="dwb-trunc" role="note">
            ตัดตัวอย่าง: แสดง {fmtInt(table.rows)} จาก {fmtInt(table.sourceRows)} แถว — ดาวน์โหลด CSV ได้เฉพาะตัวอย่างนี้
            ข้อมูลเต็มอยู่ที่ data.go.th · Sampled: {fmtInt(table.rows)} of {fmtInt(table.sourceRows)} rows. The full
            table is at the source.
          </p>
        ) : null}
        {table.sourceColumns > table.columns.length ? (
          <p className="dwb-trunc" role="note">
            แสดง {table.columns.length} จาก {table.sourceColumns} คอลัมน์ · Showing the first {table.columns.length} of{" "}
            {table.sourceColumns} columns.
          </p>
        ) : null}
        <label className="field dwb-search">
          <span className="field__label">ค้นในตาราง / Find in table</span>
          <input
            className="field__input"
            type="search"
            value={query}
            placeholder="เช่น ชื่ออำเภอ · e.g. a district name"
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
          />
        </label>
      </div>

      {error ? <p className="note dwb-error" role="alert">โหลดตารางไม่สำเร็จ / Could not load table ({error}).</p> : null}
      {!data && !error ? <p className="note">กำลังโหลดตาราง… / Loading table…</p> : null}

      {data ? (
        <>
          <p className="note" aria-live="polite">
            {fmtInt(rows.length)} แถว rows{query ? " ตรงกับคำค้น / match" : ""} · แตะหัวคอลัมน์เพื่อเรียง / tap a header to sort
          </p>
          <div className="dwb-table-wrap" tabIndex={0} role="region" aria-label={`ตาราง ${table.title}`}>
            <table className="dwb-table">
              <thead>
                <tr>
                  {data.columns.map((c, i) => {
                    const active = sort.col === i;
                    const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
                    return (
                      <th key={`${c}-${i}`} scope="col" aria-sort={ariaSort} className={kinds[i] === "number" || kinds[i] === "coord" ? "dwb-num" : undefined}>
                        <button type="button" className="dwb-th" onClick={() => setSort((s) => nextSort(s, i))}>
                          <span className="dwb-th__name">{c}</span>
                          <span className="dwb-th__kind">
                            {KIND_LABEL[kinds[i] ?? "text"]}
                            {active ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((r, ri) => (
                  <tr key={ri}>
                    {data.columns.map((_, ci) => (
                      <td key={ci} className={typeof r[ci] === "number" ? "dwb-num num" : undefined}>
                        {fmtCell(r[ci] ?? null)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > limit ? (
            <button type="button" className="btn dwb-more" onClick={() => setLimit((n) => n + PAGE)}>
              แสดงเพิ่ม / Show more ({fmtInt(rows.length - limit)})
            </button>
          ) : null}
        </>
      ) : null}
    </Dialog>
  );
}
