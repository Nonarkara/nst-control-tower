/**
 * LevelWatchPanel — the exceedance report. Every gauge that is over / near
 * its allowed level, ranked, with the reason the rule fired, which feed said
 * so, and the nearest water-level camera one click away so the operator can
 * look before they act. Rules + ranking live in lib/levelWatch.ts (tested);
 * this file only renders.
 */

import { useMemo } from "react";
import type { WaterGauge, GistdaLevelPost, FallbackTier } from "@nst/shared";
import type { CctvCamera } from "../map/layers";
import { PanelHeader } from "./PanelHeader";
import { rankLevelWatch, summarizeLevelWatch, type LevelWatchRow, type WatchLevel } from "../lib/levelWatch";
import { STATUS, type StatusLevel } from "../lib/status";

interface Props {
  gauges: WaterGauge[];
  posts: GistdaLevelPost[];
  cameras: CctvCamera[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  onOpenCamera: (camera: CctvCamera) => void;
  onFocus: (lng: number, lat: number) => void;
}

const LEVEL_TO_STATUS: Record<WatchLevel, StatusLevel> = {
  critical: "critical",
  warning: "warning",
  watch: "watch",
};

const LEVEL_LABEL: Record<WatchLevel, { en: string; th: string }> = {
  critical: { en: "OVER", th: "ล้น/วิกฤต" },
  warning: { en: "NEAR", th: "ใกล้ล้น" },
  watch: { en: "WATCH", th: "เฝ้าระวัง" },
};

const ROW_LIMIT = 12;

function fmtM(v: number | null): string {
  return v == null || !Number.isFinite(v) ? "—" : v.toFixed(2);
}

function trendGlyph(t: WaterGauge["trend"]): string {
  return t === "rising" ? "▲" : t === "falling" ? "▼" : "•";
}

function Row({ row, onOpenCamera, onFocus }: { row: LevelWatchRow; onOpenCamera: Props["onOpenCamera"]; onFocus: Props["onFocus"] }) {
  const st = STATUS[LEVEL_TO_STATUS[row.level]];
  const ref = row.refM != null ? ` / ${row.refKind === "critical" ? "crit" : "bank"} ${fmtM(row.refM)}` : "";
  return (
    <li>
      <button
        type="button"
        className="row-btn row-btn--glyph"
        onClick={() => onFocus(row.lng, row.lat)}
        title={`${row.name} — ${row.reason}. Click to fly to the station.`}
      >
        <span className="status-glyph" style={{ background: st.color }} aria-hidden="true" />
        <span className="row-btn__name" lang="th">
          <span className="num" style={{ color: st.color }}>{LEVEL_LABEL[row.level].en}</span>{" "}
          {row.name}
          {row.river ? <span className="row-btn__meta"> · {row.river}</span> : null}
        </span>
        <span className="row-btn__meta">
          <span className="num">{trendGlyph(row.trend)} {fmtM(row.levelM)}{ref} m</span>
          {row.fullnessPct != null ? <span className="num"> · {row.fullnessPct.toFixed(0)}%</span> : null}
          {" · "}{row.reasonTh}
          {" · "}{row.sources.join(" + ")}
        </span>
      </button>
      {row.camera && (
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => onOpenCamera(row.camera as CctvCamera)}
          title={`${row.camera.name} — ${row.cameraDistanceM} m from the gauge. Opens the live stream.`}
        >
          📷 {row.camera.sourceId ?? row.camera.id}
          <span className="row-btn__meta num"> {row.cameraDistanceM} m</span>
        </button>
      )}
    </li>
  );
}

export function LevelWatchPanel({ gauges, posts, cameras, ageMinutes, fallbackTier, onOpenCamera, onFocus }: Props) {
  const rows = useMemo(() => rankLevelWatch({ gauges, posts, cameras }), [gauges, posts, cameras]);
  const summary = useMemo(() => summarizeLevelWatch(rows, gauges), [rows, gauges]);
  const shown = rows.slice(0, ROW_LIMIT);
  const withCamera = rows.filter((r) => r.camera).length;

  return (
    <section className="panel" aria-label="Level watch — gauges above allowed level">
      <PanelHeader
        title="LEVEL WATCH"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater.rid.gistda.nstcctv"
      />
      <p className="stat-line">
        <span className="stat-line__value num" style={summary.critical > 0 ? { color: STATUS.critical.color } : undefined}>
          {summary.total}
        </span>
        <span className="stat-line__label">
          of {summary.gaugesConsidered} gauges at or near their limit
          {summary.critical > 0 ? ` · ${summary.critical} over` : ""}
          {withCamera > 0 ? ` · ${withCamera} with a camera` : ""}
        </span>
      </p>
      {rows.length === 0 ? (
        <p className="note">All gauges below watch level — ระดับน้ำทุกสถานีต่ำกว่าเกณฑ์เฝ้าระวัง.</p>
      ) : (
        <ul className="row-list">
          {shown.map((r) => (
            <Row key={r.id} row={r} onOpenCamera={onOpenCamera} onFocus={onFocus} />
          ))}
        </ul>
      )}
      {rows.length > ROW_LIMIT && (
        <p className="note">+{rows.length - ROW_LIMIT} more below the fold — the map dots carry the rest.</p>
      )}
      <p className="note">
        OVER = above bank or RID critical · NEAR = ≥90% of bank or within 0.5 m of critical · WATCH = ≥80% or within 1 m.
        Camera = nearest online water-level camera within 1.5 km.
      </p>
    </section>
  );
}
