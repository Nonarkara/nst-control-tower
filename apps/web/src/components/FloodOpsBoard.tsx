import { useEffect } from "react";
import type { BasinStressBand, BasinWaterBalance, WrfRainDay } from "@nst/shared";
import { fmtVolume } from "./WaterBalancePanel";

/**
 * FLOOD OPS — full-bleed operations board for the actual emergency: big type,
 * Thai first, zero knobs. One card per basin (verdict + ledger + worst
 * gauges), a tide/drainage strip, and the 3-day watershed rain outlook.
 * Reuses the Atlas overlay shell so it inherits the tested full-screen CSS.
 *
 * Everything here is MODELLED and says so; official HII situation levels are
 * carried through unchanged. This board explains — officials warn.
 */

const BAND_COLOR: Record<BasinStressBand, string> = {
  ok: "var(--good)",
  tight: "var(--warn)",
  overflow: "var(--bad)",
  unknown: "var(--ink-low)",
};

const BAND_TH: Record<BasinStressBand, string> = {
  ok: "รับได้",
  tight: "ใกล้เต็มความจุ",
  overflow: "เกินความจุ",
  unknown: "ไม่ทราบความจุทางออก",
};

function BasinCard({
  b,
  onApplyScenario,
}: {
  b: BasinWaterBalance;
  onApplyScenario: (levelM: number) => void;
}) {
  const h24 = b.horizons[0];
  const capacity = (h24.conveyanceM3 ?? 0) + h24.reservoirHeadroomM3;
  const worstGauges = [...b.gauges]
    .sort((a, z) => (z.fullnessPct ?? -1) - (a.fullnessPct ?? -1))
    .slice(0, 3);

  return (
    <section className="ops-card" style={{ borderTopColor: BAND_COLOR[h24.band] }}>
      <header className="ops-card-head">
        <h3>{b.nameTh}</h3>
        <span className="mono ops-band" style={{ color: BAND_COLOR[h24.band] }}>
          {BAND_TH[h24.band]}
        </span>
      </header>
      <p className="ops-verdict">{b.verdictTh}</p>
      <p className="ops-verdict-en caption">{b.verdictEn}</p>

      <div className="ops-ledger mono">
        <div>
          <span className="eyebrow">น้ำเข้า 24 ชม. (IN)</span>
          <b>{fmtVolume(h24.inflowM3Lo)} – {fmtVolume(h24.inflowM3Hi)}</b>
          <span className="eyebrow">ฝนตกแล้ว {h24.rainObservedMm} มม. + คาดการณ์ {h24.rainForecastMm} มม.</span>
        </div>
        <div>
          <span className="eyebrow">ระบาย+เก็บได้ (OUT+STORE)</span>
          <b>{capacity > 0 ? fmtVolume(capacity) : "ไม่ทราบ"}</b>
          <span className="eyebrow">
            {h24.conveyanceM3 != null ? `คลอง ${fmtVolume(h24.conveyanceM3)}` : "ความจุทางออกไม่เผยแพร่"}
            {h24.reservoirHeadroomM3 > 0 ? ` + อ่าง ${fmtVolume(h24.reservoirHeadroomM3)}` : ""}
          </span>
        </div>
      </div>

      {h24.stressLo != null && h24.stressHi != null && (
        <div className="ops-stress mono">
          STRESS {h24.stressLo.toFixed(2)}–{h24.stressHi.toFixed(2)}×
          {b.chokeStationCode && b.chokeUtilizationPct != null && (
            <span> · คอขวด {b.chokeStationCode} ใช้อยู่ {b.chokeUtilizationPct}%</span>
          )}
          {b.tidal && b.tideFactor != null && <span> · น้ำทะเล ×{b.tideFactor}</span>}
        </div>
      )}

      <table className="ops-gauges mono">
        <tbody>
          {worstGauges.map((g) => (
            <tr key={g.id}>
              <td>{g.code ?? g.name.slice(0, 14)}</td>
              <td style={{ color: (g.fullnessPct ?? 0) >= 85 ? "var(--bad)" : (g.fullnessPct ?? 0) >= 60 ? "var(--warn)" : "var(--ink-3)" }}>
                {g.fullnessPct != null ? `${Math.round(g.fullnessPct)}%` : "—"}
              </td>
              <td>{g.freeboardM != null ? `เหลือ ${g.freeboardM.toFixed(2)} ม.` : "—"}</td>
              <td style={{ color: g.etaOvertopH != null ? "var(--bad)" : "var(--ink-low)" }}>
                {g.etaOvertopH != null ? (g.etaOvertopH <= 0 ? "ล้นแล้ว" : `~${g.etaOvertopH} ชม.`) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {b.reservoirs.length > 0 && (
        <div className="eyebrow mono ops-res">
          {b.reservoirs.map((r) => (
            <span key={r.id}>
              {r.name.replace("อ่างเก็บน้ำ", "อ่างฯ")}:{" "}
              {r.headroomMcm != null ? `ว่าง ${r.headroomMcm} ล้าน m³` : `ความจุ ${r.capacityMcm ?? "—"} ล้าน m³ (ไม่รายงานปริมาณวันนี้)`}
              {" "}
            </span>
          ))}
        </div>
      )}
      {b.basinId === "city_tha_dee" && (
        <div className="eyebrow mono" style={{ color: "var(--ink-low)" }}>
          ไม่มีเขื่อน/อ่างเหนือเมือง — เขาหลวงส่งได้ ~303 m³/s แต่คลองในเมืองรับ ~42 m³/s
        </div>
      )}
      {b.suggestedScenarioM != null && (
        <button className="ops-apply mono" onClick={() => onApplyScenario(b.suggestedScenarioM!)}>
          ▶ จำลองถนนที่ระดับ {b.suggestedScenarioM.toFixed(2)} ม. (APPLY MODEL LEVEL)
        </button>
      )}
    </section>
  );
}

interface Props {
  basins: BasinWaterBalance[];
  ageMinutes: number;
  note?: string;
  wrfOutlook: WrfRainDay[];
  onApplyScenario: (levelM: number) => void;
  onClose: () => void;
}

export function FloodOpsBoard({ basins, ageMinutes, note, wrfOutlook, onApplyScenario, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const city = basins.find((b) => b.basinId === "city_tha_dee");

  return (
    <div className="atlas-overlay" role="dialog" aria-label="Flood operations board">
      <header className="atlas-header">
        <h2>
          FLOOD OPS <span className="atlas-header-th">น้ำเข้า vs ความจุระบบ — ทั้ง 4 ลุ่มน้ำ</span>
        </h2>
        <span className="atlas-sub mono">
          MODELLED · data {ageMinutes <= 1 ? "now" : `${ageMinutes} min`} · {note ?? ""}
        </span>
        <button className="atlas-close" onClick={onClose}>CLOSE ✕</button>
      </header>

      <div className="ops-body">
        <div className="ops-grid">
          {basins.map((b) => (
            <BasinCard key={b.basinId} b={b} onApplyScenario={onApplyScenario} />
          ))}
        </div>

        <aside className="ops-side">
          <section className="ops-card">
            <header className="ops-card-head"><h3>ฝนลุ่มเขาหลวง 3 วัน</h3><span className="eyebrow mono">WRF-ROMS · HII</span></header>
            {wrfOutlook.length === 0 ? (
              <p className="eyebrow mono" style={{ color: "var(--ink-low)" }}>คาดการณ์ไม่พร้อมใช้งาน</p>
            ) : (
              <table className="ops-gauges mono"><tbody>
                {wrfOutlook.map((d) => (
                  <tr key={d.day}>
                    <td>D{d.day} · {d.validDate.slice(5)}</td>
                    <td style={{ color: d.catchmentMeanMm >= 90 ? "var(--bad)" : d.catchmentMeanMm >= 35 ? "var(--warn)" : "var(--ink-3)" }}>
                      เฉลี่ย {d.catchmentMeanMm} มม.
                    </td>
                    <td>สูงสุด {d.catchmentMaxMm} มม.</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </section>

          {city && (
            <section className="ops-card">
              <header className="ops-card-head"><h3>ทางระบายเมือง</h3><span className="eyebrow mono">PAK NAKHON</span></header>
              <p className="eyebrow mono" style={{ lineHeight: 1.6 }}>
                {city.tideFactor != null
                  ? `ประสิทธิภาพระบายตามจังหวะน้ำขึ้น-ลง ×${city.tideFactor} ใน 24 ชม. ข้างหน้า (ระบายดีช่วงน้ำลง)`
                  : "ไม่มีข้อมูลน้ำทะเล — ไม่ปรับลดการระบาย"}
              </p>
              <p className="eyebrow mono" style={{ color: "var(--ink-low)", lineHeight: 1.6 }}>
                ความชื้นดิน: {city.wetness} · สัมประสิทธิ์น้ำท่า {city.runoffCLo.toFixed(2)}–{city.runoffCHi.toFixed(2)}
              </p>
            </section>
          )}

          <section className="ops-card">
            <header className="ops-card-head"><h3>ข้อจำกัดแบบจำลอง</h3><span className="eyebrow mono">HONESTY</span></header>
            <ul className="wb-assumptions" style={{ margin: 0 }}>
              {Array.from(new Set(basins.flatMap((b) => b.assumptions))).slice(0, 8).map((a) => (
                <li key={a} className="eyebrow mono">{a}</li>
              ))}
            </ul>
            <p className="eyebrow mono" style={{ color: "var(--ink-low)", marginTop: 6 }}>
              สมดุลน้ำอย่างง่าย ไม่ใช่แบบจำลองชลศาสตร์ · การเตือนภัยทางการ: สทนช. / ปภ. / HII
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
