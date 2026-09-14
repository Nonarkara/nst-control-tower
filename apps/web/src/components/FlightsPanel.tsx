/**
 * FlightsPanel — FIDS board for NST (Nakhon Si Thammarat) airport (IATA: NST · ICAO: VTSF).
 *
 * Data source: AirLabs /schedules endpoint (AIRLABS_API_KEY env var, free 1,000 req/month).
 * When the key is absent the panel shows a setup note rather than a blank panel.
 *
 * Primary routes: Thai AirAsia FD & Nok Air DD between DMK and NST.
 */

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { PanelHeader } from "./PanelHeader";
import type { FlightFids, FallbackTier } from "@nst/shared";
import type { StatusLevel } from "../lib/status";
import { StatusText, delayStatus } from "../lib/cityStatus";

interface Props {
  flights: FlightFids[];
  loading: boolean;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  note?: string;
}

type Tab = "arrivals" | "departures";
const TABS: Tab[] = ["departures", "arrivals"];

// Status → label; only landed / cancelled carry a status colour (with glyph).
const STATUS_STYLE: Record<FlightFids["status"], { label: string; level: StatusLevel | null; quiet?: boolean }> = {
  scheduled: { label: "SCHED", level: null, quiet: true },
  active:    { label: "EN ROUTE", level: null },
  landed:    { label: "LANDED", level: "normal" },
  cancelled: { label: "CXLD", level: "critical" },
  unknown:   { label: "—", level: null, quiet: true },
};

// Airline IATA → brand swatch token (a key beside the code, never a text colour)
const AIRLINE_COLOR: Record<string, string> = {
  FD: "var(--airline-fd)",  // AirAsia red
  DD: "var(--airline-dd)",  // Nok Air orange
  SL: "var(--airline-sl)",  // Lion Air yellow
  TG: "var(--airline-tg)",  // Thai purple
  PG: "var(--airline-pg)",  // Bangkok Air navy
};

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("th-TH", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
    });
  } catch {
    return "—";
  }
}

function DelayBadge({ minutes }: { minutes: number | null }) {
  const level = delayStatus(minutes);
  if (!level) return null;
  return (
    <StatusText level={level}>
      <span className="num">+{minutes}m</span>
      <span className="visually-hidden"> delay</span>
    </StatusText>
  );
}

function AirlineBadge({ iata }: { iata: string }) {
  const style = { "--airline": AIRLINE_COLOR[iata] ?? "var(--ink-3)" } as CSSProperties;
  return (
    <span className="fids-airline" style={style}>
      <span className="swatch" aria-hidden="true" />
      {iata}
    </span>
  );
}

function FlightRow({ f }: { f: FlightFids }) {
  const st = STATUS_STYLE[f.status];
  const displayTime = f.actualTime ?? f.estimatedTime ?? f.scheduledTime;

  return (
    <li className="fids-row">
      <span className="fids-time">
        <span className="fids-time__now num">{fmtTime(displayTime)}</span>
        {f.scheduledTime !== displayTime && (
          <span className="fids-time__sched num">
            <span className="visually-hidden">scheduled </span>
            {fmtTime(f.scheduledTime)}
          </span>
        )}
      </span>

      <span className="fids-info">
        <span className="fids-flight">
          <AirlineBadge iata={f.airlineIata} />
          <span className="fids-flight__no num">{f.flightNumber}</span>
          <DelayBadge minutes={f.delayMinutes} />
        </span>
        <span className="fids-route">
          {f.direction === "arrival" ? "from" : "to"} <strong>{f.otherName}</strong>
          {f.gate && <> · Gate {f.gate}</>}
          {f.baggage && <> · Belt {f.baggage}</>}
        </span>
      </span>

      <span className="fids-state">
        {st.level ? (
          <StatusText level={st.level}>{st.label}</StatusText>
        ) : (
          <span className={`fids-state__plain${st.quiet ? " fids-state__plain--quiet" : ""}`}>{st.label}</span>
        )}
      </span>
    </li>
  );
}

export function FlightsPanel({ flights, loading, ageMinutes, fallbackTier, note }: Props) {
  const [tab, setTab] = useState<Tab>("departures");
  const baseId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ arrivals: null, departures: null });

  const arrivals   = flights.filter((f) => f.direction === "arrival");
  const departures = flights.filter((f) => f.direction === "departure");
  const shown      = tab === "arrivals" ? arrivals : departures;

  // Active flight alert
  const active = flights.filter((f) => f.status === "active");

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.indexOf(tab);
    let next: Tab | null = null;
    if (e.key === "ArrowRight") next = TABS[(i + 1) % TABS.length]!;
    else if (e.key === "ArrowLeft") next = TABS[(i - 1 + TABS.length) % TABS.length]!;
    else if (e.key === "Home") next = TABS[0]!;
    else if (e.key === "End") next = TABS[TABS.length - 1]!;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  if (loading && flights.length === 0) {
    return (
      <section className="panel" aria-label="NST airport flights" aria-busy="true">
        <PanelHeader title="NST AIRPORT // FIDS" fallbackTier={fallbackTier} source="airlabs · IATA:NST" />
        <span className="skeleton pc-skeleton" />
        <span className="skeleton pc-skeleton pc-skeleton--short" />
      </section>
    );
  }

  return (
    <section className="panel" aria-label="NST airport flights">
      <PanelHeader
        title="NST AIRPORT // FIDS"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="airlabs · IATA:NST"
        actions={
          active.length > 0 ? (
            <span className="pc-meta">
              <span aria-hidden="true">✈ </span>
              <span className="num">{active.length}</span> en route
            </span>
          ) : undefined
        }
      />

      {/* No-key state */}
      {fallbackTier === "unavailable" && note && (
        <p className="note">
          {note.includes("AIRLABS_API_KEY") ? (
            <>
              Set <code className="fids-code">AIRLABS_API_KEY</code> in the API env
              to enable live flight board. Free registration at{" "}
              <a className="link" href="https://airlabs.co" target="_blank" rel="noreferrer">
                airlabs.co
              </a>{" "}
              (1,000 req/month free).
            </>
          ) : (
            note
          )}
        </p>
      )}

      {/* Tab bar */}
      {(arrivals.length > 0 || departures.length > 0) && (
        <div role="tablist" aria-label="Flight direction" className="pc-tabs">
          {TABS.map((t) => {
            const count = t === "arrivals" ? arrivals.length : departures.length;
            const selected = tab === t;
            return (
              <button
                key={t}
                ref={(el) => { tabRefs.current[t] = el; }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${t}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t)}
                onKeyDown={onTabKey}
                className="pc-tab"
              >
                {t === "departures" ? "Departures" : "Arrivals"} <span className="num">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Flight rows */}
      {flights.length > 0 && (
        <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${tab}`}>
          {shown.length > 0 ? (
            <ul className="pc-list">
              {shown.map((f) => (
                <FlightRow key={`${f.flightNumber}-${f.scheduledTime}`} f={f} />
              ))}
            </ul>
          ) : (
            <p className="note">No {tab} scheduled today.</p>
          )}
        </div>
      )}

      {/* Last updated */}
      {ageMinutes != null && flights.length > 0 && (
        <p className="pc-meta">
          Updated {ageMinutes < 2 ? "just now" : `${Math.round(ageMinutes)} min ago`} ·
          VTSF · Nakhon Si Thammarat Airport
        </p>
      )}
    </section>
  );
}
