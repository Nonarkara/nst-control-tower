import { useEffect, useMemo, useState } from "react";
import {
  SOURCE_CATALOG,
  type SourceEntry,
  type AdapterHealth,
  type SourceStatus,
  type SourceCategory,
} from "@nst/shared";
import {
  STATUS_COLOR, CATEGORY_LABEL, adapterNameFor,
} from "../lib/sourceCatalog";
import { Dialog } from "./Dialog";
// STATUS_COLOR, CATEGORY_LABEL, API_PATH_TO_ADAPTER, adapterNameFor
// imported from ../lib/sourceCatalog (pure, unit-tested).

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

interface HealthPayload {
  system: { status: string; healthy: number; degraded: number; down: number; total: number };
  adapters: AdapterHealth[];
}

interface Props { open: boolean; onClose: () => void }

const FILTERS = ["all", "live", "ready", "planned", "research", "stub"] as const;

export function SourceCatalog({ open, onClose }: Props) {
  const [filter, setFilter] = useState<"all" | SourceStatus>("all");
  const [health, setHealth] = useState<HealthPayload | null>(null);

  // Fetch detailed adapter health when the modal opens. Refetch every 60 s while open.
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
    const map = new Map<string, AdapterHealth>();
    for (const a of health?.adapters ?? []) map.set(a.name, a);
    return map;
  }, [health]);

  const grouped = useMemo(() => {
    const list = filter === "all"
      ? SOURCE_CATALOG
      : SOURCE_CATALOG.filter((s) => s.status === filter);
    const map = new Map<SourceCategory, SourceEntry[]>();
    for (const s of list) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return [...map.entries()];
  }, [filter]);

  const counts = useMemo(() => {
    const c = { live: 0, ready: 0, planned: 0, research: 0, stub: 0 } as Record<SourceStatus, number>;
    for (const s of SOURCE_CATALOG) c[s.status]++;
    return c;
  }, []);

  const sysStatus = health?.system;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Data pipelines"
      title={`SOURCE CATALOG · ${SOURCE_CATALOG.length}`}
    >
      <div className="dialog-summary">
        <span><span className="dot live" /> LIVE {counts.live}</span>
        <span><span className="dot cache" /> READY {counts.ready}</span>
        <span><span className="dot scenario" /> PLANNED {counts.planned}</span>
        <span><span className="dot unavailable" /> RESEARCH {counts.research}</span>
        {counts.stub > 0 && <span><span className="dot unavailable" /> STUB {counts.stub}</span>}
      </div>

      {/* Runtime adapter health — distinguish "configured live" from "actually working" */}
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

      <div className="modal-standards">
        <header className="catalog-section-head">
          <span className="lcars-bar" />
          <h3 className="eyebrow">FRAMEWORK ALIGNMENT</h3>
        </header>
        <div className="standards-grid">
          <div className="standard-card">
            <div className="standard-title">UNDP · JTC</div>
            <div className="standard-subtitle">Digital Twins for Cities, Jul 2025</div>
            <div className="standard-badge">LEVEL 2 — INFORMATIVE</div>
            <div className="standard-desc caption">
              Real-time multi-source feeds · 3D building fabric · Live sensor data ·
              Municipal ops dashboard · Citizen intelligence interface (ASK CTM).
              Next: Level 3 Predictive — wire twin_state time-series into trend models.
            </div>
          </div>
          <div className="standard-card">
            <div className="standard-title">ADB</div>
            <div className="standard-subtitle">Digital Twin Framework: A Practical Guide, May 2025</div>
            <div className="standard-badge">DIGITAL TWIN LITE · 4/5 FOUNDATIONS</div>
            <div className="standard-desc caption">
              ✓ F1 Data flow (AIS · weather · CCTV · GISTDA · news) ·
              ✓ F2 Dynamic 3D representation (20K buildings · satellite · vector layers) ·
              ✓ F3 Purpose-built (municipal ops + mayor's desk) ·
              ✓ F4 Continuous updates (3-min to 6-hr refresh per source) ·
              ◯ F5 Maturing insights — twin_state DB foundation ready, predictive models pending.
            </div>
          </div>
        </div>
      </div>

      {grouped.map(([cat, items]) => (
        <section key={cat} className="catalog-section">
          <header className="catalog-section-head">
            <span className="lcars-bar" />
            <h3 className="eyebrow">{CATEGORY_LABEL[cat]} · {cat}</h3>
            <span className="caption num">{items.length}</span>
          </header>
          <ul className="catalog-list">
            {items.map((s) => {
              const adapter = adapterNameFor(s.apiPath);
              const h = adapter ? healthByAdapter.get(adapter) : null;
              const isMissingKey = h?.lastErrorMessage?.startsWith("Missing ") ?? false;
              return (
                <li key={s.id} className="catalog-row">
                  <span className="catalog-status" style={{ background: STATUS_COLOR[s.status] }}>
                    {s.status.toUpperCase()}
                  </span>
                  <div className="catalog-row__main">
                    <div className="catalog-title">
                      <strong>{s.label}</strong>
                      <span className="caption">· {s.vendor}</span>
                      {h && h.status !== "healthy" && h.status !== "unknown" && (
                        <span
                          className={`caption catalog-row__health ${h.status === "down" ? "data-age--crit" : "data-age--warn"}`}
                          title={h.lastErrorMessage ?? `Adapter status: ${h.status}`}
                        >
                          {isMissingKey ? `⚠ KEY MISSING${s.keyEnv ? ` · ${s.keyEnv}` : ""}` : `⚠ ${h.status.toUpperCase()}`}
                        </span>
                      )}
                    </div>
                    <div className="caption catalog-row__desc">{s.describe}</div>
                    <div className="catalog-meta caption">
                      {s.apiPath && <span>api {s.apiPath}</span>}
                      {s.endpoint && !s.apiPath && <span>upstream {s.endpoint.replace(/^https?:\/\//, "").slice(0, 56)}</span>}
                      {s.pollSeconds && <span>poll {s.pollSeconds}s</span>}
                      {s.keyEnv && <span>key {s.keyEnv}</span>}
                      {h && h.consecutiveFailures > 0 && (
                        <span className="catalog-row__fail">
                          {h.consecutiveFailures} consec. {h.consecutiveFailures === 1 ? "failure" : "failures"}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Dialog>
  );
}
