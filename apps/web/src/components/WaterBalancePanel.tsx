import { useState } from "react";
import type { BasinStressBand, BasinWaterBalance, FallbackTier } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";

/**
 * WATER BALANCE — the per-basin ledger: modelled rain-volume in vs. what the
 * channels can pass + reservoirs can hold. The compact rail companion to the
 * full-screen Flood Ops board; same feed, headline numbers only.
 */

const BAND_COLOR: Record<BasinStressBand, string> = {
  ok: "var(--good)",
  tight: "var(--warn)",
  overflow: "var(--bad)",
  unknown: "var(--ink-low)",
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
  return (
    <div className="wb-bar" title={`inflow ${fmtVolume(h.inflowM3Lo)}–${fmtVolume(h.inflowM3Hi)} vs capacity ${fmtVolume(cap)} / 24h`}>
      <div className="wb-bar-cap" />
      <div className="wb-bar-in" style={{ width: `${hiPct / 1.4}%`, background: BAND_COLOR[h.band] }} />
      <div className="wb-bar-in wb-bar-in--lo" style={{ width: `${loPct / 1.4}%`, background: BAND_COLOR[h.band] }} />
      <div className="wb-bar-100" />
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

  if (basins.length === 0) {
    return (
      <div>
        <PanelHeader title="WATER BALANCE" ageMinutes={ageMinutes} fallbackTier={fallbackTier} source="thaiwater·rid·wrf" />
        <div className="eyebrow mono" style={{ color: "var(--ink-low)" }}>
          {note ?? "LOADING LEDGER …"}
        </div>
      </div>
    );
  }

  const allAssumptions = Array.from(new Set(basins.flatMap((b) => b.assumptions)));

  return (
    <div>
      <PanelHeader
        title="WATER BALANCE"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater·rid·wrf·marine"
        actions={
          <button className="mono wb-ops-btn" onClick={onOpenOps} title="Open the full-screen Flood Ops board">
            OPS BOARD →
          </button>
        }
      />

      <div className="eyebrow mono" style={{ color: "var(--ink-low)", marginBottom: 6 }}>
        น้ำเข้า (ฝน×พื้นที่รับน้ำ) เทียบ ความจุระบาย+อ่างเก็บ · 24 ชม. · MODELLED
      </div>

      {basins.map((b) => {
        const h = b.horizons[0];
        const label = BAND_LABEL[h.band];
        return (
          <div key={b.basinId} className="wb-row">
            <div className="wb-row-head">
              <span className="wb-dot" style={{ background: BAND_COLOR[h.band] }} />
              <span className="wb-name">{b.nameTh}</span>
              <span className="mono wb-band" style={{ color: BAND_COLOR[h.band] }}>
                {label.th} · {label.en}
              </span>
            </div>
            <StressBar b={b} />
            <div className="eyebrow mono wb-meta">
              {h.stressLo != null && h.stressHi != null
                ? `${h.stressLo.toFixed(2)}–${h.stressHi.toFixed(2)}× capacity`
                : "capacity unpublished — live banks only"}
              {b.chokeStationCode && b.chokeUtilizationPct != null && (
                <> · choke {b.chokeStationCode} {b.chokeUtilizationPct}%</>
              )}
              {b.tidal && b.tideFactor != null && <> · tide ×{b.tideFactor}</>}
              {b.worstEtaOvertopH != null && (
                <span style={{ color: "var(--bad)" }}> · overtop ~{b.worstEtaOvertopH}h</span>
              )}
            </div>
            <div className="eyebrow mono wb-verdict" style={{ color: "var(--ink-3)" }}>
              {b.verdictTh}
            </div>
            {b.basinId === "city_tha_dee" && !b.hasReservoir && (
              <div className="eyebrow mono" style={{ color: "var(--ink-low)" }}>
                ไม่มีอ่างเก็บน้ำเหนือเมือง — พึ่งการระบาย+เตือนภัยเท่านั้น
              </div>
            )}
          </div>
        );
      })}

      <button
        className="mono wb-assump-toggle eyebrow"
        onClick={() => setShowAssumptions((v) => !v)}
        aria-expanded={showAssumptions}
      >
        {showAssumptions ? "▾" : "▸"} ASSUMPTIONS ({allAssumptions.length})
      </button>
      {showAssumptions && (
        <ul className="wb-assumptions">
          {allAssumptions.map((a) => (
            <li key={a} className="eyebrow mono">{a}</li>
          ))}
        </ul>
      )}
      <div className="eyebrow mono" style={{ color: "var(--ink-low)", marginTop: 4 }}>
        แบบจำลองอธิบายกลไก — การเตือนภัยทางการยึดตาม สทนช./ปภ./HII
      </div>
    </div>
  );
}
