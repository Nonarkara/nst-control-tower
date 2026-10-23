/** Station evidence popup. Official DWR severity precedes the experimental
 * screening score; no rain window, catchment relationship or order is inferred.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { EwsStation, RainfallStation, WaterGauge } from "@nst/shared";
import {
  rankFfpi,
  ffpiBandToStatusLevel,
  FFPI,
  type FfpiBand,
  type FfpiRow,
} from "../lib/flashFlood";
import { statusRgba } from "../lib/status";
import { Dialog } from "./Dialog";

// Helper that turns a 4-tuple into CSS rgba string. `statusRgba` returns
// an [r,g,b,a] tuple which is what deck.gl wants — but React inline
// styles need a string. `rgbaString` bridges the gap.
function rgbaString(c: [number, number, number, number]): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`;
}


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

const AUTO_OPEN_LATCH_KEY = "nst:flashFloodAlert:autoShown";

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

  // Acknowledgements apply to a station/severity set. New or escalated
  // warnings can reopen; remounting the same lens does not repeat them.
  const [autoShown, setAutoShown] = useState(false);
  const [userOpened, setUserOpened] = useState(false);
  const topBand = rows[0]?.ffpi.band ?? "unknown";
  const shouldAuto = autoOpenOnAlert && rows.some(r => r.ffpi.band === "prepare" || r.ffpi.band === "critical");
  const alertKey = rows.filter(r => r.ffpi.band === "prepare" || r.ffpi.band === "critical").map(r => `${r.id}:${r.ffpi.band}`).sort().join("|");

  // Persist the acknowledged station/severity set across lens remounts.
  useEffect(() => {
    if (!shouldAuto) return;
    try {
      if (sessionStorage.getItem(AUTO_OPEN_LATCH_KEY) === alertKey) return;
      sessionStorage.setItem(AUTO_OPEN_LATCH_KEY, alertKey);
    } catch {
      /* storage blocked — fall through and behave as before (auto-open) */
    }
    setAutoShown(true);
  }, [shouldAuto, alertKey]);

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

  const header = <div className="ffa__hdr"><p className="ffa__sub">{rows.length} stations · official DWR alerts first · นครศรีธรรมราช</p><span className="ffa__chip" style={{color:bandColor(headerBand),borderColor:bandColor(headerBand)}}>{fmtBand(headerBand).en} · {fmtBand(headerBand).th}</span></div>;

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
      {/* The modal is portalled to <body>: the trigger lives in the left rail,
          and on a phone that rail is a translated sheet — a fixed overlay
          inside it would be trapped in the sheet instead of covering the
          screen. */}
      {createPortal(
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="FLOOD STATION EVIDENCE · ข้อมูลสถานี"
        size="lg"
        className="ffa__dlg"
      >
        {header}
        {(criticalCount > 0 || prepareCount > 0) && <p>แจ้งเจ้าหน้าที่เวรทันที ยืนยันสถานีและสภาพพื้นที่ · Contact the duty officer now; verify the named station and local conditions through the <a href="https://ews.dwr.go.th/" target="_blank" rel="noreferrer">official DWR channel</a> and field team.</p>}
        <ul className="ffa__stations">
          {rows.map(r => <li className="ffa__station-row" key={r.id}>
            <p><strong>{r.tambon}</strong> · {r.amphoe}</p>
            <p>{r.ewsStatus != null ? <strong style={{color:bandColor(ewsStatusToBand(r.ewsStatus))}}>DWR {r.ewsStatus} · {fmtBand(ewsStatusToBand(r.ewsStatus)).en} · {fmtBand(ewsStatusToBand(r.ewsStatus)).th}</strong> : "DWR status unavailable · ไม่มีสถานะ DWR"}</p>
            <p>Rain ฝน: 24 h {fmt(r.rain24hMm)} mm · 1 h {fmt(r.rain1hMm)} mm · Soil ดิน {fmt(r.soilPct)}%</p>
            <p className="ffa__meta">Observed วัดเมื่อ <time dateTime={r.observedAt}>{new Date(r.observedAt).toLocaleString("en-GB", {timeZone:"Asia/Bangkok", hour12:false})} ICT</time></p>
            <a className="btn" href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">Station map · แผนที่สถานี</a>
            <p className="ffa__meta">Experimental score: {r.ffpi.band === "unknown" ? "Unknown" : `${r.ffpi.score.toFixed(1)}/10`} · — = unknown, never zero</p>
          </li>)}
        </ul>
        <footer className="ffa__foot">
          <p>Experimental screening, not ONWR FFPI or an official order. Missing inputs limit interpretation. DWR severity is never downgraded. Stations are not merged across an amphoe.</p>
          <details><summary>Scoring method · วิธีคำนวณ</summary><p>Rain 24 h bands: 1/35/90/150 mm → 0.5/1/2/3 points; rain 1 h: 1/15/35 mm → 0.5/1.5/2.5 points; soil 50/70/85% → 1/2/3 points. DWR status contributes 0–3. Total capped at 10; DWR 1/2/3 enforces a floor of 2/4/6. Bands: 0–&lt;2 normal, 2–&lt;4 watch, 4–&lt;6 prepare, ≥6 critical. This is an uncalibrated screening heuristic, not a probability.</p><p>DWR rain since 07:00 and rain of unverified duration are excluded from hourly/24 h scoring. Source: HII ThaiWater (rain), DWR EWS (soil/status).</p></details>
        </footer>
      </Dialog>,
      document.body,
      )}
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
