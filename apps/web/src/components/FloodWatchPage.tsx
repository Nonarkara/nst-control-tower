import { freshTimestamp } from "../lib/floodFreshness";
import { FLOOD_BULLETIN } from "../lib/floodBulletin";
import { useEffect, useState } from "react";
import type { EwsStation, FloodOperations, RainfallStation, WaterGauge } from "@nst/shared";
import { API_BASE } from "../lib/apiBase";
import { useFeed } from "../hooks/useFeed";
import { ewsAlertState, ewsSoilState, ewsStatusLine, ewsStatusLineEn, ewsWaterRows, SOIL_PRIMED, type EwsWaterRow } from "../lib/ewsOfficial";
import type { CctvCamera } from "../map/layers";
import { CameraWaterWatch } from "./CameraWaterWatch";
import "../styles/flood-watch.css";

const date = (s: string | null | undefined) => s && Number.isFinite(Date.parse(s)) ? new Date(s).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) : "ไม่มีเวลาอ้างอิง";
const mm = (n: number | null | undefined) => n != null && Number.isFinite(n) ? n.toFixed(1) : "—";
const metres = (n: number | null | undefined) => n != null && Number.isFinite(n) ? n.toFixed(2) : "—";
const age = (s: string, now: number) => Math.max(0, Math.floor((now - Date.parse(s)) / 60_000));
const FRESH_MS = 90 * 60_000;
const current = <T extends { observedAt: string }>(rows: T[], now: number) => rows.filter(r => freshTimestamp(r.observedAt, now, FRESH_MS));
const isStale = (observedAt: string | null | undefined, now: number) => !freshTimestamp(observedAt, now, FRESH_MS);
export const freeboard = (g: WaterGauge) => g.diffFromBank != null ? -g.diffFromBank : null;
export const priority = (gauges: WaterGauge[]) => [...gauges].sort((a, b) => (freeboard(a) ?? Infinity) - (freeboard(b) ?? Infinity));
export const wettest = (rain: RainfallStation[]) => [...rain].filter(r => r.rain24h != null).sort((a, b) => b.rain24h! - a.rain24h!);

/**
 * What the operator must see, and how much of it is current.
 *
 * EVERY station is shown. A reading that is 95 minutes old is still the best
 * evidence there is about that river, and the table already carries the
 * observation time and its age on every row — so nothing is presented as
 * current that is not.
 *
 * Filtering to the fresh stations only meant that when the gauges went
 * quiet — exactly when the water is coming — the river table emptied, the
 * near-bank warning disappeared with it, and the page said "cannot
 * summarise the situation" while 22 stations were sitting right there in
 * the payload. The page's own rule says "Incomplete coverage does not
 * cancel observed near-bank water"; that rule was not reachable, because
 * the near-bank check ran on the fresh subset.
 */
export function selectForBriefing(gauges: WaterGauge[], rain: RainfallStation[], now: number) {
  const freshWater = current(gauges, now);
  const freshRain = current(rain, now);
  const ordered = priority(gauges);
  return {
    gauges: ordered,
    rain: wettest(rain),
    freshWater,
    freshRain,
    near: ordered.filter(g => freeboard(g) != null && freeboard(g)! <= 0.3),
    staleWater: gauges.length - freshWater.length,
    staleRain: rain.length - freshRain.length,
  };
}

function brief(data: FloodOperations, now: number, ews?: { status: string; stations: EwsWaterRow[] }) {
  const gauges = priority(data.gauges).slice(0, 5);
  const rain = wettest(data.rain).slice(0, 4);
  const freshWater = current(data.gauges, now).length; const freshRain = current(data.rain, now).length;
  // The official warning state comes first: it is the only statement on this
  // page that carries the authority's own judgement, and the mayor must not
  // have to infer it from a table of levels.
  const ewsLines = ews ? [
    ews.status,
    ...ews.stations.map(r => `• ${r.station.name} (${r.station.amphoe}) ระดับน้ำ ${r.level.toFixed(2)} ม. · เกณฑ์เตือน อต. ${r.alertLevel.toFixed(2)} ม. · ${r.margin <= 0 ? `ถึง/เกินเกณฑ์ ${Math.abs(r.margin).toFixed(2)} ม.` : `เหลือ ${r.margin.toFixed(2)} ม.`} · วัด ${date(r.station.observedAt)} (${age(r.station.observedAt, now)} นาที${r.current ? "" : " · ล้าสมัย"})`),
  ] : [];
  return ["บันทึกเฝ้าระวังน้ำท่วมเพื่อประกอบการตัดสินใจ — เทศบาลนครนครศรีธรรมราช", `จัดทำ ${new Date(now).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} · ข้อมูลประมวลผล ${data.generatedAt}`, "ไม่ใช่ประกาศราชการ และไม่ใช่การคาดการณ์น้ำท่วมรายถนน", `${FLOOD_BULLETIN.title} ออก ${date(FLOOD_BULLETIN.issuedAt)}: ${FLOOD_BULLETIN.summary}`, `ต้องตรวจประกาศรอบใหม่หลัง ${date(FLOOD_BULLETIN.recheckAt)} ที่ ${FLOOD_BULLETIN.source}`, "", ...ewsLines, ...(ewsLines.length ? [""] : []), `สถานีที่รายงานภายใน 90 นาที: น้ำ ${freshWater}/${data.gauges.length} · ฝน ${freshRain}/${data.rain.length} (ที่เหลือเก่ากว่านั้น แสดงพร้อมอายุของการวัด)`, "", "ข้อสังเกตจากสถานี (ปริมาณฝนสะสม 24 ชั่วโมง ไม่ใช่ฝนที่จะตกเพิ่ม):", ...(rain.length ? [] : ["• ไม่มีข้อมูลสถานีฝนเลย — ประเมินไม่ได้"]), ...rain.map(r => `• ${r.name} (${r.amphoe}) ${mm(r.rain24h)} มม./24 ชม. · วัด ${date(r.observedAt)} (${age(r.observedAt, now)} นาที${isStale(r.observedAt, now) ? " · ล้าสมัย" : ""})`), "", "จุดติดตามระดับน้ำ:", ...(gauges.length ? [] : ["• ไม่มีข้อมูลสถานีน้ำเลย — ประเมินไม่ได้"]), ...gauges.map(g => `• ${g.name} ${g.stationCode ?? ""}: ${freeboard(g) == null ? "ไม่ทราบระยะถึงตลิ่ง" : freeboard(g)! <= 0 ? `เหนือ/ถึงตลิ่ง ${metres(-freeboard(g)!)} ม.` : `เหลือถึงตลิ่ง ${metres(freeboard(g))} ม.`} · แนวโน้ม ${g.trend} · วัด ${date(g.observedAt)} (${age(g.observedAt, now)} นาที${isStale(g.observedAt, now) ? " · ล้าสมัย" : ""})`), "", `แบบจำลองฝนล่วงหน้า (ไม่ใช่ฝนตรวจวัด) ดึงเมื่อ ${date(data.weatherFetchedAt)}${!freshTimestamp(data.weatherFetchedAt, now, 30 * 60_000) ? " — ข้อมูลล้าหลัง/ขาด ไม่ใช้เป็นพยากรณ์ปัจจุบัน" : ""}:`, ...data.weather.map(p => `• ${p.nameTh}: 6 ชม. ${mm(p.rain6hMm)} / 12 ชม. ${mm(p.rain12hMm)} / 24 ชม. ${mm(p.rain24hMm)} มม. · สูงสุดรายชั่วโมง ${mm(p.peakHourMm)} มม. เวลา ${date(p.peakAt)}`), "", `ดัชนีฝนก่อนหน้า FloodDash: ${data.context.wetness ? `${data.context.wetness.band}, API ${data.context.wetness.api} (ดัชนี ไม่ใช่ค่าความชื้นดินตรวจวัด)` : "ไม่มีข้อมูล"}`, "ภูมิประเทศ: ต้นน้ำท่าดีฝั่งตะวันออกเขาหลวง–คีรีวง/ลานสกา → คลองเข้าเมือง → ปากนคร/อ่าวไทย; ลุ่มน้ำตาปีและคลองกลายแยกจากเส้นทางนี้ ห้ามบวกน้ำข้ามสันปันน้ำ", "ข้อเสนอการปฏิบัติ: จัดเวรติดตามต้นน้ำ–คลองในเมือง–ทางออกทะเล; ตรวจเครื่องสูบ ทางระบาย จุดอุดตัน และเส้นทางเข้าถึงกลุ่มเปราะบาง; ยืนยันระดับใกล้ตลิ่งกับเจ้าหน้าที่ก่อนตัดสินใจ; ไม่ใช้ภาพมืดหรือการไม่มีสัญญาณ CV เป็นหลักฐานว่าปลอดภัย", `ช่องว่างข้อมูล: ${data.gaps.join("; ") || "ตรวจเวลาอ้างอิงแต่ละแหล่งด้านล่าง"}`, "ติดตามประกาศ อต. 1182 / ปภ. 1784 / อปท. ในพื้นที่", "https://www.tmd.go.th/warning-and-events/warning-storm", "https://nakhonsithammarat.thaiwater.net/wl", "https://flood.nonarkara.org/", "https://nst.nonarkara.org/flood-ops"].join("\n");
}

export default function FloodWatchPage() {
  const feed = useFeed<FloodOperations>(`${API_BASE}/api/flood/operations`, 60_000, 25_000);
  const cameras = useFeed<CctvCamera>(`${API_BASE}/api/cctv/nst-municipality`, 5 * 60_000);
  // DWR's early-warning network — the only source here that carries the
  // authority's own alert tier and per-station alert level. It reached the
  // map lens but never this briefing.
  const ewsFeed = useFeed<EwsStation>(`${API_BASE}/api/water/ews`, 60_000, 25_000);
  const [now, setNow] = useState(Date.now());
  const [english, setEnglish] = useState(false);
  const [copy, setCopy] = useState("");
  useEffect(() => { document.documentElement.lang = "th"; document.title = "เฝ้าระวังน้ำท่วม นครศรีธรรมราช | NST"; const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);
  const data = feed.data[0];
  const { gauges, rain, freshWater, freshRain, near, staleWater, staleRain } = selectForBriefing(data?.gauges ?? [], data?.rain ?? [], now);
  const stale = !data || !freshWater.length || !freshRain.length || !freshTimestamp(data.generatedAt, now, 15 * 60_000) || !!feed.error || data.waterMeta.fallbackTier !== "live" || data.rainMeta.fallbackTier !== "live";
  const modelOld = !freshTimestamp(data?.weatherFetchedAt, now, 30 * 60_000);
  const highest = gauges[0];
  const ewsAlert = ewsAlertState(ewsFeed.data);
  const ewsRows = ewsWaterRows(ewsFeed.data, now);
  const ewsAtLevel = ewsRows.filter(r => r.margin <= 0);
  const ewsOld = ewsRows.filter(r => !r.current);
  const ewsSoil = ewsSoilState(ewsFeed.data);
  const ewsStatus = ewsStatusLine(ewsAlert, { fromSnapshot: ewsFeed.fallbackTier === "cache" });
  const ewsStatusEn = ewsStatusLineEn(ewsAlert, { fromSnapshot: ewsFeed.fallbackTier === "cache" });
  const nearStatus = near.length ? `${near.length} สถานีใกล้/ถึงตลิ่ง: ให้ตรวจยืนยันต่อเนื่อง` : stale ? "ข้อมูลขาดช่วง/กำลังโหลด — ยังสรุปสถานการณ์ไม่ได้" : "ติดตามสถานีและฝนต่อเนื่อง — ไม่มีสัญญาณไม่เท่ากับปลอดภัย";
  return <main className="flood-watch" lang="th">
    <header className="flood-watch-head"><a href="/">NST · กลับแผนที่เมือง</a><span>ศูนย์เฝ้าระวังน้ำท่วม · Asia/Bangkok</span><div className="flood-watch-actions"><button onClick={() => void feed.refetch()}>ปรับปรุงข้อมูล</button><button disabled={!data} onClick={async () => { try { await navigator.clipboard.writeText(brief(data!, now, { status: ewsStatus, stations: ewsRows.slice(0, 3) })); setCopy("คัดลอกบันทึกพร้อมเวลาและแหล่งข้อมูลแล้ว"); } catch { setCopy("คัดลอกไม่ได้ — ใช้พิมพ์ / บันทึก PDF"); } }}>คัดลอกส่งนายกฯ</button><button onClick={() => window.print()}>พิมพ์ / PDF</button></div></header>
    <h1>เฝ้าระวังต้นน้ำ · ตรวจคลองเมือง · ดูทางออกทะเล</h1>
    <p className="flood-watch-intro">นครศรีธรรมราช — ใช้หลักฐานที่มีเวลาอ้างอิงประกอบการจัดเวรและตรวจพื้นที่ ไม่ใช่ประกาศราชการ ไม่ยืนยันเวลา/ความลึกน้ำท่วมรายถนน</p>
    {copy && <p role="status">{copy}</p>}
    <div className={`flood-watch-status ${near.length || ewsAlert.maxTier >= 1 ? "flood-watch-status--watch" : ""}`} role="status"><strong>{ewsAlert.maxTier >= 1 ? ewsStatus : nearStatus}</strong>{ewsAlert.maxTier >= 1 && <span>{nearStatus}</span>}{ewsAlert.maxTier < 1 && <span className="flood-watch-official">{ewsStatus}</span>}{near.length > 0 && stale && <span>ข้อมูลบางแหล่งขาดช่วง — ไม่ลบล้างระดับน้ำที่ตรวจวัดได้ / Incomplete coverage does not cancel observed near-bank water.</span>}<span>ประมวลผล {date(data?.generatedAt)} · น้ำ {freshWater.length}/{data?.gauges.length ?? 0} และฝน {freshRain.length}/{data?.rain.length ?? 0} สถานีอายุไม่เกิน 90 นาที</span></div>
    <div className="flood-watch-actions" role="group" aria-label="Briefing language">
      <button type="button" aria-pressed={!english} onClick={() => setEnglish(false)}>รายละเอียดภาษาไทย</button>
      <button type="button" aria-pressed={english} onClick={() => setEnglish(true)}>English summary</button>
    </div>
    {english && <section lang="en" aria-label="English operational summary">
      <h2>Water, rain and the next action</h2>
      <p><strong>{near.length ? `${near.length} reporting stations are within 0.30 m of the bank or above it. Verify with local officers now.` : stale ? "Incomplete observations — current flood conditions cannot be established." : "Keep checking water levels and rainfall. No signal does not mean safe."}</strong></p>
      <p>Province-wide station screening, not a street flood forecast. The 0.30 m margin is a local review policy, not an official warning threshold. Not all provincial rivers flow into the city.</p>
      <p><strong>Official DWR early warning — {ewsStatusEn}</strong> The alert tier and each station's alert level are DWR's own: they are neither the local 0.30 m review policy nor a distance to bank, and they cover village stations the river gauges do not.</p>
      {ewsRows.length > 0 && <><h3>DWR water-level stations · each station against DWR's own alert level</h3><div className="flood-watch-table"><table><thead><tr><th>Station</th><th>Level (m)</th><th>DWR alert (m)</th><th>Margin</th><th>Observed</th></tr></thead><tbody>{ewsRows.slice(0, 10).map(r => <tr key={r.station.id}><th>{r.station.name}<small>{r.station.amphoe}</small></th><td>{r.level.toFixed(2)}</td><td>{r.alertLevel.toFixed(2)}</td><td className={r.margin <= 0 ? "flood-watch-alert" : undefined}>{r.margin <= 0 ? `at/over ${Math.abs(r.margin).toFixed(2)} m` : `${r.margin.toFixed(2)} m`}</td><td>{date(r.station.observedAt)}<small>{r.ageMinutes} min{r.current ? "" : " · stale"}</small></td></tr>)}</tbody></table></div></>}
      <h3>Observed water · metres below bank (negative = above bank)</h3>
      <div className="flood-watch-table"><table><thead><tr><th>Station</th><th>To bank (m)</th><th>Trend</th><th>Observed (source time)</th></tr></thead><tbody>{gauges.slice(0, 10).map(g => <tr key={g.id}><th>{g.name}<small>{g.stationCode}</small></th><td>{metres(freeboard(g))}</td><td>{g.trend}</td><td>{date(g.observedAt)}<small>{age(g.observedAt, now)} นาที{isStale(g.observedAt, now) ? " · ล้าสมัย" : ""}</small></td></tr>)}</tbody></table></div>
      {!gauges.length && <p>No water observations within 90 minutes. River conditions are unknown.</p>}
      <h3>Observed rainfall · previous 24 hours</h3>
      <div className="flood-watch-table"><table><thead><tr><th>Station</th><th>24 h (mm)</th><th>Observed (source time)</th></tr></thead><tbody>{rain.slice(0, 10).map(r => <tr key={r.id}><th>{r.name}</th><td>{mm(r.rain24h)}</td><td>{date(r.observedAt)}<small>{age(r.observedAt, now)} นาที{isStale(r.observedAt, now) ? " · ล้าสมัย" : ""}</small></td></tr>)}</tbody></table></div>
      {!rain.length && <p>No recent rainfall observations. This does not establish that rain has stopped.</p>}
      <h3>Forecast model · separate from measurements</h3>
      <p>{modelOld ? "Forecast retrieval is stale, missing or has an invalid timestamp. Do not use old values as a current forecast." : `Open-Meteo retrieved ${data?.weatherFetchedAt}. Model guidance is not radar or a calibrated inundation prediction.`}</p>
      {!modelOld && <ul>{data?.weather.map(p => <li key={p.key}>{p.nameTh}: next 6 / 12 / 24 h = {mm(p.rain6hMm)} / {mm(p.rain12hMm)} / {mm(p.rain24hMm)} mm.</li>)}</ul>}
      <p>Measured soil moisture from DWR: {ewsSoil.measured} stations report it, {ewsSoil.primed} at or above {SOIL_PRIMED}% (primed ground){ewsSoil.measured ? `, wettest ${ewsSoil.wettest[0]?.name} at ${Math.round(ewsSoil.wettest[0]?.soilMoisture ?? 0)}%` : ""}. Saturated ground is a precursor to runoff, not a warning.</p>
      <h3>Duty actions</h3><ul><li>Check the Tha Dee headwaters east of Khao Luang, city canals and Pak Nakhon outlet; do not combine flows across watershed divides.</li><li>Inspect pumps, blocked drains, backup power and access to vulnerable residents.</li><li>Confirm near-bank readings with field staff and follow the local emergency plan.</li><li>Dark, stale or unchanged camera images cannot establish safety. Camera comparison requires an operator and human verification.</li></ul>
      <p>{stale ? "Some water/rain observations or synthesis data are missing or old. " : ""}Fresh water stations: {freshWater.length}; fresh rain stations: {freshRain.length}. Refreshing the page does not refresh an observation.</p>
      <p><a href="https://www.tmd.go.th/warning-and-events/warning-storm">Read the latest official TMD warning</a>. The bulletin dated {FLOOD_BULLETIN.issuedAt} on this page is historical once its recheck time has passed. Official decisions remain with local authorities.</p>
      <p>Use the Thai detail view for camera comparison, geography and full source gaps. The copy button produces a Thai briefing for the mayor.</p>
    </section>}
    <div hidden={english} className="flood-watch-layout"><section className="flood-watch-main">
      <section aria-label="ระดับน้ำที่ต้องติดตาม"><h2>ระยะถึงตลิ่งจากสถานีตรวจวัด</h2>{staleWater > 0 && <p className="flood-watch-gap">บางสถานีเก่ากว่า 90 นาที ({staleWater} สถานี) — แสดงค่าล่าสุดที่มี พร้อมอายุของการวัด ไม่ใช่ค่าปัจจุบัน</p>}{highest && freeboard(highest) != null && <p className="flood-watch-focal"><b>{freeboard(highest)! <= 0 ? "ถึง/เกินตลิ่ง" : `${Math.round(freeboard(highest)! * 100)} ซม.`}</b><span>{highest.name} · {highest.stationCode} · {freeboard(highest)! > 0 ? "เหลือถึงตลิ่งที่สถานีนี้" : "ตรวจยืนยันกับเจ้าหน้าที่"} · วัด {date(highest.observedAt)} ({age(highest.observedAt, now)} นาที{isStale(highest.observedAt, now) ? " · ล้าสมัย" : ""})</span></p>}<p>เรียงจากระยะถึงตลิ่งน้อยสุดทั้งจังหวัด ไม่ใช่ทุกสถานีไหลเข้าตัวเมือง · เกณฑ์ 30 ซม. ใช้คัดงานตรวจของเวร ไม่ใช่เกณฑ์เตือนภัยราชการ</p><div className="flood-watch-table"><table><thead><tr><th>สถานี / ทางน้ำ</th><th>ถึงตลิ่ง (ม.)</th><th>แนวโน้ม</th><th>เวลา / อายุ</th></tr></thead><tbody>{gauges.slice(0, 10).map(g => <tr key={g.id}><th><a href={`https://www.google.com/maps?q=${g.lat},${g.lng}`} target="_blank" rel="noreferrer">{g.name}</a><small>{g.stationCode} · {g.riverName || g.amphoe}</small></th><td>{freeboard(g) == null ? "—" : metres(freeboard(g))}</td><td>{({ rising: "เพิ่ม", falling: "ลด", stable: g.levelPrev != null ? "ทรงตัว" : "ไม่ยืนยันแนวโน้ม" })[g.trend] ?? "ไม่ทราบ"}</td><td>{date(g.observedAt)}<small>{age(g.observedAt, now)} นาที{isStale(g.observedAt, now) ? " · ล้าสมัย" : ""}</small></td></tr>)}</tbody></table></div>{!gauges.length && <p>ไม่มีข้อมูลสถานีน้ำเลย — ห้ามอ่านว่าแม่น้ำปกติ</p>}</section>
      <section aria-label="สถานีระดับน้ำ อต. เทียบเกณฑ์เตือนของ อต.">
        <h2>สถานีระดับน้ำ อต. — เทียบกับเกณฑ์เตือนของ อต. เอง</h2>
        <p>อต. กำหนดระดับที่จะยกระดับเตือนไว้เองทุกสถานี เป็นเกณฑ์ของหน่วยงาน ไม่ใช่ระยะถึงตลิ่งของตารางข้างบน และไม่ใช่เกณฑ์ 30 ซม. ที่เราใช้คัดงานตรวจของเวร</p>
        {ewsRows.length > 0 ? <>
          <p className={ewsAtLevel.length ? "flood-watch-alert" : undefined}>
            {ewsRows.length} สถานีที่มีเกณฑ์ของ อต. เอง · {ewsAtLevel.length ? `${ewsAtLevel.length} ถึง/เกินเกณฑ์แล้ว` : "ยังไม่มีสถานีใดถึงเกณฑ์"}{ewsOld.length ? ` · อีก ${ewsOld.length} ไม่ได้รายงานเกิน 2 ชม. (แสดงค่าล่าสุดที่มีพร้อมอายุ ไม่ใช่ค่าปัจจุบัน)` : ""}
          </p>
          <div className="flood-watch-table"><table>
            <thead><tr><th>สถานี / อำเภอ</th><th>ระดับน้ำ (ม.)</th><th>เกณฑ์ อต. (ม.)</th><th>เหลือถึงเกณฑ์</th><th>วัดเมื่อ</th></tr></thead>
            <tbody>{ewsRows.slice(0, 10).map(r => <tr key={r.station.id}>
              <th><a href={`https://www.google.com/maps?q=${r.station.lat},${r.station.lng}`} target="_blank" rel="noreferrer">{r.station.name}</a><small>{r.station.amphoe}</small></th>
              <td>{r.level.toFixed(2)}</td>
              <td>{r.alertLevel.toFixed(2)}</td>
              <td className={r.margin <= 0 ? "flood-watch-alert" : undefined}>{r.margin <= 0 ? `ถึง/เกินเกณฑ์ ${Math.abs(r.margin).toFixed(2)} ม.` : `เหลือ ${r.margin.toFixed(2)} ม.`}</td>
              <td>{date(r.station.observedAt)}<small>{r.ageMinutes} นาที{r.current ? "" : " · ล้าสมัย"}</small></td>
            </tr>)}</tbody>
          </table></div>
        </> : <p className="flood-watch-gap">ไม่มีข้อมูลสถานี อต. — ยืนยันระดับน้ำตามเกณฑ์ของ อต. ไม่ได้</p>}
      </section>
      <section><h2>ฝนตรวจวัด — เห็นจุดหนัก ไม่กลบด้วยค่าเฉลี่ย</h2><p>สะสม 24 ชั่วโมงย้อนหลัง ณ เวลาที่สถานีรายงาน ห้ามบวกรายงานสะสมซ้ำเป็นฝนหลายวัน · ≥90.1 มม. คือฝนหนักมากตามเกณฑ์ อต. ไม่ใช่คำสั่งอพยพ</p><div className="flood-watch-table"><table><thead><tr><th>สถานี / อำเภอ</th><th>24 ชม. (มม.)</th><th>1 ชม. (มม.)</th><th>วัดเมื่อ</th></tr></thead><tbody>{rain.slice(0, 10).map(r => <tr key={r.id}><th>{r.name}<small>{r.amphoe}</small></th><td>{mm(r.rain24h)}</td><td>{mm(r.rain1h)}</td><td>{date(r.observedAt)}<small>{age(r.observedAt, now)} นาที{isStale(r.observedAt, now) ? " · ล้าสมัย" : ""}</small></td></tr>)}</tbody></table></div>{!rain.length && <p>ไม่มีข้อมูลฝนตรวจวัดเลย — ไม่สรุปว่าฝนหยุด</p>}</section>
      <section><h2>โครงสร้างฝนล่วงหน้า: ภูเขา → เมือง → ชายฝั่ง</h2><p>Open-Meteo แบบจำลองรายชั่วโมง ประเมินแยก 6 จุดจากชั่วโมงเต็มถัดไป ใช้เทียบตำแหน่งและช่วงเวลาที่ฝนอาจหนัก ไม่ใช่เรดาร์ตรวจฝนหรือเส้นทางน้ำไหลจริง · ทิศลมระบุทิศที่ลมพัดมา</p>{modelOld && <p className="flood-watch-gap">แบบจำลองล้าหลัง/ขาดข้อมูล — อย่าใช้ตัวเลขเดิมเป็นพยากรณ์ปัจจุบัน</p>}<div className="flood-watch-table"><table><thead><tr><th>พื้นที่คัดกรอง</th><th>6 / 12 / 24 ชม. (มม.)</th><th>หนักสุดรายชั่วโมง</th><th>ลม 10 ม.</th></tr></thead><tbody>{data?.weather.map(p => <tr key={p.key}><th>{p.nameTh}</th><td>{mm(p.rain6hMm)} / {mm(p.rain12hMm)} / {mm(p.rain24hMm)}</td><td>{mm(p.peakHourMm)} มม.<small>{date(p.peakAt)}</small></td><td>{p.windFromDeg == null ? "—" : `${Math.round(p.windFromDeg)}°`} / {mm(p.windKmh)} กม./ชม.</td></tr>)}</tbody></table></div><details className="flood-watch-radar"><summary>เปิดเรดาร์สทิงพระจาก อต. — อ่านเวลาที่พิมพ์บนภาพ (UTC + 7 = เวลาไทย)</summary><a href="https://weather.tmd.go.th/stp240_HQ_edit2.php" target="_blank" rel="noreferrer"><img loading="lazy" src={`https://weather.tmd.go.th/stp/stp240_HQ_latest.jpg?t=${Math.floor(now / 300000)}`} alt="เรดาร์สทิงพระจากกรมอุตุนิยมวิทยา ต้องอ่านเวลาต้นทางบนภาพ" /></a><p>ภาพเรดาร์หนึ่งภาพไม่ยืนยันการเคลื่อนตัวของกลุ่มฝน อ่านภาพเคลื่อนไหวและดูภูเขาบังสัญญาณร่วมด้วย</p></details><p><a href="https://weather.tmd.go.th/" target="_blank" rel="noreferrer">ตรวจเรดาร์ อต. เพื่อดูการเคลื่อนตัวกลุ่มฝนจริง</a> · แบบจำลองจุดไม่สามารถยืนยันแนวฝนหรือทิศทางน้ำไหลได้</p><p>ดึงแบบจำลอง {date(data?.weatherFetchedAt)} · ตัวเลขที่ขาดแสดง — ไม่แทนด้วยศูนย์ · ฝน 0 จากแบบจำลองไม่ลบล้างประกาศ อต. และไม่ใช่การยืนยันว่าปลอดภัย</p></section>
      <CameraWaterWatch cameras={cameras.data} />
    </section><aside className="flood-watch-aside">
      <section><h2>เส้นทางน้ำและพื้นที่ซ้ำซาก</h2><ol className="flood-watch-flow"><li><b>ต้นน้ำเขาหลวงฝั่งตะวันออก</b><span>คีรีวง–ลานสกา: ฝนบนภูเขาและน้ำป่าอาจมาก่อนฝนในเมือง</span></li><li><b>คลองท่าดี → คลองในเมือง</b><span>ตรวจคอขวด สะพาน ขยะ และจุดสูบในคลองหน้าเมือง–ท่าวัง–คูพาย โดยใช้ข้อมูลภาคสนามยืนยันการเชื่อมต่อจริง</span></li><li><b>ที่ลุ่มปากนคร → อ่าวไทย</b><span>ระดับปลายน้ำและน้ำทะเลสูงอาจชะลอการระบาย แม้ฝนในเมืองลดลง</span></li></ol><p><b>อย่าบวกน้ำข้ามสันปันน้ำ:</b> ตาปีฝั่งตะวันตก คลองกลายทางเหนือ และปากพนังทางใต้เป็นคนละเส้นทาง ต้องติดตามแยกกัน ไม่อ้างว่าไหลรวมเข้าท่าดีทั้งหมด</p><p>พื้นที่ซ้ำซากเป็นจุดจัดลำดับการตรวจ ไม่ใช่ขอบเขตน้ำท่วมคืนนี้ แผนที่ย้อนหลังในระบบบางชั้นเป็นภาพร่างจากเหตุการณ์เก่า ไม่ใช่ขอบเขตดาวเทียมที่ตรวจคืนนี้</p><p>ประวัติ 27 พ.ย. 2567: จังหวัดรายงานน้ำจากลานสกาเข้าพื้นที่ริมคลองเมือง และใช้เครื่องผลักดันน้ำที่คลองนครน้อย–ถนนพัฒนาการคูขวาง เป็นจุดตรวจซ้ำที่มีหลักฐาน ไม่ใช่คำทำนายคืนนี้ · <a href="https://nakhonsithammarat.prd.go.th/th/content/category/detail/id/13/cid/9/iid/343073" target="_blank" rel="noreferrer">รายงานจังหวัดต้นทาง</a></p><a href="https://flood.nonarkara.org/" target="_blank" rel="noreferrer">เปิด FloodDash ดูบริบทจังหวัด/ลุ่มน้ำ</a></section>
      <section><h2>ดินรับฝนมาแล้วแค่ไหน</h2>{ewsSoil.measured > 0 ? <p><b>วัดจริงจาก อต.:</b> ความชื้นดิน {ewsSoil.measured} สถานี · {ewsSoil.primed} สถานีอยู่ที่หรือเกิน {SOIL_PRIMED}% (ดินอิ่มตัว เกณฑ์เดียวกับแผนที่) · สูงสุด {ewsSoil.wettest[0]?.name} {Math.round(ewsSoil.wettest[0]?.soilMoisture ?? 0)}%</p> : <p className="flood-watch-gap">ไม่มีค่าความชื้นดินที่วัดจริงจาก อต. ในรอบนี้ — ดัชนีด้านล่างเป็นตัวแทน ไม่ใช่ค่าที่วัด</p>}<p><b>ดัชนีฝนก่อนหน้า (ตัวแทน):</b> {data?.context.wetness ? `FloodDash จัดดัชนีฝนก่อนหน้าเป็น ${data.context.wetness.band} (API ${data.context.wetness.api}) ณ ${date(data.context.wetness.asOf)}` : "ดัชนีฝนก่อนหน้าขาดข้อมูล"}</p><p>ดัชนีเป็นตัวแทนจากประวัติฝน ไม่ใช่ค่าความชื้นดินจากเครื่องวัด และห้ามนำฝนสะสม 24 ชม. หลายชุดมาบวกซ้ำ</p>{data?.context.rainTrend && <p>ค่าเฉลี่ยรายสถานีสัปดาห์นี้เทียบก่อนหน้า {data.context.rainTrend.ratio == null ? "—" : `${data.context.rainTrend.ratio} เท่า`} · {data.context.rainTrend.band} · ค่าเฉลี่ยจังหวัดไม่แทนฝนต้นน้ำแต่ละจุด</p>}</section>
      <section><h2>ทะเลและปลายน้ำ 12 ชั่วโมง</h2>{data?.tide ? <p>แบบจำลองระดับทะเลสูงสุด {metres(data.tide.peakMslM)} ม. MSL เวลา {date(data.tide.peakAt)} · เป็นระดับทะเลแบบจำลองที่จุดชายฝั่ง ไม่ใช่ระดับน้ำที่คลองหรือสถานี PTTEP3 และไม่บวกกับค่ามาตรวัดคลองตรง ๆ</p> : <p>ไม่มีแบบจำลองทะเลที่ครบพอ — ตรวจสถานีชายฝั่ง/ประตูน้ำจริง</p>}</section>
      <section><h2>ประกาศราชการ / เวรคืนนี้</h2><p><b>{FLOOD_BULLETIN.title}</b> ออก {date(FLOOD_BULLETIN.issuedAt)}</p><p>{FLOOD_BULLETIN.summary}</p><p className={now >= Date.parse(FLOOD_BULLETIN.recheckAt) ? "flood-watch-gap" : ""}>{now >= Date.parse(FLOOD_BULLETIN.recheckAt) ? "ถึงรอบประกาศใหม่แล้ว: ข้อความข้างต้นเป็นข้อมูลอ้างอิงเก่า ต้องอ่านประกาศล่าสุด" : `ตรวจประกาศรอบใหม่ ${date(FLOOD_BULLETIN.recheckAt)} — หน้าเว็บนี้ไม่ได้ต่ออายุประกาศให้เอง`}</p><a href="https://www.tmd.go.th/warning-and-events/warning-storm" target="_blank" rel="noreferrer">อ่านประกาศล่าสุดจากกรมอุตุนิยมวิทยา</a><p>ดึงพยากรณ์ TMD ผ่าน FloodDash เมื่อ: {date(data?.context.tmd?.fetchedAt)}</p>{data?.context.tmd?.days.slice(0, 2).map(d => <p key={d.date}>{d.date}: {d.cond_th} · พื้นที่มีฝน {d.rain_pct ?? "—"}% (ไม่ใช่โอกาสน้ำท่วม)</p>)}<ul><li>จัดคนติดตามต้นน้ำ–คลองเมือง–ปากนครเป็นวงรอบ</li><li>ถ้าระดับถึง/เกินตลิ่ง หรือเพิ่มเร็ว ให้ผู้มีอำนาจตรวจยืนยันและตัดสินใจตามแผนท้องถิ่น</li><li>ตรวจเครื่องสูบ ทางระบาย จุดอุดตัน ไฟฟ้าสำรอง และเส้นทางช่วยกลุ่มเปราะบาง</li><li>ภาพมืด/ข้อมูลขาด: โทรยืนยันเจ้าหน้าที่ประจำจุด ไม่ตีความว่าปลอดภัย</li></ul><p>ปภ. <b>1784</b> · อต. <b>1182</b><br />การสั่งการเป็นหน้าที่ของ ปภ./อปท. ไม่ใช่ CV</p></section>
      <section className="flood-watch-gaps"><h2>ช่องว่างข้อมูลที่ต้องรู้</h2><ul>{[...(data?.gaps ?? []), ...(feed.error ? [feed.error] : [])].map((g, i) => <li key={i}>{g}</li>)}</ul><p>สถานีน้ำที่เก่ากว่า 90 นาที {Math.max(0, (data?.gauges.length ?? 0) - freshWater.length)} · สถานีฝน {Math.max(0, (data?.rain.length ?? 0) - freshRain.length)} · การรีเฟรชหน้าไม่ทำให้เวลาสังเกตใหม่ขึ้น</p><p>กล้องกลุ่มน้ำ {data?.cameraCounts.online ?? 0} ออนไลน์ / {data?.cameraCounts.total ?? 0} ทั้งหมด · ออนไลน์ไม่ได้แปลว่าภาพอ่านได้</p><p>แหล่ง: HII ThaiWater ผ่าน FloodDash; ประวัติฝน/ดัชนี FloodDash; TMD ผ่าน FloodDash; แบบจำลอง Open-Meteo/Marine · สถานะและเวลาแยกตามแหล่ง</p></section>
    </aside></div>
    <footer>บันทึกสถานการณ์สำหรับเจ้าหน้าที่ — ส่งลิงก์นี้ได้ ข้อมูลเปลี่ยนตามเวลา กรุณาระบุเวลาบันทึกเมื่อส่งต่อ · <a href="/briefings/NST-Mayor-Flood-Brief-2026-10-20.pdf">PDF สำหรับนายกฯ — ภาพรวม ณ 20 ต.ค. 2569 เวลา 21:11 (ไม่ใช่ข้อมูลสด)</a> · <a href="https://nakhonsithammarat.thaiwater.net/wl">ตรวจสอบ HII ต้นทาง</a></footer>
  </main>;
}
