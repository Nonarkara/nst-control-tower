/**
 * FlightsPanel — FIDS board for NST (Nakhon Si Thammarat) airport (IATA: NST · ICAO: VTSF).
 *
 * Data source: AirLabs /schedules endpoint (AIRLABS_API_KEY env var, free 1,000 req/month).
 * When the key is absent the panel shows a setup note rather than a blank panel.
 *
 * Primary routes: Thai AirAsia FD & Nok Air DD between DMK and NST.
 */

import { useState } from "react";
import { PanelHeader } from "./PanelHeader";
import { ago } from "../lib/time";
import type { FlightFids, FallbackTier } from "@nst/shared";

interface Props {
  flights: FlightFids[];
  loading: boolean;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  note?: string;
}

type Tab = "arrivals" | "departures";

// Status → colour + short label
const STATUS_STYLE: Record<FlightFids["status"], { color: string; label: string }> = {
  scheduled: { color: "var(--text-3)",  label: "SCHED" },
  active:    { color: "var(--accent)",  label: "EN ROUTE" },
  landed:    { color: "var(--good)",    label: "LANDED" },
  cancelled: { color: "var(--bad)",     label: "CXLD" },
  unknown:   { color: "var(--text-3)",  label: "—" },
};

// Airline IATA → short colour code for the badge
const AIRLINE_COLOR: Record<string, string> = {
  FD: "#e8000d",  // AirAsia red
  DD: "#f36f21",  // Nok Air orange
  SL: "#f0af00",  // Lion Air yellow
  TG: "#6a0dad",  // Thai purple
  PG: "#003087",  // Bangkok Air navy
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
  if (minutes == null || minutes <= 0) return null;
  return (
    <span
      className="mono"
      style={{
        fontSize: "0.6rem",
        color: minutes >= 30 ? "var(--bad)" : "var(--warn)",
        marginLeft: 3,
      }}
    >
      +{minutes}m
    </span>
  );
}

function AirlineBadge({ iata }: { iata: string }) {
  const bg = AIRLINE_COLOR[iata] ?? "var(--ink-mid)";
  return (
    <span
      className="mono"
      style={{
        background: bg,
        color: "#fff",
        padding: "1px 5px",
        fontSize: "0.6rem",
        letterSpacing: "0.05em",
        borderRadius: 2,
        flexShrink: 0,
      }}
    >
      {iata}
    </span>
  );
}

function FlightRow({ f }: { f: FlightFids }) {
  const st = STATUS_STYLE[f.status];
  const displayTime = f.actualTime ?? f.estimatedTime ?? f.scheduledTime;
  const isDelayed = (f.delayMinutes ?? 0) > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        alignItems: "center",
        gap: 6,
        padding: "5px 0",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      {/* Time */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          className="mono"
          style={{
            fontSize: "0.78rem",
            color: isDelayed ? "var(--warn)" : "var(--ink)",
            fontWeight: 600,
          }}
        >
          {fmtTime(displayTime)}
        </span>
        {f.scheduledTime !== displayTime && (
          <span className="mono" style={{ fontSize: "0.6rem", color: "var(--text-3)", textDecoration: "line-through" }}>
            {fmtTime(f.scheduledTime)}
          </span>
        )}
      </div>

      {/* Flight info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <AirlineBadge iata={f.airlineIata} />
          <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            {f.flightNumber}
          </span>
          <DelayBadge minutes={f.delayMinutes} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: "var(--size-eyebrow)", color: "var(--text-2)" }}>
            {f.direction === "arrival" ? "from" : "to"}{" "}
            <strong>{f.otherName}</strong>
          </span>
          {f.gate && (
            <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>
              Gate {f.gate}
            </span>
          )}
          {f.baggage && (
            <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>
              Belt {f.baggage}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{ textAlign: "right" }}>
        <span
          className="eyebrow mono"
          style={{ color: st.color, fontWeight: f.status === "landed" || f.status === "active" ? 700 : 400 }}
        >
          {st.label}
        </span>
      </div>
    </div>
  );
}

export function FlightsPanel({ flights, loading, ageMinutes, fallbackTier, note }: Props) {
  const [tab, setTab] = useState<Tab>("departures");

  const arrivals   = flights.filter((f) => f.direction === "arrival");
  const departures = flights.filter((f) => f.direction === "departure");
  const shown      = tab === "arrivals" ? arrivals : departures;

  // Active flight alert
  const active = flights.filter((f) => f.status === "active");

  if (loading && flights.length === 0) {
    return (
      <div className="col">
        <div className="eyebrow">NST AIRPORT // FIDS</div>
        <div className="skeleton" style={{ height: 12, marginTop: 8 }} />
        <div className="skeleton" style={{ height: 12, marginTop: 6, width: "70%" }} />
      </div>
    );
  }

  return (
    <div className="col" style={{ gap: 8 }}>
      <PanelHeader
        title="NST AIRPORT // FIDS"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="airlabs · IATA:NST"
        actions={
          active.length > 0 ? (
            <span className="eyebrow mono" style={{ color: "var(--accent)" }}>
              ✈ {active.length} EN ROUTE
            </span>
          ) : undefined
        }
      />

      {/* No-key state */}
      {fallbackTier === "unavailable" && note && (
        <div style={{ fontSize: "var(--size-eyebrow)", color: "var(--text-3)", lineHeight: 1.5 }}>
          {note.includes("AIRLABS_API_KEY") ? (
            <>
              Set <code style={{ color: "var(--accent)" }}>AIRLABS_API_KEY</code> in the API env
              to enable live flight board. Free registration at{" "}
              <a href="https://airlabs.co" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                airlabs.co
              </a>{" "}
              (1,000 req/month free).
            </>
          ) : (
            note
          )}
        </div>
      )}

      {/* Tab bar */}
      {(arrivals.length > 0 || departures.length > 0) && (
        <div style={{ display: "flex", gap: 4 }}>
          {(["departures", "arrivals"] as Tab[]).map((t) => {
            const count = t === "arrivals" ? arrivals.length : departures.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="eyebrow mono"
                style={{
                  background: tab === t ? "var(--ink)" : "transparent",
                  color: tab === t ? "var(--ground)" : "var(--text-3)",
                  border: `1px solid ${tab === t ? "var(--ink)" : "var(--line)"}`,
                  padding: "2px 7px",
                  cursor: "pointer",
                  fontSize: "0.62rem",
                  letterSpacing: "0.05em",
                }}
              >
                {t === "departures" ? "✈ DEP" : "✈ ARR"} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Flight rows */}
      {shown.length > 0 ? (
        <div>
          {shown.map((f) => (
            <FlightRow key={`${f.flightNumber}-${f.scheduledTime}`} f={f} />
          ))}
        </div>
      ) : flights.length > 0 ? (
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          No {tab} scheduled today.
        </div>
      ) : null}

      {/* Last updated */}
      {ageMinutes != null && flights.length > 0 && (
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          Updated {ageMinutes < 2 ? "just now" : `${Math.round(ageMinutes)} min ago`} ·
          VTSF · Nakhon Si Thammarat Airport
        </div>
      )}
    </div>
  );
}
