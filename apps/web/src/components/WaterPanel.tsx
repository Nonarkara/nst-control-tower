/**
 * WaterPanel — comprehensive real-time water monitoring for NST.
 *
 * Three sections shown inline (no tabs, panel scrolls):
 *   1. River Gauges  — 26 telemetry stations from HII ThaiWater, 10-min updates,
 *                      colour-coded by situation_level (5=overbank/flood).
 *   2. Reservoirs    — RID + data.go.th reservoir levels (% capacity, volume).
 *   3. Rainfall      — 24h accumulation across 130 NST stations from ThaiWater.
 *
 * Pak Phanang basin framing: flooding here is uncontrolled monsoon runoff
 * from Khao Luang → Tha Dee canal → city. No regulating dam. The gauge
 * situation_level is the primary leading indicator.
 */

import { useState } from "react";
import { PanelHeader } from "./PanelHeader";
import type { WaterGauge, RainfallStation, RidReservoir, FallbackTier } from "@nst/shared";
import { alertLevel } from "../lib/water";

export interface ReservoirStatus {
  name: string;
  district: string;
  capacityPct: number | null;
  currentVolMCM: number | null;
  maxVolMCM: number | null;
  daysRemaining: number | null;
  rainfallYesterdayMm: number | null;
  trend: "rising" | "falling" | "stable";
}

interface Props {
  reservoirs: ReservoirStatus[];
  ridReservoirs: RidReservoir[];
  waterGauges: WaterGauge[];
  waterRain: RainfallStation[];
  loading: boolean;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

// situation_level → CSS colour token
const SIT_COLOR: Record<number, string> = {
  5: "var(--bad)",    // overbank / flood
  4: "var(--warn)",   // high water
  3: "var(--good)",   // normal
  2: "var(--data)",   // low
  1: "var(--bad)",    // critical drought
};

// situation_level → short English label
const SIT_LABEL: Record<number, string> = {
  5: "FLOOD",
  4: "HIGH",
  3: "OK",
  2: "LOW",
  1: "DROUGHT",
};

const TREND_ARROW: Record<WaterGauge["trend"], string> = {
  rising: "↑",
  falling: "↓",
  stable: "—",
};

const TREND_COL: Record<WaterGauge["trend"], string> = {
  rising: "var(--bad)",
  falling: "var(--data)",
  stable: "var(--text-3)",
};

type Tab = "gauges" | "reservoirs" | "rain";

function Bar({ pct, color }: { pct: number | null; color: string }) {
  const w = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div style={{ height: 3, background: "var(--line)", position: "relative", marginTop: 2 }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${w}%`, background: color }} />
    </div>
  );
}

// ─── Gauge section ───────────────────────────────────────────────────────────

function GaugeRow({ g }: { g: WaterGauge }) {
  const col = SIT_COLOR[g.situationLevel] ?? "var(--text-3)";
  const warningPct = g.warningMsl && g.levelMsl != null
    ? Math.min(100, Math.max(0, (g.levelMsl / g.warningMsl) * 100))
    : null;
  const shortName = g.name.replace(/^สถานีโทรมาตร\s*/u, "").replace(/สถานีวัดน้ำ\s*/u, "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <div className="spread" style={{ alignItems: "center", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flex: 1 }}>
          <span style={{ color: TREND_COL[g.trend], fontFamily: "var(--font-mono)", fontSize: "var(--size-eyebrow)", flexShrink: 0 }}>
            {TREND_ARROW[g.trend]}
          </span>
          <span style={{ fontSize: "var(--size-eyebrow)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shortName || g.name}
          </span>
          {g.isKeyStation && (
            <span style={{ fontSize: "0.6rem", color: "var(--accent)", flexShrink: 0 }}>★</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {g.levelMsl != null && (
            <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>
              {g.levelMsl.toFixed(2)} m
            </span>
          )}
          <span className="eyebrow mono" style={{ color: col, fontWeight: 700 }}>
            {SIT_LABEL[g.situationLevel]}
          </span>
        </div>
      </div>
      {warningPct != null && (
        <Bar pct={warningPct} color={col} />
      )}
      {g.diffFromBank != null && (
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          {g.diffFromBank >= 0
            ? `${g.diffFromBank.toFixed(2)} m above bank`
            : `${Math.abs(g.diffFromBank).toFixed(2)} m below bank`}
          {g.amphoe ? ` · ${g.amphoe}` : ""}
        </div>
      )}
    </div>
  );
}

function GaugesSection({ gauges }: { gauges: WaterGauge[] }) {
  const [showAll, setShowAll] = useState(false);

  if (gauges.length === 0) {
    return (
      <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
        ── ไม่มีข้อมูลสถานี ── no gauge data
      </div>
    );
  }

  const atRisk = gauges.filter((g) => g.situationLevel >= 4);
  const normal = gauges.filter((g) => g.situationLevel < 4);
  const displayNormal = showAll ? normal : normal.slice(0, 5);

  const worstSit = Math.max(...gauges.map((g) => g.situationLevel));
  const worstColor = SIT_COLOR[worstSit] ?? "var(--text-3)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Status bar */}
      <div className="spread" style={{ alignItems: "center" }}>
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          {gauges.length} สถานี · {gauges.filter((g) => g.isKeyStation).length} key
        </div>
        <div className="eyebrow mono" style={{ color: worstColor, fontWeight: 700 }}>
          WORST: {SIT_LABEL[worstSit]}
        </div>
      </div>

      {/* At-risk stations (situation 4–5) */}
      {atRisk.length > 0 && (
        <div style={{
          border: `1px solid ${worstSit >= 5 ? "var(--bad)" : "var(--warn)"}`,
          padding: "6px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}>
          <div className="eyebrow mono" style={{ color: worstSit >= 5 ? "var(--bad)" : "var(--warn)" }}>
            {worstSit >= 5 ? "⚠ OVERBANK / น้ำล้นตลิ่ง" : "⚠ HIGH WATER / น้ำมาก"}
          </div>
          {atRisk.map((g) => <GaugeRow key={g.id} g={g} />)}
        </div>
      )}

      {/* Normal stations */}
      {displayNormal.map((g) => <GaugeRow key={g.id} g={g} />)}

      {normal.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="eyebrow mono"
          style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
        >
          {showAll ? "▲ show less" : `▼ +${normal.length - 5} more stations`}
        </button>
      )}

      <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
        SOURCE · HII ThaiWater · api-v3.thaiwater.net · province 80
      </div>
    </div>
  );
}

// ─── Reservoir section ────────────────────────────────────────────────────────

function ReservoirSection({ reservoirs, ridReservoirs }: { reservoirs: ReservoirStatus[]; ridReservoirs: RidReservoir[] }) {
  const LEVEL_COLOR = {
    critical: "var(--bad)",
    low:      "var(--warn)",
    watch:    "var(--accent)",
    ok:       "var(--good)",
  };

  if (reservoirs.length === 0 && ridReservoirs.length === 0) {
    return <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>── no reservoir data</div>;
  }

  // Province total from datago source
  const totalCurrent = reservoirs.reduce((s, r) => s + (r.currentVolMCM ?? 0), 0);
  const totalMax     = reservoirs.reduce((s, r) => s + (r.maxVolMCM ?? 0), 0);
  const totalPct     = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {totalPct != null && (
        <div>
          <div className="spread" style={{ alignItems: "center" }}>
            <div className="eyebrow">PROVINCE TOTAL</div>
            <div className="eyebrow mono" style={{ color: totalPct < 30 ? "var(--warn)" : "var(--data)" }}>
              {totalPct}%
            </div>
          </div>
          <Bar pct={totalPct} color={totalPct < 30 ? "var(--warn)" : "var(--good)"} />
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {totalCurrent.toFixed(1)} / {totalMax.toFixed(1)} MCM
          </div>
        </div>
      )}

      {/* datago reservoirs */}
      {reservoirs.map((r) => {
        const level = alertLevel(r.daysRemaining);
        const col = LEVEL_COLOR[level];
        const name = r.name.replace(/อ่างเก็บน้ำ/g, "").replace(/อ่างเก้บน้ำ/g, "").trim();
        const arrow = r.trend === "rising" ? "↑" : r.trend === "falling" ? "↓" : "—";
        return (
          <div key={r.name} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div className="spread" style={{ alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: col, fontFamily: "var(--font-mono)", fontSize: "var(--size-eyebrow)" }}>{arrow}</span>
                <span style={{ fontSize: "var(--size-eyebrow)" }}>{name}</span>
              </span>
              <span className="eyebrow mono" style={{ color: col }}>
                {r.capacityPct != null ? `${r.capacityPct.toFixed(0)}%` : "—"}
                {r.daysRemaining != null ? ` · ${r.daysRemaining}d` : ""}
              </span>
            </div>
            <Bar pct={r.capacityPct} color={col} />
          </div>
        );
      })}

      {/* RID reservoirs (deduped by id) */}
      {ridReservoirs.map((r) => {
        const pct = r.storagePct ?? null;
        const col = pct == null ? "var(--text-3)" : pct > 90 ? "var(--bad)" : pct > 70 ? "var(--warn)" : pct > 40 ? "var(--good)" : "var(--data)";
        const name = r.name.replace(/^อ่างเก็บน้ำ\s*/u, "").replace(/^อ่างเก้บน้ำ\s*/u, "").trim();
        return (
          <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div className="spread" style={{ alignItems: "center" }}>
              <span className="eyebrow" style={{ fontSize: "var(--size-eyebrow)" }}>{name}</span>
              <span className="eyebrow mono" style={{ color: col }}>
                {pct != null ? `${pct.toFixed(0)}%` : "—"}
                {r.volumeMcm != null ? ` · ${r.volumeMcm.toFixed(1)} MCM` : ""}
              </span>
            </div>
            <Bar pct={pct} color={col} />
            {(r.inflowMcm != null || r.outflowMcm != null) && (
              <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                {r.inflowMcm != null ? `in ${r.inflowMcm.toFixed(2)}` : ""}
                {r.inflowMcm != null && r.outflowMcm != null ? " / " : ""}
                {r.outflowMcm != null ? `out ${r.outflowMcm.toFixed(2)} MCM/d` : ""}
              </div>
            )}
          </div>
        );
      })}

      <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
        SOURCE · data.go.th · RID กรมชลประทาน · app.rid.go.th
      </div>
    </div>
  );
}

// ─── Rainfall section ─────────────────────────────────────────────────────────

function RainfallSection({ rain }: { rain: RainfallStation[] }) {
  const [showAll, setShowAll] = useState(false);
  if (rain.length === 0) {
    return <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>── no rainfall data</div>;
  }

  const withRain = rain.filter((r) => (r.rain24h ?? 0) > 0);
  const totalStations = rain.length;
  const maxRain = Math.max(...rain.map((r) => r.rain24h ?? 0));
  const totalRain24h = rain.reduce((s, r) => s + (r.rain24h ?? 0), 0) / totalStations;
  const display = showAll ? withRain : withRain.slice(0, 8);

  function rainColor(mm: number | null): string {
    if (mm == null) return "var(--text-3)";
    if (mm > 90) return "var(--bad)";
    if (mm > 35) return "var(--warn)";
    if (mm > 10) return "var(--data)";
    return "var(--good)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div className="spread" style={{ alignItems: "center" }}>
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          {totalStations} สถานี · avg {totalRain24h.toFixed(1)} mm/24h
        </div>
        <div className="eyebrow mono" style={{ color: rainColor(maxRain) }}>
          MAX {maxRain.toFixed(1)} mm
        </div>
      </div>

      {withRain.length === 0 && (
        <div className="eyebrow mono" style={{ color: "var(--good)" }}>ไม่มีฝน — no rain across all {totalStations} stations</div>
      )}

      {display.map((r) => {
        const col = rainColor(r.rain24h);
        const barPct = maxRain > 0 ? ((r.rain24h ?? 0) / maxRain) * 100 : 0;
        const name = r.name.replace(/^สถานีโทรมาตร\s*/u, "").replace(/สถานีวัดน้ำ\s*/u, "");
        return (
          <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div className="spread" style={{ alignItems: "center" }}>
              <span style={{ fontSize: "var(--size-eyebrow)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {name || r.name}
              </span>
              <span className="eyebrow mono" style={{ color: col, flexShrink: 0 }}>
                {r.rain24h?.toFixed(1)} mm
                {r.rain1h != null && r.rain1h > 0 ? ` · ${r.rain1h.toFixed(1)}/h` : ""}
              </span>
            </div>
            <Bar pct={barPct} color={col} />
            {r.amphoe && (
              <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>{r.amphoe}</div>
            )}
          </div>
        );
      })}

      {withRain.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="eyebrow mono"
          style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
        >
          {showAll ? "▲ show less" : `▼ +${withRain.length - 8} more stations`}
        </button>
      )}

      <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
        SOURCE · HII ThaiWater · ฝน 24 ชม. · province 80
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function WaterPanel({
  reservoirs, ridReservoirs, waterGauges, waterRain, loading, ageMinutes, fallbackTier,
}: Props) {
  const [tab, setTab] = useState<Tab>("gauges");

  if (loading && waterGauges.length === 0 && reservoirs.length === 0) {
    return (
      <div className="col">
        <div className="eyebrow">WATER MONITORING // NST</div>
        <div className="skeleton" style={{ height: 12, marginTop: 8 }} />
        <div className="skeleton" style={{ height: 12, marginTop: 6, width: "80%" }} />
      </div>
    );
  }

  const worstSit = waterGauges.length > 0
    ? Math.max(...waterGauges.map((g) => g.situationLevel))
    : null;
  const atRiskCount = waterGauges.filter((g) => g.situationLevel >= 4).length;

  const TABS: { id: Tab; label: string; badge?: number | null }[] = [
    { id: "gauges",     label: "GAUGES",      badge: waterGauges.length || null },
    { id: "reservoirs", label: "อ่างเก็บน้ำ",  badge: (reservoirs.length + ridReservoirs.length) || null },
    { id: "rain",       label: "RAINFALL",    badge: waterRain.filter((r) => (r.rain24h ?? 0) > 0).length || null },
  ];

  return (
    <div className="col" style={{ gap: 8 }}>
      <PanelHeader
        title="WATER MONITORING // NST"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater·rid·datago"
        actions={
          worstSit != null && worstSit >= 4 ? (
            <span
              className="eyebrow mono"
              style={{ color: worstSit >= 5 ? "var(--bad)" : "var(--warn)", fontWeight: 700 }}
            >
              ⚠ {atRiskCount} STATIONS HIGH
            </span>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="eyebrow mono"
            style={{
              background: tab === t.id ? "var(--ink)" : "transparent",
              color: tab === t.id ? "var(--ground)" : "var(--text-3)",
              border: `1px solid ${tab === t.id ? "var(--ink)" : "var(--line)"}`,
              padding: "2px 7px",
              cursor: "pointer",
              fontSize: "0.62rem",
              letterSpacing: "0.05em",
            }}
          >
            {t.label}{t.badge != null ? ` (${t.badge})` : ""}
          </button>
        ))}
      </div>

      {tab === "gauges" && <GaugesSection gauges={waterGauges} />}
      {tab === "reservoirs" && <ReservoirSection reservoirs={reservoirs} ridReservoirs={ridReservoirs} />}
      {tab === "rain" && <RainfallSection rain={waterRain} />}
    </div>
  );
}
