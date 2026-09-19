/**
 * CvGaugePanel — what the water cameras see.
 *
 * The 30 WL cameras stare at canals with wooden staff gauges but no telemetry.
 * The browser gauge watch (gaugeWatch.ts) reads pooled stills and posts
 * `water-rising` cv-events when the line climbs. This panel lists the recent
 * ones — the fastest signal the city has where sensors don't exist.
 *
 * Honest by construction: experimental badge, daylight-only note, and the
 * watch only analyses frames the CCTV wall already captured (open CCTV mode
 * to feed it).
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PanelHeader } from "./PanelHeader";
import type { CctvCamera } from "../map/layers";
import type { CvDetectionEvent, FallbackTier } from "@nst/shared";
import { GAUGE_EVENT_CLASS, getSweepStats, subscribeSweepStats } from "../lib/gaugeWatch";

interface Props {
  cameras: CctvCamera[];
  apiBase: string;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

interface EventsPayload {
  events?: CvDetectionEvent[];
  count?: number;
}

const POLL_MS = 5 * 60_000;
const PREVIEW = 8;

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (!Number.isFinite(mins)) return "—";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export function CvGaugePanel({ cameras, apiBase, ageMinutes, fallbackTier }: Props) {
  const [events, setEvents] = useState<CvDetectionEvent[]>([]);
  const [showAll, setShowAll] = useState(false);
  const sweep = useSyncExternalStore(subscribeSweepStats, getSweepStats, getSweepStats);

  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cameras) m.set(c.id, c.name);
    return m;
  }, [cameras]);

  const wlCount = useMemo(
    () => cameras.filter((c) => (c.category ?? "other") === "water" && c.status !== "offline").length,
    [cameras],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/cctv/cv-events?class=${encodeURIComponent(GAUGE_EVENT_CLASS)}&limit=30`,
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as EventsPayload;
        if (!cancelled && Array.isArray(json.events)) setEvents(json.events);
      } catch {
        /* silent — panel keeps its last good list */
      }
    };
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [apiBase]);

  const rows = showAll ? events : events.slice(0, PREVIEW);

  return (
    <section className="panel" aria-label="CCTV water gauges">
      <PanelHeader
        title="CCTV GAUGES"
        source="cv-gauge · experimental"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      <p className="stat-line">
        <span className="stat-line__value num">{events.length}</span>
        <span className="stat-line__label">
          rises recorded · {wlCount} water cameras online · daylight only
        </span>
      </p>
      {/* What the watch actually did — never imply coverage it doesn't have. */}
      <p className="note">
        {sweep.at === 0
          ? "Not running yet: it only reads stills the CCTV wall has captured (open CCTV mode in daylight)."
          : `Last check ${timeAgo(new Date(sweep.at).toISOString())}: ${sweep.analysed} frame${sweep.analysed === 1 ? "" : "s"} read, ` +
            `${sweep.confident} with a clear water line` +
            `${sweep.unreadable + sweep.undecodable > 0 ? `, ${sweep.unreadable + sweep.undecodable} unreadable` : ""}. ` +
            "Several water cameras watch streets, not canals; experimental, trend only."}
      </p>
      {events.length === 0 && (
        <p className="note">
          No rises recorded. Events are held in server memory and can be missed
          across servers; do not rely on this panel alone.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <ul className="row-list">
            {rows.map((e, i) => (
              <li key={`${e.cameraId}-${e.timestamp}-${i}`}>
                <span className="row-btn" role="listitem">
                  <span className="status-glyph status-glyph--watch" aria-hidden="true" />
                  <span className="row-btn__name" lang="th">
                    {names.get(e.cameraId) ?? e.cameraId}
                  </span>
                  <span className="row-btn__meta">
                    rising · {timeAgo(e.timestamp)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {events.length > PREVIEW && (
            <button type="button" className="btn btn--quiet" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${events.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
