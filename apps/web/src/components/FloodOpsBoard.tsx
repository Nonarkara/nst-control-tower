import { useEffect, useId } from "react";
import type { BasinStressBand, BasinWaterBalance, WrfRainDay } from "@nst/shared";
import { BAND_STATUS, fmtVolume } from "./WaterBalancePanel";
import { MixedText } from "./MixedText";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { rainStatus } from "../lib/water";
import { STATUS, type StatusLevel } from "../lib/status";

/**
 * FLOOD OPS — full-bleed operations board for the actual emergency: big type,
 * Thai first, zero knobs. One card per basin (verdict + ledger + worst
 * gauges), a tide/drainage strip, and the 3-day watershed rain outlook.
 * Reuses the Atlas overlay shell so it inherits the tested full-screen CSS.
 *
 * Everything here is MODELLED and says so; official HII situation levels are
 * carried through unchanged. This board explains — officials warn.
 */

const BAND_TH: Record<BasinStressBand, string> = {
  ok: "รับได้",
  tight: "ใกล้เต็มความจุ",
  overflow: "เกินความจุ",
  unknown: "ไม่ทราบความจุทางออก",
};

/** Channel fullness % → status (≥ 85 critical, ≥ 60 warning). */
function fullnessStatus(pct: number | null): StatusLevel {
  if (pct == null) return "unknown";
  if (pct >= 85) return "critical";
  if (pct >= 60) return "warning";
  return "normal";
}

/** A figure that takes a status colour + glyph only when it is not normal. */
function Flagged({ level, children }: { level: StatusLevel; children: React.ReactNode }) {
  if (level === "normal" || level === "unknown") return <>{children}</>;
  const st = STATUS[level];
  return (
    <span className="flood-status" style={{ color: st.color }}>
      <span aria-hidden="true">{st.glyph}</span>
      {children}
    </span>
  );
}

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
  const band = STATUS[BAND_STATUS[h24.band]];

  return (
    <section className="ops-card" style={{ borderTopColor: band.color }} lang="th">
      <header className="ops-card-head">
        <h3>{b.nameTh}</h3>
        <span className="flood-status ops-band" style={{ color: band.color }}>
          <span aria-hidden="true">{band.glyph}</span>
          {BAND_TH[h24.band]}
        </span>
      </header>
      <p className="ops-verdict">{b.verdictTh}</p>
      <p className="ops-verdict-en" lang="en">{b.verdictEn}</p>

      <dl className="ops-ledger">
        <div>
          <dt className="ops-ledger-label">น้ำเข้า 24 ชม. <span lang="en">(IN)</span></dt>
          <dd className="num"><b>{fmtVolume(h24.inflowM3Lo)} – {fmtVolume(h24.inflowM3Hi)}</b></dd>
          <dd className="ops-ledger-label">ฝนตกแล้ว {h24.rainObservedMm} มม. + คาดการณ์ {h24.rainForecastMm} มม.</dd>
        </div>
        <div>
          <dt className="ops-ledger-label">ระบาย+เก็บได้ <span lang="en">(OUT+STORE)</span></dt>
          <dd className="num"><b>{capacity > 0 ? fmtVolume(capacity) : "ไม่ทราบ"}</b></dd>
          <dd className="ops-ledger-label">
            {h24.conveyanceM3 != null ? `คลอง ${fmtVolume(h24.conveyanceM3)}` : "ความจุทางออกไม่เผยแพร่"}
            {h24.reservoirHeadroomM3 > 0 ? ` + อ่าง ${fmtVolume(h24.reservoirHeadroomM3)}` : ""}
          </dd>
        </div>
      </dl>

      {h24.stressLo != null && h24.stressHi != null && (
        <p className="ops-stress num">
          <span lang="en">STRESS</span> {h24.stressLo.toFixed(2)}–{h24.stressHi.toFixed(2)}×
          {b.chokeStationCode && b.chokeUtilizationPct != null && (
            <span> · คอขวด {b.chokeStationCode} ใช้อยู่ {b.chokeUtilizationPct}%</span>
          )}
          {b.tidal && b.tideFactor != null && <span> · น้ำทะเล ×{b.tideFactor}</span>}
        </p>
      )}

      {worstGauges.length > 0 && (
        <table className="ops-gauges">
          <thead>
            <tr>
              <th scope="col">สถานี</th>
              <th scope="col">ความเต็ม</th>
              <th scope="col">ระยะถึงตลิ่ง</th>
              <th scope="col">เวลาถึงล้น</th>
            </tr>
          </thead>
          <tbody>
            {worstGauges.map((g) => (
              <tr key={g.id}>
                <th scope="row"><MixedText text={g.code ?? g.name.slice(0, 14)} /></th>
                <td className="num">
                  <Flagged level={fullnessStatus(g.fullnessPct)}>
                    {g.fullnessPct != null ? `${Math.round(g.fullnessPct)}%` : "—"}
                  </Flagged>
                </td>
                <td className="num">{g.freeboardM != null ? `เหลือ ${g.freeboardM.toFixed(2)} ม.` : "—"}</td>
                <td className="num">
                  {g.etaOvertopH != null ? (
                    <Flagged level="critical">{g.etaOvertopH <= 0 ? "ล้นแล้ว" : `~${g.etaOvertopH} ชม.`}</Flagged>
                  ) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {b.reservoirs.length > 0 && (
        <p className="flood-meta ops-res">
          {b.reservoirs.map((r) => (
            <span key={r.id}>
              {r.name.replace("อ่างเก็บน้ำ", "อ่างฯ")}:{" "}
              {r.headroomMcm != null ? `ว่าง ${r.headroomMcm} ล้าน m³` : `ความจุ ${r.capacityMcm ?? "—"} ล้าน m³ (ไม่รายงานปริมาณวันนี้)`}
              {" "}
            </span>
          ))}
        </p>
      )}
      {b.basinId === "city_tha_dee" && (
        <p className="flood-meta">
          ไม่มีเขื่อน/อ่างเหนือเมือง — เขาหลวงส่งได้ ~303 m³/s แต่คลองในเมืองรับ ~42 m³/s
        </p>
      )}
      {b.suggestedScenarioM != null && (
        <button type="button" className="btn ops-apply-btn" onClick={() => onApplyScenario(b.suggestedScenarioM!)}>
          <span aria-hidden="true">▶</span> จำลองถนนที่ระดับ {b.suggestedScenarioM.toFixed(2)} ม.{" "}
          <span lang="en">(APPLY MODEL LEVEL)</span>
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
  const titleId = useId();
  // Focus moves into the board on open and returns to the trigger on close.
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const city = basins.find((b) => b.basinId === "city_tha_dee");

  return (
    <div ref={trapRef} className="atlas-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="atlas-header">
        <h2 id={titleId}>
          FLOOD OPS<span className="visually-hidden"> — Flood operations board</span>{" "}
          <span className="atlas-header-th" lang="th">น้ำเข้า vs ความจุระบบ — ทั้ง 4 ลุ่มน้ำ</span>
        </h2>
        <span className="atlas-sub">
          MODELLED · data {ageMinutes <= 1 ? "now" : `${ageMinutes} min`}
          {note ? <> · <MixedText text={note} /></> : null}
        </span>
        <button type="button" className="btn atlas-close" onClick={onClose}>
          CLOSE <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div className="ops-body">
        <div className="ops-grid">
          {basins.map((b) => (
            <BasinCard key={b.basinId} b={b} onApplyScenario={onApplyScenario} />
          ))}
        </div>

        <aside className="ops-side" lang="th">
          <section className="ops-card">
            <header className="ops-card-head">
              <h3>ฝนลุ่มเขาหลวง 3 วัน</h3>
              <span className="flood-meta" lang="en">WRF-ROMS · HII</span>
            </header>
            {wrfOutlook.length === 0 ? (
              <p className="flood-empty">คาดการณ์ไม่พร้อมใช้งาน</p>
            ) : (
              <table className="ops-gauges">
                <thead>
                  <tr>
                    <th scope="col">วัน</th>
                    <th scope="col">เฉลี่ย</th>
                    <th scope="col">สูงสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {wrfOutlook.map((d) => (
                    <tr key={d.day}>
                      <th scope="row" className="num">D{d.day} · {d.validDate.slice(5)}</th>
                      <td className="num">
                        <Flagged level={d.catchmentMeanMm >= 35 ? rainStatus(d.catchmentMeanMm) : "normal"}>
                          {d.catchmentMeanMm} มม.
                        </Flagged>
                      </td>
                      <td className="num">{d.catchmentMaxMm} มม.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {city && (
            <section className="ops-card">
              <header className="ops-card-head">
                <h3>ทางระบายเมือง</h3>
                <span className="flood-meta" lang="en">PAK NAKHON</span>
              </header>
              <p className="ops-note">
                {city.tideFactor != null
                  ? `ประสิทธิภาพระบายตามจังหวะน้ำขึ้น-ลง ×${city.tideFactor} ใน 24 ชม. ข้างหน้า (ระบายดีช่วงน้ำลง)`
                  : "ไม่มีข้อมูลน้ำทะเล — ไม่ปรับลดการระบาย"}
              </p>
              <p className="flood-meta">
                ความชื้นดิน: <MixedText text={String(city.wetness)} /> · สัมประสิทธิ์น้ำท่า {city.runoffCLo.toFixed(2)}–{city.runoffCHi.toFixed(2)}
              </p>
            </section>
          )}

          <section className="ops-card">
            <header className="ops-card-head">
              <h3>ข้อจำกัดแบบจำลอง</h3>
              <span className="flood-meta" lang="en">HONESTY</span>
            </header>
            <ul className="water-bal-assumptions" lang="en">
              {Array.from(new Set(basins.flatMap((b) => b.assumptions))).slice(0, 8).map((a) => (
                <li key={a}><MixedText text={a} /></li>
              ))}
            </ul>
            <p className="flood-footnote">
              สมดุลน้ำอย่างง่าย ไม่ใช่แบบจำลองชลศาสตร์ · การเตือนภัยทางการ: สทนช. / ปภ. / HII
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
