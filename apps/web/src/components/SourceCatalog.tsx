import { useEffect, useMemo, useState } from "react";
import {
  SOURCE_CATALOG,
  type SourceCategory,
  type SourceStatus,
} from "@nst/shared";
import {
  STATUS_COLOR, CATEGORY_LABEL, adapterNameFor,
} from "../lib/sourceCatalog";
import { Dialog } from "./Dialog";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

interface HealthPayload {
  system: { status: string; healthy: number; degraded: number; down: number; total: number };
  adapters: import("@nst/shared").AdapterHealth[];
}

interface Props { open: boolean; onClose: () => void }

const FILTERS = ["all", "live", "ready", "planned", "research", "stub"] as const;
const CATEGORIES = Object.keys(CATEGORY_LABEL) as SourceCategory[];

/**
 * SourceCatalog — Lopburi-style data browser.
 * Three columns: DATA DOMAINS (left, counts + bars) · datasets (center) ·
 * selected pipeline detail (right, honest metadata + runtime health).
 * No invented field dictionaries or row previews — every number is a real
 * catalog count or a live /health/detailed reading.
 */
export function SourceCatalog({ open, onClose }: Props) {
  const [filter, setFilter] = useState<"all" | SourceStatus>("all");
  const [category, setCategory] = useState<SourceCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health/detailed`);
        if (!res.ok) return;
        const json = (await res.json()) as HealthPayload;
        if (!cancelled) setHealth(json);
      } catch {
        // Silent — health surface is best-effort
      }
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [open]);

  const healthByAdapter = useMemo(() => {
    const map = new Map<string, import("@nst/shared").AdapterHealth>();
    for (const a of health?.adapters ?? []) map.set(a.name, a);
    return map;
  }, [health]);

  const counts = useMemo(() => {
    const c = { live: 0, ready: 0, planned: 0, research: 0, stub: 0 } as Record<SourceStatus, number>;
    for (const s of SOURCE_CATALOG) c[s.status]++;
    return c;
  }, []);

  const byCategory = useMemo(() => {
    const m = new Map<SourceCategory, { total: number; live: number }>();
    for (const s of SOURCE_CATALOG) {
      const e = m.get(s.category) ?? { total: 0, live: 0 };
      e.total++;
      if (s.status === "live") e.live++;
      m.set(s.category, e);
    }
    return m;
  }, []);

  const maxCat = Math.max(1, ...[...byCategory.values()].map((e) => e.total));

  const list = useMemo(() => {
    return SOURCE_CATALOG.filter((s) =>
      (filter === "all" || s.status === filter) &&
      (category === "all" || s.category === category),
    );
  }, [filter, category]);

  const selected = useMemo(
    () => SOURCE_CATALOG.find((s) => s.id === selectedId) ?? list[0] ?? null,
    [selectedId, list],
  );
  const selectedAdapter = selected ? adapterNameFor(selected.apiPath) : null;
  const selectedHealth = selectedAdapter ? healthByAdapter.get(selectedAdapter) : null;

  const sysStatus = health?.system;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Data pipelines"
      title={`SOURCES · ${SOURCE_CATALOG.length}`}
    >
      <div className="dialog-summary">
        <span><span className="dot live" /> LIVE {counts.live}</span>
        <span><span className="dot cache" /> READY {counts.ready}</span>
        <span><span className="dot scenario" /> PLANNED {counts.planned}</span>
        <span><span className="dot unavailable" /> RESEARCH {counts.research}</span>
        {counts.stub > 0 && <span><span className="dot unavailable" /> STUB {counts.stub}</span>}
      </div>

      {sysStatus && (
        <div className="dialog-summary" role="status" aria-live="polite">
          <span className="dialog-summary__muted">RUNTIME ·</span>
          <span className="dialog-summary__good">{sysStatus.healthy} healthy</span>
          {sysStatus.degraded > 0 && <span className="dialog-summary__warn">{sysStatus.degraded} degraded</span>}
          {sysStatus.down > 0 && <span className="dialog-summary__bad">{sysStatus.down} down</span>}
          <span className="dialog-summary__muted">· of {sysStatus.total} tracked</span>
        </div>
      )}

      <div className="chip-row" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className="chip"
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="sources-grid">
        {/* Left — data domains */}
        <nav className="sources-domains" aria-label="Data domains">
          <h3 className="eyebrow">Data domains</h3>
          <button
            type="button"
            className={`sources-domain ${category === "all" ? "is-on" : ""}`}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            <span className="sources-domain__label">All</span>
            <span className="num">{SOURCE_CATALOG.length}</span>
            <span className="sources-domain__bar" aria-hidden="true">
              <span style={{ width: "100%" }} />
            </span>
          </button>
          {CATEGORIES.filter((c) => byCategory.has(c)).map((c) => {
            const e = byCategory.get(c)!;
            return (
              <button
                key={c}
                type="button"
                className={`sources-domain ${category === c ? "is-on" : ""}`}
                aria-pressed={category === c}
                onClick={() => setCategory(category === c ? "all" : c)}
              >
                <span className="sources-domain__label">{CATEGORY_LABEL[c]} · {c}</span>
                <span className="num">{e.total}</span>
                <span className="sources-domain__bar" aria-hidden="true">
                  <span style={{ width: `${Math.round((e.total / maxCat) * 100)}%` }} />
                </span>
                <span className="caption num">{e.live} live</span>
              </button>
            );
          })}
        </nav>

        {/* Center — dataset list */}
        <div className="sources-list" role="list" aria-label="Datasets">
          <h3 className="eyebrow">{list.length} datasets</h3>
          {list.length === 0 && <p className="note">No pipelines match.</p>}
          <ul className="row-list">
            {list.map((s) => (
              <li key={s.id} role="listitem">
                <button
                  type="button"
                  className={`row-btn row-btn--glyph ${selected?.id === s.id ? "is-on" : ""}`}
                  aria-pressed={selected?.id === s.id}
                  onClick={() => setSelectedId(s.id)}
                >
                  <span className="status-glyph" style={{ background: STATUS_COLOR[s.status] }} aria-hidden="true" />
                  <span className="row-btn__name">{s.label}</span>
                  <span className="row-btn__meta">
                    {s.status.toUpperCase()} · {CATEGORY_LABEL[s.category]}
                    {s.apiPath ? " · API" : ""}
                    {s.keyEnv ? " · KEY" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — selected pipeline */}
        <div className="sources-detail" aria-live="polite">
          {!selected ? (
            <p className="note">Select a dataset.</p>
          ) : (
            <>
              <p className="eyebrow">Selected pipeline</p>
              <h4>{selected.label}</h4>
              <p className="caption">{selected.vendor}</p>
              <p>{selected.describe}</p>
              <table className="data-table">
                <tbody>
                  <tr><th scope="row">Status</th><td>{selected.status.toUpperCase()}</td></tr>
                  <tr><th scope="row">Domain</th><td>{selected.category}</td></tr>
                  {selected.apiPath && <tr><th scope="row">API</th><td className="num">{selected.apiPath}</td></tr>}
                  {selected.endpoint && (
                    <tr><th scope="row">Upstream</th><td className="num">{selected.endpoint.replace(/^https?:\/\//, "").slice(0, 64)}</td></tr>
                  )}
                  {selected.pollSeconds && <tr><th scope="row">Poll</th><td className="num">{selected.pollSeconds}s</td></tr>}
                  {selected.keyEnv && <tr><th scope="row">Key</th><td className="num">{selected.keyEnv}</td></tr>}
                </tbody>
              </table>
              {selectedHealth ? (
                <p className="caption">
                  Runtime: {selectedHealth.status}
                  {selectedHealth.consecutiveFailures > 0 &&
                    ` · ${selectedHealth.consecutiveFailures} consec. failures`}
                  {selectedHealth.lastErrorMessage &&
                    ` · ${selectedHealth.lastErrorMessage.slice(0, 120)}`}
                </p>
              ) : (
                <p className="caption">Runtime: not tracked by /health/detailed yet.</p>
              )}
              {selected.docs && (
                <p><a className="link" href={selected.docs} target="_blank" rel="noreferrer">Upstream docs ↗</a></p>
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
