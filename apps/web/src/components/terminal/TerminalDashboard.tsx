import type { AirQualityPoint, IntelligenceItem, RainfallStation, WaterGauge } from "@nst/shared";
import { API_BASE } from "../../lib/apiBase";
import { useFeed } from "../../hooks/useFeed";
import { useLocale } from "../../hooks/useLocale";
import { PanelHeader } from "../PanelHeader";
import { SensorSituationBoard } from "../SensorSituationBoard";
import { safeUrl } from "../../lib/safeUrl";

/** Analyst view uses the same feeds and aggregation as the map. Grid estimates
 * and monitoring stations remain separate evidence with their own timestamps. */
export function TerminalDashboard({ onFlip }: { onFlip: () => void }) {
  const { t } = useLocale();
  const grid = useFeed<AirQualityPoint>(`${API_BASE}/api/air-quality`, 15 * 60_000);
  const stations = useFeed<AirQualityPoint>(`${API_BASE}/api/air-quality/air4thai`, 30 * 60_000);
  const gauges = useFeed<WaterGauge>(`${API_BASE}/api/water/gauges`, 10 * 60_000);
  const rain = useFeed<RainfallStation>(`${API_BASE}/api/water/rain`, 30 * 60_000);
  const news = useFeed<IntelligenceItem>(`${API_BASE}/api/news`, 3 * 60_000);
  const air = [...stations.data, ...grid.data];
  const feeds = [grid, stations, gauges, rain, news];
  const sensorFeeds = feeds.slice(0, 4);
  const sensorIncomplete = sensorFeeds.some(f => f.fallbackTier === "loading" || f.fallbackTier === "unavailable" || f.error);
  const incomplete = feeds.some(f => f.fallbackTier === "loading" || f.fallbackTier === "unavailable" || f.error);
  const number = (n: number | null | undefined) => n != null && Number.isFinite(n) ? n.toLocaleString("en-GB", { maximumFractionDigits: 1 }) : "—";
  const time = (s: string) => s || t({ en: "Observation time unknown", th: "ไม่ทราบเวลาตรวจวัด" });
  return <main className="term" aria-label="Analyst data view">
    <header className="term-head">
      <h1>{t({ en: "NST · Operational data", th: "NST · ข้อมูลปฏิบัติการ" })}</h1>
      <nav aria-label="Analyst navigation"><a href="/flood-ops">{t({ en: "Flood briefing", th: "บันทึกเฝ้าระวังน้ำท่วม" })}</a><a href="/data">{t({ en: "Data tables", th: "ตารางข้อมูล" })}</a><button type="button" className="term-flip" onClick={onFlip}>MAP</button></nav>
    </header>
    <div className="term-body">
      {incomplete && <p role="status">{t({ en: "Some sources are loading or unavailable. Missing readings do not establish safe conditions.", th: "บางแหล่งกำลังโหลดหรือขาดข้อมูล การไม่มีข้อมูลไม่ได้ยืนยันว่าปลอดภัย" })}</p>}
      <div className="term-grid">
        <div>
          <SensorSituationBoard waterGauges={gauges.data} rainfall={rain.data} airStations={air} ageMinutes={Math.max(...sensorFeeds.map(f => f.ageMinutes))} fallbackTier={sensorIncomplete ? "unavailable" : sensorFeeds.some(f => f.fallbackTier !== "live") ? "cache" : "live"} />
          <p className="term-note">{t({ en: "Air summary is the maximum across available stations and the model grid, matching the map’s Water & Air Details. Individual evidence is listed alongside; these values measure different places and times.", th: "สรุปอากาศใช้ค่าสูงสุดจากสถานีและกริดแบบจำลอง เช่นเดียวกับแผนที่ แต่ละแถวด้านข้างเป็นข้อมูลคนละตำแหน่งและเวลา" })}</p>
        </div>
        <section aria-label="Air evidence" className="term-panel">
          <h2>{t({ en: "Air · source comparison", th: "อากาศ · เปรียบเทียบแหล่งข้อมูล" })}</h2>
          {[{ title: "PCD · Air4Thai stations", feed: stations }, { title: "Open-Meteo · model grid estimate", feed: grid }].map(({ title, feed }) => <section key={title}>
            <PanelHeader title={title} source={feed.data[0]?.source} ageMinutes={feed.ageMinutes} fallbackTier={feed.fallbackTier === "loading" ? "unavailable" : feed.fallbackTier} />
            {feed.data.length ? feed.data.map(s => <div className="term-air-reading" key={`${s.source}:${s.station}`}>
              <h3>{s.station}</h3><p><b>{number(s.pm25)}</b> µg/m³ PM2.5 · AQI {number(s.aqi)}</p>
              <p>{t({ en: "Observed", th: "เวลาอ้างอิง" })}: <time>{time(s.observedAt)}</time></p>
            </div>) : <p>{t({ en: "No usable readings", th: "ไม่มีข้อมูลที่ใช้ได้" })}</p>}
          </section>)}
          <p className="term-note">{t({ en: "Station concentrations and grid estimates are not interchangeable. AQI scales and averaging periods follow each provider; no cross-provider conversion is implied. A fresh fetch does not make the observation newer.", th: "ค่าจากสถานีและกริดแบบจำลองใช้แทนกันไม่ได้ ดัชนี AQI และช่วงเฉลี่ยเป็นไปตามผู้ให้ข้อมูล การดึงข้อมูลใหม่ไม่ได้ทำให้เวลาตรวจวัดใหม่ขึ้น" })}</p>
        </section>
        <section className="term-panel term-news" aria-label="News evidence">
          <h2>{t({ en: "News · reported events", th: "ข่าว · เหตุการณ์ที่รายงาน" })}</h2>
          <PanelHeader title="News" source="multi-source" ageMinutes={news.ageMinutes} fallbackTier={news.fallbackTier === "loading" ? "unavailable" : news.fallbackTier} />
          {news.data.length ? <ul>{news.data.slice(0, 8).map(n => <li key={n.id}>{safeUrl(n.sourceUrl) ? <a href={safeUrl(n.sourceUrl)!} target="_blank" rel="noreferrer">{n.title}</a> : n.title} <time>{n.publishedAt}</time></li>)}</ul> : <p>{t({ en: "No reports available; this is not an all-clear.", th: "ไม่มีรายงานที่ใช้ได้ ไม่ใช่การยืนยันว่าปลอดภัย" })}</p>}
        </section>
      </div>
    </div>
  </main>;
}
