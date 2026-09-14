import { useEffect, useMemo, useState } from "react";
import type { AtlasSnapshot, AtlasSource, AtlasSourceStatus } from "@nst/shared";
import { API_BASE } from "../../lib/apiBase";
import { AtlasModuleView } from "./charts";
import { Dialog } from "../Dialog";

/**
 * Nakhon Si Thammarat Data Atlas — full-bleed overlay turning the Municipal Data Source Bible's
 * outcome data into KPI scorecards + charts, plus a browsable catalog of every
 * data source. Fetches /api/atlas once on open.
 */

const STATUS_LABEL: Record<AtlasSourceStatus, string> = {
  integrated: "Integrated",
  "live-free": "Live · free",
  registration: "Register/MOU",
  scrape: "Scrape",
  planned: "Planned",
};

function SourceCatalogExplorer({ sources }: { sources: AtlasSource[] }) {
  const [domain, setDomain] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const domains = useMemo(
    () => ["all", ...Array.from(new Set(sources.map((s) => s.domain))).sort()],
    [sources],
  );
  const statuses: Array<string> = ["all", "integrated", "live-free", "registration", "scrape", "planned"];

  const rows = sources.filter(
    (s) => (domain === "all" || s.domain === domain) && (status === "all" || s.status === status),
  );

  return (
    <section className="atlas-sources" id="atlas-sources">
      <header className="atlas-module-head">
        <h3>Data Source Catalog <span className="atlas-module-th" lang="th">บัญชีแหล่งข้อมูล</span></h3>
        <p className="atlas-module-summary caption">
          {sources.length} sources from the Nakhon Si Thammarat Municipal Data Source Bible — filter by domain or integration status.
        </p>
      </header>
      <div className="atlas-sources-filters" role="group" aria-label="Filter by domain">
        {domains.map((d) => (
          <button key={d} type="button" className={domain === d ? "on" : ""} aria-pressed={domain === d} onClick={() => setDomain(d)}>{d === "all" ? "all domains" : d}</button>
        ))}
      </div>
      <div className="atlas-sources-filters" role="group" aria-label="Filter by status">
        {statuses.map((st) => (
          <button key={st} type="button" className={status === st ? "on" : ""} aria-pressed={status === st} onClick={() => setStatus(st)}>{st}</button>
        ))}
      </div>
      <table className="atlas-source-table">
        <thead>
          <tr><th>Source</th><th>Domain</th><th>Access</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>
                <div className="atlas-source-name">
                  {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a> : s.name}
                </div>
                {s.note ? <div className="atlas-source-note">{s.note}</div> : null}
              </td>
              <td className="caption">{s.domain}</td>
              <td className="caption">{s.format} · {s.free}</td>
              <td><span className={`atlas-source-status ${s.status}`}>{STATUS_LABEL[s.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AtlasView({ onClose }: { onClose: () => void }) {
  const [snap, setSnap] = useState<AtlasSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/atlas`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: AtlasSnapshot) => alive && setSnap(j))
      .catch((e) => alive && setErr(String(e)));
    return () => { alive = false; };
  }, []);

  const moduleCount = snap?.modules.length ?? 0;
  const sourceCount = snap?.sources.length ?? 0;

  return (
    <Dialog
      open
      onClose={onClose}
      size="full"
      className="dialog--atlas"
      title={<>Nakhon Si Thammarat Data Atlas <span lang="th">แผนที่ข้อมูลเมืองนครศรีธรรมราช</span></>}
      description={`${moduleCount} domains · ${sourceCount} sources · outcome intelligence from the Municipal Data Source Bible`}
    >
      {snap ? (
        <nav className="atlas-nav" aria-label="Atlas sections">
          {snap.modules.map((m) => <a key={m.id} href={`#atlas-${m.id}`}>{m.title}</a>)}
          <a href="#atlas-sources">Sources</a>
        </nav>
      ) : null}

      <div className="atlas-body">
        {err ? <p className="caption dialog-summary__bad" role="alert">Atlas data unavailable: {err}. Is the API running?</p> : null}
        {!snap && !err ? <p className="caption" role="status">Loading atlas…</p> : null}
        {snap?.modules.map((m) => <AtlasModuleView key={m.id} module={m} />)}
        {snap ? <SourceCatalogExplorer sources={snap.sources} /> : null}
      </div>
    </Dialog>
  );
}
