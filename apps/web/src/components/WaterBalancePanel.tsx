import { useId, useState } from "react";
import type { BasinStressBand, BasinWaterBalance, FallbackTier } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { STATUS, type StatusLevel } from "../lib/status";
import { MixedText } from "./MixedText";

/**
 * WATER BALANCE — the per-basin ledger: modelled rain-volume in vs. what the
 * channels can pass + reservoirs can hold. The compact rail companion to the
 * full-screen Flood Ops board; same feed, headline numbers only.
 */

/** Basin stress band → the shared status vocabulary. */
export const BAND_STATUS: Record<BasinStressBand, StatusLevel> = {
  ok: "normal",
  tight: "warning",
  overflow: "critical",
  unknown: "unknown",
};

const BAND_LABEL: Record<BasinStressBand, { th: string; en: string }> = {
  ok: { th: "รับได้", en: "ABSORBS" },
  tight: { th: "ใกล้เต็ม", en: "TIGHT" },
  overflow: { th: "เกินความจุ", en: "OVERFLOW" },
  unknown: { th: "ไม่ทราบความจุ", en: "NO CAPACITY DATA" },
};

export function fmtVolume(m3: number): string {
  if (m3 >= 1e6) return `${(m3 / 1e6).toFixed(1)}M m³`;
  if (m3 >= 1e3) return `${Math.round(m3 / 1e3)}k m³`;
  return `${Math.round(m3)} m³`;
}

function StressBar({ b }: { b: BasinWaterBalance }) {
  const h = b.horizons[0];
  const cap = (h.conveyanceM3 ?? 0) + h.reservoirHeadroomM3;
  if (cap <= 0) return null;
  // Inflow bar scaled against total absorption capacity (=100 %).
  const loPct = Math.min(140, (h.inflowM3Lo / cap) * 100);
  const hiPct = Math.min(140, (h.inflowM3Hi / cap) * 100);
  const color = STATUS[BAND_STATUS[h.band]].color;
  return (
    <div
      className="water-bal-bar"
      role="img"
      aria-label={`Inflow ${fmtVolume(h.inflowM3Lo)} to ${fmtVolume(h.inflowM3Hi)} against capacity ${fmtVolume(cap)} per 24 hours`}
      title={`inflow ${fmtVolume(h.inflowM3Lo)}–${fmtVolume(h.inflowM3Hi)} vs capacity ${fmtVolume(cap)} / 24h`}
    >
      <div className="water-bal-bar__in" style={{ width: `${hiPct / 1.4}%`, background: color }} />
      <div className="water-bal-bar__in water-bal-bar__in--lo" style={{ width: `${loPct / 1.4}%`, background: color }} />
      <div className="water-bal-bar__cap" />
    </div>
  );
}

interface Props {
  basins: BasinWaterBalance[];
  ageMinutes: number;
  fallbackTier?: FallbackTier;
  note?: string;
  onOpenOps: () => void;
}

export function WaterBalancePanel({ basins, ageMinutes, fallbackTier, note, onOpenOps }: Props) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const assumptionsId = useId();

  if (basins.length === 0) {
    return (
      <section className="panel" aria-label="Water balance">
        <PanelHeader title="WATER BALANCE" ageMinutes={ageMinutes} fallbackTier={fallbackTier} source="thaiwater·rid·wrf" />
        <p className="flood-empty">{note ?? "LOADING LEDGER …"}</p>
      </section>
    );
  }

  const allAssumptions = Array.from(new Set(basins.flatMap((b) => b.assumptions)));

  return (
    <section className="panel" aria-label="Water balance">
      <PanelHeader
        title="WATER BALANCE"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater·rid·wrf·marine"
        actions={
          <button type="button" className="btn" onClick={onOpenOps} title="Open the full-screen Flood Ops board">
            OPS BOARD <span aria-hidden="true">→</span>
          </button>
        }
      />

      <p className="flood-meta">
        <span lang="th">น้ำเข้า (ฝน×พื้นที่รับน้ำ) เทียบ ความจุระบาย+อ่างเก็บ · 24 ชม.</span> · MODELLED
      </p>

      <div>
        {basins.map((b) => {
          const h = b.horizons[0];
          const label = BAND_LABEL[h.band];
          const st = STATUS[BAND_STATUS[h.band]];
          return (
            <div key={b.basinId} className="wb-row">
              <div className="water-bal-head">
                <span className="water-bal-name" lang="th">{b.nameTh}</span>
                <span className="flood-status water-bal-band" style={{ color: st.color }}>
                  <span aria-hidden="true">{st.glyph}</span>
                  <span lang="th">{label.th}</span> · {label.en}
                </span>
              </div>
              <StressBar b={b} />
              <p className="flood-meta">
                {h.stressLo != null && h.stressHi != null
                  ? `${h.stressLo.toFixed(2)}–${h.stressHi.toFixed(2)}× capacity`
                  : "capacity unpublished — live banks only"}
                {b.chokeStationCode && b.chokeUtilizationPct != null && (
                  <> · choke {b.chokeStationCode} {b.chokeUtilizationPct}%</>
                )}
                {b.tidal && b.tideFactor != null && <> · tide ×{b.tideFactor}</>}
                {b.worstEtaOvertopH != null && (
                  <span className="flood-status" style={{ color: STATUS.critical.color }}>
                    {" "}· <span aria-hidden="true">{STATUS.critical.glyph}</span> overtop ~{b.worstEtaOvertopH}h
                  </span>
                )}
              </p>
              <p className="water-bal-verdict" lang="th">{b.verdictTh}</p>
              {b.basinId === "city_tha_dee" && !b.hasReservoir && (
                <p className="flood-meta" lang="th">ไม่มีอ่างเก็บน้ำเหนือเมือง — พึ่งการระบาย+เตือนภัยเท่านั้น</p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn--quiet flood-more"
        onClick={() => setShowAssumptions((v) => !v)}
        aria-expanded={showAssumptions}
        aria-controls={assumptionsId}
      >
        <span aria-hidden="true">{showAssumptions ? "▾" : "▸"}</span> Assumptions ({allAssumptions.length})
      </button>
      <ul id={assumptionsId} className="water-bal-assumptions" hidden={!showAssumptions}>
        {allAssumptions.map((a) => (
          <li key={a}><MixedText text={a} /></li>
        ))}
      </ul>
      <p className="flood-footnote" lang="th">แบบจำลองอธิบายกลไก — การเตือนภัยทางการยึดตาม สทนช./ปภ./HII</p>
    </section>
  );
}
