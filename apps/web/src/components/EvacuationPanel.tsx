/**
 * EvacuationPanel — "WHO TO MOVE FIRST". Villages ranked by live flood
 * signals (gauges, flash-flood alarms, rain) × how many residents need
 * someone to move them (bedridden + homebound elderly). Logic lives in
 * lib/evacPriority.ts (tested); this only renders.
 */

import type { EvacRow, EvacSummary, EvacTier } from "../lib/evacPriority";
import { villageLabel } from "../lib/evacPriority";
import type { CctvCamera } from "../map/layers";
import type { StatusLevel } from "../lib/status";
import { STATUS } from "../lib/status";
import { PanelHeader } from "./PanelHeader";

interface Props {
  rows: EvacRow[];
  summary: EvacSummary;
  loading: boolean;
  years: { population: string; disabled: string; elderly: string } | null;
  onFocus: (lng: number, lat: number) => void;
  onOpenCamera: (camera: CctvCamera) => void;
}

const TIER: Record<Exclude<EvacTier, "calm">, { level: StatusLevel; en: string; th: string }> = {
  "move-now": { level: "critical", en: "MOVE NOW", th: "ย้ายทันที" },
  "get-ready": { level: "warning", en: "GET READY", th: "เตรียมย้าย" },
  watch: { level: "watch", en: "WATCH", th: "เฝ้าระวัง" },
};

const LIST_LIMIT = 10;

function fmt(n: number | null): string {
  return n == null ? "—" : n.toLocaleString();
}

function Row({ row, onFocus, onOpenCamera }: { row: EvacRow; onFocus: Props["onFocus"]; onOpenCamera: Props["onOpenCamera"] }) {
  const t = TIER[row.tier as Exclude<EvacTier, "calm">];
  const st = STATUS[t.level];
  const v = row.village;
  return (
    <li className="evac-row" style={{ ["--status" as string]: st.color }}>
      <p className="evac-row__tier">
        <span aria-hidden="true">{st.glyph}</span> {t.en} · <span lang="th">{t.th}</span>
        {v.floodTypes.includes("flash") ? " · flash flood" : ""}
        {v.mustEvacuate ? " · residents must leave" : ""}
      </p>
      <p className="evac-row__name" lang="th">{villageLabel(v)}</p>
      {row.signals.length > 0 ? (
        <p className="evac-row__why">Why now: {row.signals.map((s) => s.text).join("; ")}</p>
      ) : (
        <p className="evac-row__why">No live signal — listed because it is flood season here and residents must leave when it floods.</p>
      )}
      <p className="evac-row__people num">
        {v.population != null ? `${fmt(v.population)} people · ${fmt(v.households)} homes` : "Population not in the register"}
        {row.needHelp != null && (
          <>
            {" · "}<strong>~{fmt(row.est.bedridden)} bedridden, ~{fmt(row.est.homebound)} homebound</strong>
            {row.est.disabled != null ? `, ~${fmt(row.est.disabled)} with disabilities` : ""}
          </>
        )}
      </p>
      <p className="evac-row__action">{row.action}</p>
      <p className="evac-row__lead">{row.leadTime}</p>
      <div className="evac-row__buttons">
        <button type="button" className="btn" onClick={() => onFocus(v.lng, v.lat)}>Show village</button>
        {row.camera && (
          <button type="button" className="btn" onClick={() => onOpenCamera(row.camera!)}>Nearest camera</button>
        )}
      </div>
    </li>
  );
}

export function EvacuationPanel({ rows, summary, loading, years, onFocus, onOpenCamera }: Props) {
  const listed = rows.filter((r) => r.tier !== "calm");
  const shown = listed.slice(0, LIST_LIMIT);
  return (
    <section className="panel" aria-label="Who to move first">
      <PanelHeader title="WHO TO MOVE FIRST · ใครต้องย้ายก่อน" source="data.go.th·thaiwater·ews" />
      {loading ? (
        <p className="note">Loading the village flood-risk register…</p>
      ) : (
        <>
          <p className="stat-line">
            <span className="stat-line__value num" style={summary.moveNow > 0 ? { color: STATUS.critical.color } : undefined}>
              {summary.moveNow}
            </span>
            <span className="stat-line__label">
              villages to move now{summary.moveNow > 0 ? ` · ~${fmt(summary.needHelpMoveNow)} bedridden/homebound people in them` : ""}
              {" · "}{summary.getReady} get ready · {summary.watch} watch
            </span>
          </p>
          {shown.length === 0 ? (
            <p className="note">
              No at-risk village has a live flood signal nearby, and none is in its flood season. {rows.length} villages on the register are checked every time the gauges update.
            </p>
          ) : (
            <ol className="evac-list">
              {shown.map((r) => (
                <Row key={r.village.code} row={r} onFocus={onFocus} onOpenCamera={onOpenCamera} />
              ))}
            </ol>
          )}
          {listed.length > LIST_LIMIT && <p className="note">+{listed.length - LIST_LIMIT} more villages on the map (coloured dots).</p>}
        </>
      )}
      <p className="note">
        Village flood-risk register: Nakhon Si Thammarat Provincial Office (data.go.th). Bedridden, homebound
        {years ? ` (${years.elderly})` : ""} and disability{years ? ` (${years.disabled})` : ""} figures are district totals
        spread by each village's registered population{years ? ` (${years.population})` : ""}, so they are estimates. Names and
        addresses are not public: they are held by the local health office and village health volunteers (อสม.).
      </p>
    </section>
  );
}
