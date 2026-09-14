/**
 * WaterPanel — comprehensive real-time water monitoring for NST.
 *
 * Three tabbed sections:
 *   1. River Gauges  — 26 telemetry stations from HII ThaiWater, 10-min updates,
 *                      status by situation_level (5=overbank/flood).
 *   2. Reservoirs    — RID + data.go.th reservoir levels (% capacity, volume).
 *   3. Rainfall      — 24h accumulation across 130 NST stations from ThaiWater.
 *
 * Pak Phanang basin framing: flooding here is uncontrolled monsoon runoff
 * from Khao Luang → Tha Dee canal → city. No regulating dam. The gauge
 * situation_level is the primary leading indicator.
 */

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { PanelHeader } from "./PanelHeader";
import { MixedText } from "./MixedText";
import type { WaterGauge, RainfallStation, RidReservoir, FallbackTier } from "@nst/shared";
import { alertLevel, rainStatus, reservoirStatus, situationStatus, storageStatus } from "../lib/water";
import { STATUS, type StatusLevel } from "../lib/status";

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

// situation_level → short English label (always shown beside the colour)
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

const GAUGE_PREVIEW = 5;
const RAIN_PREVIEW = 8;

type Tab = "gauges" | "reservoirs" | "rain";

function Bar({ pct, level }: { pct: number | null; level: StatusLevel }) {
  const w = Math.max(0, Math.min(100, pct ?? 0));
  const background = STATUS[level].color;
  return (
    <div className="flood-bar" aria-hidden="true">
      <div className="flood-bar__fill" style={{ width: `${w}%`, background }} />
    </div>
  );
}

function StatusWord({ level, children }: { level: StatusLevel; children: React.ReactNode }) {
  const st = STATUS[level];
  return (
    <span className="flood-status" style={{ color: st.color }}>
      <span aria-hidden="true">{st.glyph}</span>
      {children}
    </span>
  );
}

// ─── Gauge section ───────────────────────────────────────────────────────────

function GaugeRow({ g }: { g: WaterGauge }) {
  const level = situationStatus(g.situationLevel);
  const warningPct = g.warningMsl && g.levelMsl != null
    ? Math.min(100, Math.max(0, (g.levelMsl / g.warningMsl) * 100))
    : null;
  const shortName = g.name.replace(/^สถานีโทรมาตร\s*/u, "").replace(/สถานีวัดน้ำ\s*/u, "");
  return (
    <li className="flood-item">
      <div className="flood-row-head">
        <span className="water-name-group">
          <span className="water-trend" aria-hidden="true">{TREND_ARROW[g.trend]}</span>
          <span className="visually-hidden">{g.trend}, </span>
          <span className="flood-name" lang="th">{shortName || g.name}</span>
          {g.isKeyStation && (
            <span className="water-key">
              <span aria-hidden="true">★</span>
              <span className="visually-hidden"> key station</span>
            </span>
          )}
        </span>
        <span className="water-figures">
          {g.levelMsl != null && <span className="flood-meta num">{g.levelMsl.toFixed(2)} m</span>}
          <StatusWord level={level}>{SIT_LABEL[g.situationLevel] ?? STATUS.unknown.en}</StatusWord>
        </span>
      </div>
      {warningPct != null && <Bar pct={warningPct} level={level} />}
      {g.diffFromBank != null && (
        <p className="flood-meta">
          {g.diffFromBank >= 0
            ? `${g.diffFromBank.toFixed(2)} m above bank`
            : `${Math.abs(g.diffFromBank).toFixed(2)} m below bank`}
          {g.amphoe ? <> · <MixedText text={g.amphoe} /></> : ""}
        </p>
      )}
    </li>
  );
}

function GaugesSection({ gauges }: { gauges: WaterGauge[] }) {
  const [showAll, setShowAll] = useState(false);

  if (gauges.length === 0) {
    return (
      <p className="flood-empty">
        <span lang="th">ไม่มีข้อมูลสถานี</span> · no gauge data
      </p>
    );
  }

  const atRisk = gauges.filter((g) => g.situationLevel >= 4);
  const normal = gauges.filter((g) => g.situationLevel < 4);
  const displayNormal = showAll ? normal : normal.slice(0, GAUGE_PREVIEW);

  const worstSit = Math.max(...gauges.map((g) => g.situationLevel));
  const worstLevel = situationStatus(worstSit);
  const boxLevel: StatusLevel = worstSit >= 5 ? "critical" : "warning";

  return (
    <div className="flood-section">
      <div className="flood-row-head">
        <p className="flood-meta">
          {gauges.length} <span lang="th">สถานี</span> · {gauges.filter((g) => g.isKeyStation).length} key
        </p>
        <span className="flood-figure">
          <StatusWord level={worstLevel}>WORST: {SIT_LABEL[worstSit] ?? STATUS.unknown.en}</StatusWord>
        </span>
      </div>

      {atRisk.length > 0 && (
        <div className="water-alert-box" style={{ borderColor: STATUS[boxLevel].color }}>
          <p className="flood-label">
            <StatusWord level={boxLevel}>
              {worstSit >= 5 ? <>OVERBANK / <span lang="th">น้ำล้นตลิ่ง</span></> : <>HIGH WATER / <span lang="th">น้ำมาก</span></>}
            </StatusWord>
          </p>
          <ul className="flood-list">
            {atRisk.map((g) => <GaugeRow key={g.id} g={g} />)}
          </ul>
        </div>
      )}

      <ul className="flood-list">
        {displayNormal.map((g) => <GaugeRow key={g.id} g={g} />)}
      </ul>

      {normal.length > GAUGE_PREVIEW && (
        <button type="button" className="btn btn--quiet flood-more" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer stations" : `Show ${normal.length - GAUGE_PREVIEW} more stations`}
        </button>
      )}

      <p className="flood-footnote">SOURCE · HII ThaiWater · api-v3.thaiwater.net · province 80</p>
    </div>
  );
}

// ─── Reservoir section ────────────────────────────────────────────────────────

function ReservoirSection({ reservoirs, ridReservoirs }: { reservoirs: ReservoirStatus[]; ridReservoirs: RidReservoir[] }) {
  if (reservoirs.length === 0 && ridReservoirs.length === 0) {
    return <p className="flood-empty">No reservoir data</p>;
  }

  // Province total from datago source
  const totalCurrent = reservoirs.reduce((s, r) => s + (r.currentVolMCM ?? 0), 0);
  const totalMax     = reservoirs.reduce((s, r) => s + (r.maxVolMCM ?? 0), 0);
  const totalPct     = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : null;
  const totalLevel: StatusLevel = totalPct != null && totalPct < 30 ? "watch" : "normal";

  return (
    <div className="flood-section">
      {totalPct != null && (
        <div className="flood-item">
          <div className="flood-row-head">
            <span className="flood-label">Province total</span>
            <span className="flood-figure num">
              <StatusWord level={totalLevel}>{totalPct}%{totalLevel === "watch" ? " low" : ""}</StatusWord>
            </span>
          </div>
          <Bar pct={totalPct} level={totalLevel} />
          <p className="flood-meta num">{totalCurrent.toFixed(1)} / {totalMax.toFixed(1)} MCM</p>
        </div>
      )}

      <ul className="flood-list">
        {/* datago reservoirs */}
        {reservoirs.map((r) => {
          const level = reservoirStatus(alertLevel(r.daysRemaining));
          const name = r.name.replace(/อ่างเก็บน้ำ/g, "").replace(/อ่างเก้บน้ำ/g, "").trim();
          return (
            <li key={r.name} className="flood-item">
              <div className="flood-row-head">
                <span className="water-name-group">
                  <span className="water-trend" aria-hidden="true">{TREND_ARROW[r.trend]}</span>
                  <span className="visually-hidden">{r.trend}, </span>
                  <span className="flood-name" lang="th">{name}</span>
                </span>
                <span className="flood-figure num">
                  <StatusWord level={level}>
                    {r.capacityPct != null ? `${r.capacityPct.toFixed(0)}%` : "—"}
                    {r.daysRemaining != null ? ` · ${r.daysRemaining}d` : ""}
                  </StatusWord>
                  <span className="visually-hidden"> {STATUS[level].en}</span>
                </span>
              </div>
              <Bar pct={r.capacityPct} level={level} />
            </li>
          );
        })}

        {/* RID reservoirs (deduped by id) */}
        {ridReservoirs.map((r) => {
          const pct = r.storagePct ?? null;
          const level = storageStatus(pct);
          const name = r.name.replace(/^อ่างเก็บน้ำ\s*/u, "").replace(/^อ่างเก้บน้ำ\s*/u, "").trim();
          return (
            <li key={r.id} className="flood-item">
              <div className="flood-row-head">
                <span className="flood-name" lang="th">{name}</span>
                <span className="flood-figure num">
                  <StatusWord level={level}>
                    {pct != null ? `${pct.toFixed(0)}%` : "—"}
                    {r.volumeMcm != null ? ` · ${r.volumeMcm.toFixed(1)} MCM` : ""}
                  </StatusWord>
                  <span className="visually-hidden"> {STATUS[level].en}</span>
                </span>
              </div>
              <Bar pct={pct} level={level} />
              {(r.inflowMcm != null || r.outflowMcm != null) && (
                <p className="flood-meta num">
                  {r.inflowMcm != null ? `in ${r.inflowMcm.toFixed(2)}` : ""}
                  {r.inflowMcm != null && r.outflowMcm != null ? " / " : ""}
                  {r.outflowMcm != null ? `out ${r.outflowMcm.toFixed(2)} MCM/d` : ""}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p className="flood-footnote">
        SOURCE · data.go.th · RID <span lang="th">กรมชลประทาน</span> · app.rid.go.th
      </p>
    </div>
  );
}

// ─── Rainfall section ─────────────────────────────────────────────────────────

function RainfallSection({ rain }: { rain: RainfallStation[] }) {
  const [showAll, setShowAll] = useState(false);
  if (rain.length === 0) {
    return <p className="flood-empty">No rainfall data</p>;
  }

  const withRain = rain.filter((r) => (r.rain24h ?? 0) > 0);
  const totalStations = rain.length;
  const maxRain = Math.max(...rain.map((r) => r.rain24h ?? 0));
  const totalRain24h = rain.reduce((s, r) => s + (r.rain24h ?? 0), 0) / totalStations;
  const display = showAll ? withRain : withRain.slice(0, RAIN_PREVIEW);
  const maxLevel = rainStatus(maxRain);

  return (
    <div className="flood-section">
      <div className="flood-row-head">
        <p className="flood-meta num">
          {totalStations} <span lang="th">สถานี</span> · avg {totalRain24h.toFixed(1)} mm/24h
        </p>
        <span className="flood-figure num">
          <StatusWord level={maxLevel}>MAX {maxRain.toFixed(1)} mm</StatusWord>
        </span>
      </div>

      {withRain.length === 0 && (
        <p className="flood-empty">
          <span lang="th">ไม่มีฝน</span> — no rain across all {totalStations} stations
        </p>
      )}

      <ul className="flood-list">
        {display.map((r) => {
          const level = rainStatus(r.rain24h);
          const barPct = maxRain > 0 ? ((r.rain24h ?? 0) / maxRain) * 100 : 0;
          const name = r.name.replace(/^สถานีโทรมาตร\s*/u, "").replace(/สถานีวัดน้ำ\s*/u, "");
          return (
            <li key={r.id} className="flood-item">
              <div className="flood-row-head">
                <span className="flood-name" lang="th">{name || r.name}</span>
                <span className="flood-figure num">
                  <StatusWord level={level}>
                    {r.rain24h?.toFixed(1)} mm
                    {r.rain1h != null && r.rain1h > 0 ? ` · ${r.rain1h.toFixed(1)}/h` : ""}
                  </StatusWord>
                  <span className="visually-hidden"> {STATUS[level].en}</span>
                </span>
              </div>
              <Bar pct={barPct} level={level} />
              {r.amphoe && <p className="flood-meta"><MixedText text={r.amphoe} /></p>}
            </li>
          );
        })}
      </ul>

      {withRain.length > RAIN_PREVIEW && (
        <button type="button" className="btn btn--quiet flood-more" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer stations" : `Show ${withRain.length - RAIN_PREVIEW} more stations`}
        </button>
      )}

      <p className="flood-footnote">
        SOURCE · HII ThaiWater · <span lang="th">ฝน 24 ชม.</span> · province 80
      </p>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function WaterPanel({
  reservoirs, ridReservoirs, waterGauges, waterRain, loading, ageMinutes, fallbackTier,
}: Props) {
  const [tab, setTab] = useState<Tab>("gauges");
  const baseId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ gauges: null, reservoirs: null, rain: null });

  if (loading && waterGauges.length === 0 && reservoirs.length === 0) {
    return (
      <section className="panel" aria-label="Water monitoring" aria-busy="true">
        <p className="eyebrow">WATER MONITORING // NST</p>
        <div className="skeleton flood-skeleton" />
        <div className="skeleton flood-skeleton flood-skeleton--short" />
      </section>
    );
  }

  const worstSit = waterGauges.length > 0
    ? Math.max(...waterGauges.map((g) => g.situationLevel))
    : null;
  const atRiskCount = waterGauges.filter((g) => g.situationLevel >= 4).length;

  const TABS: { id: Tab; label: React.ReactNode; badge?: number | null }[] = [
    { id: "gauges",     label: "Gauges",                           badge: waterGauges.length || null },
    { id: "reservoirs", label: <span lang="th">อ่างเก็บน้ำ</span>,   badge: (reservoirs.length + ridReservoirs.length) || null },
    { id: "rain",       label: "Rainfall",                         badge: waterRain.filter((r) => (r.rain24h ?? 0) > 0).length || null },
  ];

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === "ArrowRight" ? (i + 1) % TABS.length :
      e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length :
      e.key === "Home" ? 0 :
      e.key === "End" ? TABS.length - 1 :
      -1;
    if (next < 0) return;
    e.preventDefault();
    const id = TABS[next].id;
    setTab(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <section className="panel" aria-label="Water monitoring">
      <PanelHeader
        title="WATER MONITORING // NST"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater·rid·datago"
        actions={
          worstSit != null && worstSit >= 4 ? (
            <StatusWord level={worstSit >= 5 ? "critical" : "warning"}>
              {atRiskCount} STATIONS HIGH
            </StatusWord>
          ) : undefined
        }
      />

      <div role="tablist" aria-label="Water data" className="water-tabs">
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[t.id] = el; }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={onTabKey}
              className="water-tab"
            >
              {t.label}{t.badge != null ? <> <span className="num">({t.badge})</span></> : null}
            </button>
          );
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${baseId}-panel-${t.id}`}
          aria-labelledby={`${baseId}-tab-${t.id}`}
          tabIndex={0}
          hidden={tab !== t.id}
        >
          {tab === t.id && t.id === "gauges" && <GaugesSection gauges={waterGauges} />}
          {tab === t.id && t.id === "reservoirs" && <ReservoirSection reservoirs={reservoirs} ridReservoirs={ridReservoirs} />}
          {tab === t.id && t.id === "rain" && <RainfallSection rain={waterRain} />}
        </div>
      ))}
    </section>
  );
}
