/**
 * DataWorkbenchPage — /data. Every data.go.th dataset for นครศรีธรรมราช,
 * prepared into readable tables (scripts/prep_workbench.py) with a full
 * audit ledger of what could not be read. Lazy-loaded from Root.tsx so the
 * map bundle does not carry it.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/data-workbench.css";
import { useTheme } from "../../hooks/useTheme";
import { fmtInt } from "./workbenchLib";
import type { TableSummary, WorkbenchIndex } from "./workbenchTypes";
import { WorkbenchOverview } from "./WorkbenchOverview";
import { TableCatalog } from "./TableCatalog";
import { SourceLedger } from "./SourceLedger";
import { TableViewer } from "./TableViewer";

export const WORKBENCH_BASE = "/data/workbench";
type Tab = "tables" | "ledger";

function tableIdFromHash(): string | null {
  const m = window.location.hash.match(/^#table=(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function DataWorkbenchPage() {
  const { theme, toggle } = useTheme();
  const [index, setIndex] = useState<WorkbenchIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("tables");
  const [domain, setDomain] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(() => tableIdFromHash());

  useEffect(() => {
    document.title = "คลังข้อมูลเปิด นครศรีธรรมราช · Open-data workbench";
    const ctrl = new AbortController();
    fetch(`${WORKBENCH_BASE}/index.json`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<WorkbenchIndex>;
      })
      .then(setIndex)
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setError((err as Error).message);
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const onHash = () => setOpenId(tableIdFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const openTable = useCallback((id: string | null) => {
    const url = id ? `#table=${encodeURIComponent(id)}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
    setOpenId(id);
  }, []);

  const byId = useMemo(() => new Map((index?.tables ?? []).map((t) => [t.id, t])), [index]);
  const open: TableSummary | null = openId ? byId.get(openId) ?? null : null;

  return (
    <div className="dwb">
      <header className="dwb-top">
        <a className="dwb-back link" href="/">
          ← แผนที่ <span className="dwb-sub">Map</span>
        </a>
        <p className="dwb-top__id">
          นครศรีธรรมราช <span className="dwb-sub">· Open data workbench</span>
        </p>
        <button type="button" className="btn btn--quiet" onClick={toggle} aria-label="Toggle light or dark theme">
          {theme === "dark" ? "สว่าง / Light" : "มืด / Dark"}
        </button>
      </header>

      <main className="dwb-main" id="main">
        {error ? (
          <p className="note dwb-error" role="alert">
            โหลดข้อมูลไม่สำเร็จ / Could not load the workbench index ({error}).
          </p>
        ) : null}
        {!index && !error ? <p className="note">กำลังโหลด… / Loading…</p> : null}
        {index ? (
          <>
            <WorkbenchOverview index={index} domain={domain} onDomain={setDomain} />

            <div className="dwb-tabs" role="tablist" aria-label="มุมมอง / View">
              <button
                type="button"
                role="tab"
                id="dwb-tab-tables"
                aria-controls="dwb-panel"
                aria-selected={tab === "tables"}
                className="dwb-tab"
                onClick={() => setTab("tables")}
              >
                ตารางที่เตรียมแล้ว <span className="dwb-sub">Prepared tables</span>{" "}
                <span className="num">({fmtInt(index.stats.tables)})</span>
              </button>
              <button
                type="button"
                role="tab"
                id="dwb-tab-ledger"
                aria-controls="dwb-panel"
                aria-selected={tab === "ledger"}
                className="dwb-tab"
                onClick={() => setTab("ledger")}
              >
                ทะเบียนแหล่งข้อมูลทั้งหมด <span className="dwb-sub">Full source ledger</span>{" "}
                <span className="num">({fmtInt(index.stats.datasets)})</span>
              </button>
            </div>

            <section id="dwb-panel" role="tabpanel" aria-labelledby={`dwb-tab-${tab}`} className="dwb-panel">
              {tab === "tables" ? (
                <TableCatalog index={index} domain={domain} onOpen={openTable} />
              ) : (
                <SourceLedger index={index} domain={domain} onOpen={openTable} />
              )}
            </section>
          </>
        ) : null}
      </main>

      {open ? <TableViewer table={open} domains={index?.domains ?? []} onClose={() => openTable(null)} /> : null}
    </div>
  );
}

export default DataWorkbenchPage;
