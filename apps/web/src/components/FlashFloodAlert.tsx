/**
 * FlashFloodAlert — ONWR-style popup panel.
 *
 * Mirrors the structure of the Office of National Water Resources (ONWR)
 * public alert popup:
 *   - Title bar with overall band chip + close
 *   - Top-N rows sorted by FFPI desc, same column shape as the agency
 *     page (จังหวัด / อำเภอ / ตำบล · FFPI · ฝน 1 วัน · สถานีติดตาม)
 *   - Footer with the FFPI formula verbatim (so a reader sees how the
 *     number was built, not just the number)
 *
 * Renders as: a modal that auto-opens when any row crosses the
 * `prepare` threshold (≥ 4), and as a click-to-open panel otherwise.
 */

import { useEffect, useMemo, useState } from "react";
import type { EwsStation, RainfallStation, WaterGauge } from "@nst/shared";
import {
  rankFfpi,
  ffpiBandToStatusLevel,
  FFPI,
  type FfpiBand,
  type FfpiRow,
} from "../lib/flashFlood";
import { statusRgba, type StatusLevel } from "../lib/status";
import { Dialog } from "./Dialog";

// Helper that turns a 4-tuple into CSS rgba string. `statusRgba` returns
// an [r,g,b,a] tuple which is what deck.gl wants — but React inline
// styles need a string. `rgbaString` bridges the gap.
function rgbaString(c: [number, number, number, number]): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`;
}

void rgbaString;

interface Props {
  /** Rain telemetry (130 stations in NST). */
  rain: RainfallStation[];
  /** DWR EWS stations — the authoritative official alert source. */
  ews: EwsStation[];
  /** Water gauges — channelFullnessPct feeds the FFPI bonus. */
  gauges?: WaterGauge[];
  /** Hard cap on rows. Default 10 — matches the ONWR popup's per-page
   *  visible count. */
  limit?: number;
  /** When true, the modal auto-opens on `prepare` / `critical` rows. */
  autoOpenOnAlert?: boolean;
  /** User-controlled close → also clears the auto-open latch. */
  onDismissAuto?: () => void;
}

function bandColor(band: FfpiBand): string {
  const sl = ffpiBandToStatusLevel(band);
  return rgbaString(statusRgba(sl, 230));
}

function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function fmtBand(band: FfpiBand): { en: string; th: string } {
  return { en: FFPI.BAND_LABEL_EN[band], th: FFPI.BAND_LABEL_TH[band] };
}

export function FlashFloodAlert({
  rain,
  ews,
  gauges = [],
  limit = 10,
  autoOpenOnAlert = true,
  onDismissAuto,
}: Props) {
  // Roll up per-amphoe. The function sorts and clamps — we slice to
  // `limit` so the table is bounded for the modal.
  const rows = useMemo<FfpiRow[]>(() => {
    const gaugeBuckets = new Map<string, WaterGauge[]>();
    for (const g of gauges) {
      const key = (g.amphoe ?? "").toLowerCase().replace(/\s+/g, " ").trim();
      if (!key) continue;
      let l = gaugeBuckets.get(key);
      if (!l) { l = []; gaugeBuckets.set(key, l); }
      l.push(g);
    }
    return rankFfpi({ rain, ews, gaugesByAmphoe: gaugeBuckets, limit });
  }, [rain, ews, gauges, limit]);

  // Modal auto-open latch: if any row is in `prepare` or `critical`, the
  // modal opens automatically. User can close; we don't auto-reopen in
  // the same session.
  const [autoShown, setAutoShown] = useState(false);
  const [userOpened, setUserOpened] = useState(false);
  const topBand = rows[0]?.ffpi.band ?? "normal";
  const shouldAuto = autoOpenOnAlert && (topBand === "prepare" || topBand === "critical");

  useEffect(() => {
    if (shouldAuto) setAutoShown(true);
  }, [shouldAuto]);

  if (rows.length === 0) return null;

  const open = userOpened || autoShown;
  const setOpen = (next: boolean) => {
    setUserOpened(next);
    if (!next && autoShown) {
      setAutoShown(false);
      onDismissAuto?.();
    }
  };

  const prepareCount = rows.filter((r) => r.ffpi.band === "prepare").length;
  const criticalCount = rows.filter((r) => r.ffpi.band === "critical").length;
  const headerBand: FfpiBand = criticalCount > 0 ? "critical" : prepareCount > 0 ? "prepare" : topBand;

  const header = (
    <header className="ffa__hdr">
      <div>
        <p className="ffa__eyebrow">แจ้งเตือนสถานการณ์ · LIVE FLASH-FLOOD ALERT</p>
        <h2 className="ffa__title">
          <span lang="th">คาดการณ์น้ำท่วมฉับพลัน</span>
          <span aria-hidden="true"> · </span>
          <span>FFPI · ดัชนีความเสี่ยงน้ำท่วมฉับพลัน</span>
        </h2>
        <p className="ffa__sub">
          Top {rows.length} sub-districts · sorted by FFPI desc · นครศรีธรรมราช
        </p>
      </div>
      <span
        className="ffa__chip"
        style={{
          color: bandColor(headerBand),
          borderColor: bandColor(headerBand),
        }}
      >
        {fmtBand(headerBand).en} · {fmtBand(headerBand).th}
      </span>
    </header>
  );

  return (
    <>
      <button
        type="button"
        className="ffa__trigger"
        onClick={() => setUserOpened(true)}
        aria-label={`Open flash flood alert (${rows.length} rows)`}
      >
        <span aria-hidden="true">⚠</span>
        Flash flood
        <span className="ffa__trigger-count">{rows.length}</span>
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="FLASH FLOOD ALERT · น้ำท่วมฉับพลัน"
        size="lg"
        className="ffa__dlg"
      >
        {header}
        <table className="ffa__tbl">
          <thead>
            <tr>
              <th>จังหวัด</th>
              <th>อำเภอ</th>
              <th>ตำบล</th>
              <th className="ffa__num">FFPI</th>
              <th className="ffa__num">ฝน 1 วัน (mm)</th>
              <th className="ffa__num">ฝน 1 ชม. (mm/h)</th>
              <th className="ffa__num">EWS</th>
              <th>สถานีติดตาม</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-band={r.ffpi.band}>
                <td><span lang="th">{r.province}</span></td>
                <td><span lang="th">{r.amphoe}</span></td>
                <td><span lang="th">{r.tambon}</span></td>
                <td className="ffa__num">
                  <span
                    className="ffa__pill"
                    style={{
                      color: bandColor(r.ffpi.band),
                      borderColor: bandColor(r.ffpi.band),
                    }}
                    title={`Score ${r.ffpi.score.toFixed(2)} / 10`}
                  >
                    {r.ffpi.score.toFixed(1)}
                  </span>
                </td>
                <td className="ffa__num num">{fmt(r.rain24hMm, 1)}</td>
                <td className="ffa__num num">{fmt(r.rain1hMm, 1)}</td>
                <td className="ffa__num">
                  {r.ewsStatus != null && (
                    <span
                      className="ffa__ews"
                      style={{
                        background: bandColor(ewsStatusToBand(r.ewsStatus)),
                      }}
                      title={`DWR EWS status ${r.ewsStatus}`}
                    >
                      {r.ewsStatus}
                    </span>
                  )}
                </td>
                <td className="ffa__station">
                  {r.ewsName ? (
                    <span lang="th">{r.ewsName}</span>
                  ) : (
                    <span className="ffa__station--no">—</span>
                  )}
                  {r.channelFullnessPct != null && r.channelFullnessPct >= 95 && (
                    <span className="ffa__full" title={`Channel at ${r.channelFullnessPct.toFixed(0)}% bank`}>
                      +BANK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="ffa__foot">
          <p>
            <span className="ffa__formula-title">FFPI ·</span>
            <code className="ffa__formula">
              rain24h(0..35..90..150) + rain1h(0..15..35) + soil(50..70..85%) + ews(0..3) → clamp 0..10
            </code>
          </p>
          <p className="ffa__legend">
            Bands: <b>0–2</b> น้อย · <b>2–4</b> ปานกลาง · <b>4–6</b> เตรียมพร้อม · <b>6+</b> วิกฤติ ·
            "+BANK" = channel fullness ≥ 95% (bonus +1).
          </p>
          <p className="ffa__meta num">
            Source: HII ThaiWater (rain) · DWR EWS (soil/status) · RID (gauges)
          </p>
        </footer>
      </Dialog>
    </>
  );
}

function ewsStatusToBand(status: number): FfpiBand {
  if (status >= 3) return "critical";
  if (status >= 2) return "prepare";
  if (status >= 1) return "watch";
  return "normal";
}

// ─── CSS hooks consumed by layout.css / panels-city.css ───────────────────
// (The classNames above are styled in panels-city.css under the
// `.ffa__*` prefix — kept here for documentation. Tokens come from the
//  CSS variables defined in system.css, never hardcoded RGB.)
void ("" as unknown as StatusLevel);
