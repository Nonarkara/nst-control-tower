import { useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Whitepaper — bilingual (Thai + English) platform overview, architecture,
 * data sources, and usage guide for NST-CTM-01.
 * Triggered from the TopBar "WP" button.
 */
export function Whitepaper({ open, onClose }: Props) {
  const containerRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="manual-backdrop" onClick={onClose}>
      <div
        ref={containerRef}
        className="manual whitepaper"
        role="dialog"
        aria-modal="true"
        aria-label="Nakhon Si Thammarat City Control Tower — Whitepaper"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="manual-head">
          <div className="col">
            <span className="eyebrow mono">Whitepaper · NST-CTM-01 · v0.1</span>
            <h2 className="manual-title">
              Nakhon Si Thammarat City Control Tower
              <span className="whitepaper-thai serif"> · ศูนย์ควบคุมเมืองนครศรีธรรมราช</span>
            </h2>
            <span className="caption" style={{ color: "var(--text-2)" }}>
              Platform Overview &amp; Research Paper · ภาพรวมแพลตฟอร์มและงานวิจัย
            </span>
          </div>
          <button onClick={onClose} className="mono manual-close" aria-label="Close whitepaper">
            [ESC] CLOSE
          </button>
        </header>

        <div className="manual-body">

          {/* ── Executive Summary ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">Executive Summary</h3>
              <p>
                The <strong>Nakhon Si Thammarat City Control Tower (NST-CTM-01)</strong> is
                a real-time municipal operations dashboard serving the Nakhon Si Thammarat
                City Municipality — a 22.6 km² historic city of 102,152 registered residents
                at the heart of Thailand's "City of Many Temples," anchored by the
                Khao Luang massif (1,835 m) to the west and the Pak Phanang estuary to
                the south-east.
              </p>
              <p>
                The platform is built around a single defining risk: <strong>recurrent
                catastrophic flooding</strong>. The November 2025 event — the worst on
                record — inundated 223,221 households across 22 of 23 districts,
                caused 6 deaths, and inflicted an estimated ฿33.96 billion in losses.
                NST-CTM-01 fuses <strong>30+ live data feeds</strong> — GloFAS flood
                discharge, IMERG rainfall, tide, air quality, satellite EO, citizen
                reports, AIS Gulf of Thailand, municipal Facebook, Google Trends, and
                TimesFM forecasts — into a single coherent map-first interface.
              </p>
              <p>
                The province supports 1,545,147 residents (2022) across 9,942.5 km²
                and 23 amphoe. Its economy is Thailand's largest rubber-growing region
                (243,292 ha), a tourism destination receiving 3.94 million visitors
                annually (2019), and a site of outstanding religious heritage with
                Wat Phra Mahathat Woramahawihan under UNESCO candidacy. The
                dashboard holds all of this in view while foregrounding flood preparedness
                as the non-negotiable operational priority.
              </p>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">สรุปสำหรับผู้บริหาร</h3>
              <p className="serif">
                <strong>ศูนย์ควบคุมเมืองนครศรีธรรมราช (NST-CTM-01)</strong> คือ
                แดชบอร์ดปฏิบัติการเทศบาลแบบเรียลไทม์ สำหรับเทศบาลนครนครศรีธรรมราช
                — เมืองประวัติศาสตร์พื้นที่ 22.6 ตร.กม. ประชากรที่ลงทะเบียน 102,152 คน
                ตั้งอยู่ในใจกลาง "เมืองพระมหาธาตุ" โดยมีเทือกเขาหลวง (1,835 เมตร)
                ตั้งตระหง่านทางทิศตะวันตก และปากน้ำปากพนังทางทิศตะวันออกเฉียงใต้
              </p>
              <p className="serif">
                แพลตฟอร์มนี้ถูกออกแบบมาเพื่อรับมือกับความเสี่ยงหลักของเมือง:
                <strong>อุทกภัยรุนแรงซ้ำซาก</strong> เหตุการณ์เดือนพฤศจิกายน 2568
                ซึ่งเลวร้ายที่สุดในประวัติศาสตร์ ส่งผลกระทบต่อ 223,221 ครัวเรือน
                ใน 22 อำเภอ มีผู้เสียชีวิต 6 ราย และสร้างความเสียหายประมาณ
                33.96 พันล้านบาท ระบบนี้รวบรวมข้อมูลสดกว่า <strong>30 แหล่ง</strong>
                ไว้ในแผนที่เดียว
              </p>
              <p className="serif">
                จังหวัดนี้มีประชากร 1,545,147 คน (2565) ใน 9,942.5 ตร.กม. และ 23 อำเภอ
                มีพื้นที่ปลูกยางพาราใหญ่ที่สุดในประเทศ (243,292 เฮกตาร์)
                รองรับนักท่องเที่ยว 3.94 ล้านคนต่อปี และเป็นที่ตั้งของ
                วัดพระมหาธาตุวรมหาวิหาร ซึ่งอยู่ในกระบวนการขอขึ้นทะเบียน UNESCO
              </p>
            </div>
          </section>

          {/* ── Problem Statement ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">The Problem: A City Without a Unified Operational View</h3>
              <p>
                Nakhon Si Thammarat's emergency and municipal operations are distributed
                across a patchwork of disconnected systems: DDPM for disaster alerts,
                TMD for weather, RID ThaiWater for river gauges, Traffy Fondue for
                citizen reports, Facebook for community communications, and iTIC/Longdo
                for traffic. No single screen correlates all of these in real time.
              </p>
              <p>
                The consequences are acute during flood season (October–January).
                When the Khao Luang watershed saturates and discharges into the
                Pak Phanang basin, municipal staff have minutes — not hours — to
                coordinate evacuation, redirect traffic, and alert residents along
                Tha Dee Canal. Fragmented data systems make this reaction slower
                and less coordinated than it needs to be.
              </p>
              <ul className="manual-flow">
                <li>Correlate GloFAS discharge + IMERG rainfall + tide level in a single map view</li>
                <li>Know the exact extent of active Traffy flood reports against the flood-risk zone polygon</li>
                <li>Watch AIS vessel traffic in Pak Phanang Bay as the flood front approaches the coast</li>
                <li>Forecast rain and flood levels 24 hours ahead with TimesFM confidence bands</li>
                <li>Track the municipal Facebook communications channel without leaving the operations screen</li>
                <li>Run satellite flood-surface assessment via MODIS without GIS expertise</li>
              </ul>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">ปัญหา: เมืองที่ขาดมุมมองการดำเนินงานเป็นหนึ่งเดียว</h3>
              <p className="serif">
                การปฏิบัติงานฉุกเฉินและเทศบาลนครศรีธรรมราชกระจัดกระจายในระบบที่
                ไม่เชื่อมต่อกัน: กรมป้องกันและบรรเทาสาธารณภัย (ปภ.) สำหรับการแจ้งเตือนภัย
                กรมอุตุนิยมวิทยา (อต.) สำหรับพยากรณ์อากาศ กรมชลประทาน ThaiWater
                สำหรับระดับน้ำในแม่น้ำ Traffy Fondue สำหรับรับเรื่องร้องเรียน
                Facebook สำหรับสื่อสารชุมชน และ iTIC/Longdo สำหรับจราจร
                ไม่มีหน้าจอเดียวที่รวมสิ่งเหล่านี้ในแบบเรียลไทม์
              </p>
              <p className="serif">
                ผลกระทบรุนแรงที่สุดในช่วงฤดูน้ำหลาก (ตุลาคม–มกราคม)
                เมื่อลุ่มน้ำเขาหลวงอิ่มตัวและไหลเข้าสู่ลุ่มน้ำปากพนัง
                เจ้าหน้าที่เทศบาลมีเวลาเป็นนาที ไม่ใช่ชั่วโมง
                ในการประสานงานอพยพ เปลี่ยนเส้นทางจราจร และแจ้งเตือนประชาชน
                ตามแนวคลองท่าดี ระบบข้อมูลที่แยกส่วนทำให้การตอบสนองช้าลง
              </p>
              <ul className="manual-flow serif">
                <li>เชื่อมโยงปริมาณน้ำ GloFAS + ฝน IMERG + ระดับน้ำทะเลในแผนที่เดียว</li>
                <li>รู้ขอบเขตรายงาน Traffy ที่เกี่ยวกับน้ำท่วมเทียบกับโซนความเสี่ยง</li>
                <li>ดูการจราจรทางเรือ AIS ในอ่าวปากพนังขณะแนวน้ำเข้าใกล้ชายฝั่ง</li>
                <li>พยากรณ์ฝนและระดับน้ำ 24 ชั่วโมงล่วงหน้าด้วย TimesFM</li>
                <li>ติดตาม Facebook เทศบาลโดยไม่ออกจากหน้าจอปฏิบัติการ</li>
                <li>ประเมินพื้นที่น้ำท่วมจากดาวเทียม MODIS โดยไม่ต้องมีทักษะ GIS</li>
              </ul>
            </div>
          </section>

          {/* ── Architecture ── */}
          <section className="manual-section">
            <h3 className="manual-h3">Technical Architecture</h3>
            <div className="manual-grid-2">
              <div>
                <h4 className="manual-h4">Data layer</h4>
                <ul className="manual-flow">
                  <li><strong>API server</strong> — Hono (Node.js) running as macOS launchd service on port 8794. 30+ adapter modules pre-warm data on configurable intervals; stale-tolerant cache survives upstream outages and server restarts. Domain: <span className="mono">nst-api.nonarkara.org</span></li>
                  <li><strong>Forecast service</strong> — Python APScheduler + Google TimesFM 2.0 (200 M param, zero-shot). Runs hourly; writes 5-metric forecasts (precipitation, flood gauge, AQI, incidents, vessels) to Supabase.</li>
                  <li><strong>Database</strong> — Supabase PostgreSQL + PostGIS for city-twin state + forecast storage + news archive.</li>
                  <li><strong>Edge</strong> — Cloudflare Pages (web) + Cloudflare Tunnel (API, protocol: http2). Tunnel routes <span className="mono">nst-api.nonarkara.org</span> to the local launchd service without a static IP.</li>
                </ul>
              </div>
              <div>
                <h4 className="manual-h4">Frontend</h4>
                <ul className="manual-flow">
                  <li><strong>React 19 + Vite 6</strong> — fast refresh; vendor-split bundles (React · MapLibre · deck.gl) cache independently.</li>
                  <li><strong>deck.gl 9.3 + MapLibre GL</strong> — WebGL2 map with 3D building extrusion, heatmaps, AIS vessel trails, satellite tiles. GloFAS flood polygons rendered as fill layers.</li>
                  <li><strong>Inter</strong> (one neo-grotesque family, every weight) + <strong>IBM Plex Sans Thai</strong> for Thai script — self-hosted, no external font requests.</li>
                  <li><strong>Design DNA</strong> — Dieter Rams × Bob Noorda/Massimo Vignelli (NYCTA Graphics Standards). Warm greyscale field, one signal accent, a closed 8-color route palette for wayfinding only — no rounding, blur, or shadow.</li>
                  <li><strong>Accessibility</strong> — WCAG 2.1 AA: focus rings, ARIA roles, modal focus traps, news ticker pause control, combobox building search.</li>
                </ul>
              </div>
            </div>

            <h4 className="manual-h4" style={{ marginTop: 16 }}>Live data sources</h4>
            <table className="manual-table">
              <thead>
                <tr><th>Feed</th><th>Source</th><th>Update</th><th>Coverage</th></tr>
              </thead>
              <tbody>
                <tr><td>Traffic events</td><td>iTIC / Longdo</td><td>Live</td><td>NST province</td></tr>
                <tr><td>Citizen reports</td><td>Traffy Fondue</td><td>Live</td><td>Municipal bbox</td></tr>
                <tr><td>Flood discharge gauges</td><td>Open-Meteo GloFAS</td><td>3-hr</td><td>Pak Phanang basin + Tha Dee canal</td></tr>
                <tr><td>Rainfall (model)</td><td>Open-Meteo</td><td>1-hr</td><td>NST centroid 8.4364°N, 99.9631°E</td></tr>
                <tr><td>Rainfall (satellite)</td><td>NASA IMERG</td><td>30 min</td><td>NST province bbox</td></tr>
                <tr><td>Weather</td><td>Open-Meteo</td><td>1-hr</td><td>NST Old Town centroid</td></tr>
                <tr>
                  <td>Air quality <span className="mono" style={{fontSize:"0.7em",color:"var(--warn)"}}>GAP</span></td>
                  <td>Open-Meteo AQ + AQICN proxy</td>
                  <td>1-hr</td>
                  <td>Model interpolation — no PCD permanent station in NST city</td>
                </tr>
                <tr><td>Tide</td><td>Open-Meteo Marine</td><td>1-hr</td><td>Gulf of Thailand coast</td></tr>
                <tr><td>AIS vessels</td><td>AISStream.io</td><td>Live</td><td>Pak Phanang Bay / Gulf of Thailand</td></tr>
                <tr><td>CCTV cameras</td><td>Longdo</td><td>Live JPG/HLS</td><td>NST province bbox</td></tr>
                <tr><td>Satellite imagery</td><td>NASA GIBS (MODIS/VIIRS/IMERG/OMI) + Esri</td><td>15 min – 8 days</td><td>Global / regional</td></tr>
                <tr><td>Satellite climate</td><td>NASA POWER (MERRA-2 reanalysis)</td><td>Daily (~3-day latency)</td><td>NST Old Town centroid</td></tr>
                <tr><td>Flood risk zones</td><td>DDPM / GISTDA</td><td>Static</td><td>Pak Phanang basin (299,113 ha)</td></tr>
                <tr><td>Municipal updates</td><td>Facebook (nakhoncity)</td><td>15 min</td><td>เทศบาลนครนครศรีธรรมราช page</td></tr>
                <tr><td>News</td><td>Gemini 2.0 Flash (geocoded)</td><td>15 min</td><td>Nakhon Si Thammarat province</td></tr>
                <tr><td>Trends</td><td>Google Trends</td><td>15 min</td><td>"นครศรีธรรมราช" / "Nakhon Si Thammarat"</td></tr>
                <tr><td>Markets</td><td>FMP / FRED</td><td>15 min / daily</td><td>SET + global</td></tr>
                <tr><td>Forecast</td><td>TimesFM 2.0 (zero-shot)</td><td>Hourly</td><td>5 metrics, 24 h ahead</td></tr>
              </tbody>
            </table>

            <p style={{ marginTop: 12, color: "var(--text-2)", fontSize: "var(--size-caption)" }}>
              <strong>Data gap — air quality:</strong> NST province has no permanent PCD monitoring station in the city area. The AQ panel is served by Open-Meteo atmospheric model interpolation and the nearest AQICN reporting station; values are indicative, not authoritative. This gap is documented in the Source Catalog (SOURCES button). Integration with a future DEPA IoT air sensor is planned.
            </p>
          </section>

          {/* ── NST Flood Intelligence ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">NST Flood Intelligence — The Signature Risk</h3>
              <p>
                NST's defining hazard is the <strong>Khao Luang → Pak Phanang →
                Tha Dee cascade</strong>. When the Khao Luang watershed (1,835 m peak,
                ~300 km² catchment) saturates during prolonged monsoon rainfall, water
                concentrates into the Pak Phanang basin (299,113 ha) and the Tha Dee
                canal network that bisects the municipality. The cascade can produce
                &gt;500 mm in 24 hours — as it did in December 2022, affecting 9,820
                households — or a sustained multi-week event like November 2025
                (223,221 households, ฿33.96 B loss, worst on record).
              </p>
              <h4 className="manual-h4">Flood timeline — major events</h4>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Event</th><th>Households affected</th><th>Deaths</th><th>Damage</th></tr></thead>
                <tbody>
                  <tr><td>Dec 2016 – Jan 2017</td><td>~60,000</td><td>—</td><td>Major province-wide</td></tr>
                  <tr><td>Dec 2022</td><td>9,820</td><td>—</td><td>&gt;500 mm/24h rainfall peak</td></tr>
                  <tr><td>Nov – Dec 2024</td><td>~40,000</td><td>3</td><td>Widespread</td></tr>
                  <tr><td>Nov 2025 <span className="mono" style={{color:"var(--bad)"}}>WORST</span></td><td>223,221</td><td>6</td><td>฿33.96 billion</td></tr>
                </tbody>
              </table>
              <h4 className="manual-h4" style={{ marginTop: 12 }}>Forecast → Map binding</h4>
              <p>
                Every row in the <strong>PREDICTIVE INTELLIGENCE</strong> panel is
                clickable. Clicking a metric activates the corresponding map layer:
              </p>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Metric</th><th>Map layer activated</th></tr></thead>
                <tbody>
                  <tr><td>RAIN</td><td>GPM IMERG rainfall satellite</td></tr>
                  <tr><td>TIDE</td><td>Pak Phanang Bay coast + tide markers</td></tr>
                  <tr><td>INCIDENTS</td><td>Traffy Fondue citizen reports</td></tr>
                  <tr><td>AQI</td><td>MODIS Aerosol + OMI NO₂ satellite</td></tr>
                  <tr><td>VESSELS</td><td>AIS live vessel positions (Gulf of Thailand)</td></tr>
                </tbody>
              </table>
              <p style={{ marginTop: 8 }}>
                When a metric's p50 forecast exceeds its alert threshold, a red badge
                floats above the map canvas — visible from across the operations room.
              </p>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">ระบบข่าวกรองอุทกภัย NST — ความเสี่ยงเชิงนิยาม</h3>
              <p className="serif">
                ภัยหลักของนครศรีธรรมราชคือ <strong>ห่วงโซ่เขาหลวง → ลุ่มน้ำปากพนัง →
                คลองท่าดี</strong> เมื่อลุ่มน้ำเขาหลวง (ยอด 1,835 เมตร พื้นที่รับน้ำ
                ~300 ตร.กม.) อิ่มตัวในช่วงฝนมรสุมยาวนาน น้ำจะไหลรวมเข้าสู่
                ลุ่มน้ำปากพนัง (299,113 เฮกตาร์) และเครือข่ายคลองท่าดีที่ตัดผ่าน
                เขตเทศบาล น้ำอาจสูงเกิน 500 มม. ใน 24 ชั่วโมง
                และอาจกินเวลาต่อเนื่องหลายสัปดาห์เช่นในเดือนพฤศจิกายน 2568
              </p>
              <h4 className="manual-h4 serif">ไทม์ไลน์อุทกภัยสำคัญ</h4>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>เหตุการณ์</th><th>ครัวเรือนที่ได้รับผล</th><th>ผู้เสียชีวิต</th></tr></thead>
                <tbody>
                  <tr><td>ธ.ค. 2559 – ม.ค. 2560</td><td>~60,000</td><td>—</td></tr>
                  <tr><td>ธ.ค. 2565</td><td>9,820</td><td>—</td></tr>
                  <tr><td>พ.ย. – ธ.ค. 2567</td><td>~40,000</td><td>3</td></tr>
                  <tr><td>พ.ย. 2568 <span className="mono" style={{color:"var(--bad)"}}>แย่สุด</span></td><td>223,221</td><td>6</td></tr>
                </tbody>
              </table>
              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>การเชื่อมพยากรณ์กับแผนที่</h4>
              <p className="serif">
                ทุกแถวใน <strong>PREDICTIVE INTELLIGENCE</strong> คลิกได้
                การคลิกจะเปิดชั้นแผนที่ที่สอดคล้อง: ฝน (RAIN) → IMERG,
                น้ำทะเล (TIDE) → ชายฝั่งอ่าวปากพนัง,
                เหตุการณ์ (INCIDENTS) → Traffy, AQI → MODIS/OMI,
                เรือ (VESSELS) → AIS อ่าวไทย
              </p>
              <p className="serif" style={{ marginTop: 8 }}>
                เมื่อค่าพยากรณ์ p50 เกินเกณฑ์ จะแสดงแถบสีแดงลอยเหนือแผนที่
                — มองเห็นได้ทั่วห้องปฏิบัติการ
              </p>
            </div>
          </section>

          {/* ── Predictive Intelligence ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">Predictive Intelligence — TimesFM</h3>
              <p>
                The left rail's <strong>PREDICTIVE INTELLIGENCE</strong> panel runs
                Google TimesFM 2.0 — a 200-million-parameter foundation model for
                time-series forecasting trained on 100 billion real-world data points.
              </p>
              <p>
                Every hour, the forecast service reads the latest sensor readings
                and produces a 24-point horizon with p10/p50/p90 confidence bands.
                For NST, the five tracked metrics are:
              </p>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Metric</th><th>NST significance</th><th>Alert threshold</th></tr></thead>
                <tbody>
                  <tr><td>RAIN (mm/hr)</td><td>Flood trigger — Khao Luang runoff proxy</td><td>15 mm/hr</td></tr>
                  <tr><td>TIDE (m)</td><td>Coastal back-pressure into Pak Phanang</td><td>0.8 m</td></tr>
                  <tr><td>INCIDENTS (count)</td><td>Traffy flood + drainage reports surging</td><td>20 open</td></tr>
                  <tr><td>AQI</td><td>Haze events; no permanent station (proxy)</td><td>100 (Moderate)</td></tr>
                  <tr><td>VESSELS (count)</td><td>Gulf of Thailand maritime traffic</td><td>50 in bbox</td></tr>
                </tbody>
              </table>
              <p style={{ marginTop: 8 }}>
                <strong>Zero-shot</strong> means the model generalises from its vast
                pretraining corpus without requiring NST-specific training data.
                Forecast accuracy improves as historical readings accumulate in Supabase.
              </p>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">ปัญญาประดิษฐ์พยากรณ์ — TimesFM</h3>
              <p className="serif">
                แผง <strong>PREDICTIVE INTELLIGENCE</strong> ใช้ Google TimesFM 2.0
                — โมเดลพื้นฐานพยากรณ์อนุกรมเวลา 200 ล้านพารามิเตอร์
                ฝึกด้วยข้อมูลจริง 1 แสนล้านจุด
              </p>
              <p className="serif">
                ทุกชั่วโมง บริการพยากรณ์คำนวณ 24 จุดพยากรณ์พร้อม
                ช่วงความเชื่อมั่น p10/p50/p90 สำหรับ NST มีตัวชี้วัด 5 ตัว:
                ปริมาณฝน (RAIN) ที่เป็นตัวชี้การไหลบ่าของเขาหลวง,
                ระดับน้ำทะเล (TIDE) ที่สร้างแรงดันย้อนกลับเข้าปากพนัง,
                จำนวนเหตุการณ์ (INCIDENTS), คุณภาพอากาศ (AQI) และการจราจรทางเรือ (VESSELS)
              </p>
              <p className="serif">
                <strong>Zero-shot</strong> หมายความว่าโมเดลไม่ต้องการข้อมูล NST
                เฉพาะเพื่อฝึก แต่อาศัยความสามารถทั่วไปจากการฝึกขนาดใหญ่
                ความแม่นยำจะดีขึ้นเมื่อข้อมูลสะสมใน Supabase มากขึ้น
              </p>
            </div>
          </section>

          {/* ── Earth Observation ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">Earth Observation — Satellite Eyes on the Flood</h3>
              <p>
                The EAR (Earth) lens loads 10 NASA GIBS satellite layers.
                All are free, open-access imagery from NASA's Earth science fleet.
                For NST, the three most critical layers are IMERG rainfall, MODIS
                Flood Detection, and Himawari IR — these give a 30-minute early
                warning window before the Khao Luang cascade reaches the Pak Phanang plain.
              </p>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Layer</th><th>Instrument</th><th>NST relevance</th></tr></thead>
                <tbody>
                  <tr><td>True-color</td><td>MODIS Terra</td><td>Daily 250 m — rapid visual damage assessment</td></tr>
                  <tr><td>VIIRS true-color</td><td>VIIRS NOAA-20</td><td>Sharper daily — confirm flood extent after event</td></tr>
                  <tr><td>Night lights</td><td>VIIRS DNB</td><td>Detect power outages in flooded districts</td></tr>
                  <tr><td>IMERG rainfall <span className="mono" style={{color:"var(--bad)"}}>KEY</span></td><td>GPM IMERG</td><td>30-min rainfall — first signal of Khao Luang saturation</td></tr>
                  <tr><td>NDVI</td><td>MODIS Terra</td><td>8-day rubber/oil palm greenness + post-flood stress</td></tr>
                  <tr><td>Land surface temp</td><td>MODIS Terra</td><td>Urban heat + flood-area cooling signature</td></tr>
                  <tr><td>Aerosol (AOD)</td><td>MODIS MAIAC</td><td>Seasonal haze proxy (October burn season)</td></tr>
                  <tr><td>NO₂</td><td>OMI</td><td>Traffic + agricultural burn nitrogen dioxide</td></tr>
                  <tr><td>Flood detection <span className="mono" style={{color:"var(--bad)"}}>KEY</span></td><td>MODIS combined</td><td>3-day flood surface mapping — active event assessment</td></tr>
                  <tr><td>Himawari IR <span className="mono" style={{color:"var(--bad)"}}>KEY</span></td><td>Himawari-9 B13</td><td>Cloud-top temp, 10-min — earliest rainfall warning</td></tr>
                </tbody>
              </table>
              <h4 className="manual-h4" style={{ marginTop: 12 }}>LIVE READINGS — NASA MERRA-2</h4>
              <p>
                The EAR panel shows a <strong>LIVE READINGS</strong> strip sourced from
                the NASA POWER API (MERRA-2 reanalysis, no API key required). Values
                update daily with ~3-day publication latency:
              </p>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Reading</th><th>Parameter</th><th>NST context</th></tr></thead>
                <tbody>
                  <tr><td>Temperature</td><td>2-m air temp (°C)</td><td>Tropical baseline; spikes during La Niña monsoon</td></tr>
                  <tr><td>Precipitation</td><td>Daily total (mm/day)</td><td>~2,292 mm/yr average; November peak ~280 mm/month</td></tr>
                  <tr><td>Solar irradiance</td><td>Avg kWh/m²/mo</td><td>Rubber + oil palm agri-solar planning</td></tr>
                  <tr><td>Sky clearness</td><td>ALLSKY_KT index (0–1)</td><td>Low = cloud cover = active monsoon front</td></tr>
                </tbody>
              </table>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">การสำรวจโลกจากอวกาศ — ดาวเทียมเฝ้าน้ำท่วม</h3>
              <p className="serif">
                เลนส์ EAR (Earth) โหลดภาพดาวเทียม NASA GIBS 10 ชั้น
                ทั้งหมดเป็นข้อมูลเปิดฟรีจากกองทัพดาวเทียมวิทยาศาสตร์โลกของ NASA
                สำหรับ NST ชั้นสำคัญที่สุดคือ IMERG ปริมาณฝน, MODIS ตรวจจับน้ำท่วม
                และ Himawari IR ซึ่งให้หน้าต่างเตือนภัยล่วงหน้า 30 นาที
                ก่อนน้ำจากเขาหลวงจะถึงที่ราบปากพนัง
              </p>
              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>LIVE READINGS — NASA MERRA-2</h4>
              <p className="serif">
                แผง EAR มีแถบ <strong>LIVE READINGS</strong> จาก NASA POWER API
                (MERRA-2 reanalysis ไม่ต้องใช้ API key) อัปเดตรายวันโดยมีเวลาล่าช้าประมาณ 3 วัน:
                อุณหภูมิ 2 เมตร, ปริมาณฝนรายวัน (NST เฉลี่ย 2,292 มม./ปี),
                พลังงานแสงอาทิตย์ (kWh/m²/เดือน) สำหรับแผนการเกษตรสุริยะ
                และดัชนีความโปร่งใสของท้องฟ้า ALLSKY_KT
                (ค่าต่ำ = มีเมฆมาก = แนวมรสุมกำลังแอคทีฟ)
              </p>
              <p className="serif">
                ชั้นข้อมูล GISTDA (POI Digital Twin, Solar LOD2, ข้อมูลการใช้ประโยชน์ที่ดิน)
                มาจากสำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ (GISTDA) ของไทย
                ซึ่งยังเป็นแหล่งข้อมูลการสำรวจพื้นที่น้ำท่วมอย่างเป็นทางการ
              </p>
            </div>
          </section>

          {/* ── How to Use ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">How to Use This Dashboard</h3>

              <h4 className="manual-h4">Flood watch protocol (SAF + EAR lenses) — primary use case</h4>
              <ol className="manual-flow">
                <li>Switch to <strong>SAF</strong> lens: flood-risk zones + waterways + Traffy reports + hospitals/fire.</li>
                <li>Check <strong>PREDICTIVE INTELLIGENCE</strong>: RAIN p50 &gt;15 mm/hr or TIDE &gt;0.8 m = activate EAR.</li>
                <li>Switch to or add <strong>EAR</strong> layers: toggle IMERG rainfall + Himawari IR first, then MODIS Flood if event is underway.</li>
                <li>Cross-reference active Traffy flood reports against flood-risk zone polygons — areas with both active reports AND high-risk zoning need immediate response.</li>
                <li>Monitor AIS in Pak Phanang Bay: vessel counts drop when Gulf conditions deteriorate (early flood precursor).</li>
                <li>Watch MERRA-2 LIVE READINGS in EAR panel: daily precipitation &gt;100 mm = high alert.</li>
              </ol>

              <h4 className="manual-h4" style={{ marginTop: 12 }}>Daily operations (OPS lens)</h4>
              <ol className="manual-flow">
                <li>Open the dashboard — it loads the OPS lens by default.</li>
                <li>Scan the top-bar feed chips — green dots are live, red are down.</li>
                <li>Check <strong>PREDICTIVE INTELLIGENCE</strong> for any amber alerts.</li>
                <li>Scan <strong>OPEN REPORTS</strong> count — flood + drainage reports indicate pre-event stress.</li>
                <li>Click any incident pin on the map for full details.</li>
              </ol>

              <h4 className="manual-h4" style={{ marginTop: 12 }}>Intelligence watch (INT lens)</h4>
              <ol className="manual-flow">
                <li>Switch to INT lens — SITUATION DIGEST appears above the KPI strip.</li>
                <li>Red badge above the map = a forecast metric has breached its threshold.</li>
                <li>Click any PREDICTIVE INTELLIGENCE row to activate its map layer.</li>
                <li>MERRA-2 temp + precip readings update the digest automatically.</li>
              </ol>

              <h4 className="manual-h4" style={{ marginTop: 12 }}>Maritime watch (MAR lens)</h4>
              <ol className="manual-flow">
                <li>Switch to MAR lens: Gulf of Thailand coast + AIS vessel live positions.</li>
                <li>Click any vessel dot for name, speed, heading, cargo type.</li>
                <li>Toggle distance-grid (1/5/10 km rings) for reach context in Pak Phanang Bay.</li>
                <li>Watch TidePanel for wave height and tide cycle at the Gulf coast.</li>
              </ol>

              <h4 className="manual-h4" style={{ marginTop: 12 }}>Building intelligence (3D mode)</h4>
              <ol className="manual-flow">
                <li>Tap <strong>3D</strong> in the top bar to extrude buildings.</li>
                <li>Color encodes type: gold (Wat Phra Mahathat + heritage temples), blue (civic), coral (hospitals Maharaj + City).</li>
                <li>Click any building for name, type, levels, and operator.</li>
              </ol>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">วิธีใช้งานแดชบอร์ด</h3>

              <h4 className="manual-h4 serif">โปรโตคอลเฝ้าระวังน้ำท่วม (เลนส์ SAF + EAR) — กรณีใช้งานหลัก</h4>
              <ol className="manual-flow serif">
                <li>เปลี่ยนเป็นเลนส์ <strong>SAF</strong>: โซนความเสี่ยงน้ำท่วม + ทางน้ำ + รายงาน Traffy + โรงพยาบาล/ดับเพลิง</li>
                <li>ตรวจสอบ <strong>PREDICTIVE INTELLIGENCE</strong>: RAIN p50 &gt;15 มม./ชม. หรือ TIDE &gt;0.8 เมตร = เปิดใช้ EAR</li>
                <li>เปิดชั้น <strong>EAR</strong>: สลับ IMERG + Himawari IR ก่อน จากนั้นเปิด MODIS Flood หากเกิดเหตุการณ์</li>
                <li>เปรียบเทียบรายงาน Traffy น้ำท่วมกับโซนความเสี่ยง — พื้นที่ที่มีทั้งรายงานและความเสี่ยงสูงต้องตอบสนองทันที</li>
                <li>ติดตาม AIS ในอ่าวปากพนัง: จำนวนเรือลดลงบ่งบอกว่าสภาพอ่าวแย่ลง</li>
                <li>ดูค่า MERRA-2 ในแผง EAR: ฝนรายวัน &gt;100 มม. = แจ้งเตือนสูง</li>
              </ol>

              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>ปฏิบัติการประจำวัน (เลนส์ OPS)</h4>
              <ol className="manual-flow serif">
                <li>เปิดแดชบอร์ด — โหลดเลนส์ OPS โดยอัตโนมัติ</li>
                <li>ตรวจสอบชิปฟีดบนแถบด้านบน — จุดเขียวคือสด จุดแดงคือขัดข้อง</li>
                <li>ตรวจสอบ <strong>PREDICTIVE INTELLIGENCE</strong> สำหรับการแจ้งเตือน</li>
                <li>ดูจำนวน <strong>OPEN REPORTS</strong> — รายงานน้ำท่วม/ระบายน้ำบ่งชี้ความเครียดก่อนเหตุการณ์</li>
                <li>คลิกหมุดเหตุการณ์บนแผนที่เพื่อดูรายละเอียด</li>
              </ol>

              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>เฝ้าระวังด้านปัญญา (เลนส์ INT)</h4>
              <ol className="manual-flow serif">
                <li>เปลี่ยนเป็นเลนส์ INT — SITUATION DIGEST จะปรากฏเหนือแถบ KPI</li>
                <li>แถบสีแดงเหนือแผนที่ = ตัวชี้วัดพยากรณ์เกินค่าเกณฑ์</li>
                <li>คลิกแถว PREDICTIVE INTELLIGENCE เพื่อเปิดชั้นแผนที่ที่เกี่ยวข้อง</li>
                <li>ค่าอุณหภูมิ + ปริมาณฝน MERRA-2 อัปเดต Digest โดยอัตโนมัติ</li>
              </ol>

              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>เฝ้าระวังทางทะเล (เลนส์ MAR)</h4>
              <ol className="manual-flow serif">
                <li>เปลี่ยนเป็นเลนส์ MAR: ชายฝั่งอ่าวไทย + ตำแหน่งเรือ AIS แบบสด</li>
                <li>คลิกจุดเรือเพื่อดูชื่อ ความเร็ว ทิศทาง ประเภทสินค้า</li>
                <li>เปิดกริดระยะ (1/5/10 กม.) ในอ่าวปากพนังเพื่อดูรัศมีการเข้าถึง</li>
                <li>ดู TidePanel สำหรับความสูงคลื่นและรอบน้ำขึ้น-ลงที่ชายฝั่งอ่าวไทย</li>
              </ol>
            </div>
          </section>

          {/* ── Lens Reference ── */}
          <section className="manual-section">
            <h3 className="manual-h3">Lens Reference · คู่มืออ้างอิงเลนส์</h3>
            <table className="manual-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>English name</th>
                  <th>ชื่อภาษาไทย</th>
                  <th>Best used for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">EXEC</td>
                  <td>Executive</td>
                  <td className="serif">ภาพรวมยุทธศาสตร์</td>
                  <td>Strategic overview — city boundary, Old Town axis (Ratchadamnoen Rd), satellite, transit, GISTDA POIs, Wat Phra Mahathat</td>
                </tr>
                <tr>
                  <td className="mono">OPS</td>
                  <td>Operations</td>
                  <td className="serif">ปฏิบัติการ</td>
                  <td>Day-to-day — buildings, roads, civic POIs (Maharaj + City hospitals), traffic, incidents, CCTV</td>
                </tr>
                <tr>
                  <td className="mono">MOB</td>
                  <td>Mobility</td>
                  <td className="serif">การเคลื่อนที่</td>
                  <td>Traffic + transit + AIS + CCTV — routing and dispatch decisions</td>
                </tr>
                <tr>
                  <td className="mono">MAR</td>
                  <td>Maritime</td>
                  <td className="serif">ทางทะเล</td>
                  <td>Gulf of Thailand — Pak Phanang Bay coast, OpenSeaMap, AIS live vessels, navigation aids, distance grid</td>
                </tr>
                <tr>
                  <td className="mono">ENV</td>
                  <td>Environment</td>
                  <td className="serif">สิ่งแวดล้อม</td>
                  <td>Satellite + Pak Phanang basin flood zones + GISTDA solar — environmental planning</td>
                </tr>
                <tr>
                  <td className="mono">EAR</td>
                  <td>Earth</td>
                  <td className="serif">สำรวจโลก</td>
                  <td>NASA GIBS + MERRA-2 LIVE READINGS — IMERG rain, MODIS flood + heat + NDVI, OMI NO₂, Himawari IR</td>
                </tr>
                <tr>
                  <td className="mono">SAF</td>
                  <td>Safety</td>
                  <td className="serif">ความปลอดภัย</td>
                  <td>Flood-risk zones (Pak Phanang basin) + Traffy reports + hospitals/fire/police + Tha Dee waterways + CCTV</td>
                </tr>
                <tr>
                  <td className="mono">INT</td>
                  <td>Intelligence</td>
                  <td className="serif">ข่าวกรองรวม</td>
                  <td>TimesFM forecast → map layer binding + Situation Digest + alert badges above map on threshold breach</td>
                </tr>
                <tr>
                  <td className="mono">VIB</td>
                  <td>Vibes</td>
                  <td className="serif">ภาพสวยงาม</td>
                  <td>Presentation view — true-color satellite over Khao Luang + Old Town + Gulf coast. No data overlays.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ── City Profile — expanded analytics ── */}
          <section className="manual-section whitepaper-bilingual">
            <div className="whitepaper-col">
              <h3 className="manual-h3">City &amp; Province Profile — Key Indicators</h3>
              <h4 className="manual-h4">Demographics</h4>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Indicator</th><th>Value</th><th>Source</th></tr></thead>
                <tbody>
                  <tr><td>City population</td><td>102,152</td><td>DOPA 2022</td></tr>
                  <tr><td>Province population</td><td>1,545,147</td><td>NSO 2022</td></tr>
                  <tr><td>Registered households</td><td>509,812</td><td>DOPA</td></tr>
                  <tr><td>Flood-exposed households</td><td>~250,000</td><td>DDPM estimate</td></tr>
                  <tr><td>Elderly (65+)</td><td>~207,000 (13.4%)</td><td>DOPA / MSDHS</td></tr>
                  <tr><td>Welfare cardholders</td><td>~310,000</td><td>FPO</td></tr>
                  <tr><td>MPI poverty rate</td><td>11.2% (≈173,000)</td><td>TPMAP 2025</td></tr>
                </tbody>
              </table>
              <h4 className="manual-h4" style={{ marginTop: 12 }}>Economy</h4>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Indicator</th><th>Value</th></tr></thead>
                <tbody>
                  <tr><td>GPP (2020)</td><td>฿164,375 M</td></tr>
                  <tr><td>GPP per capita (2020)</td><td>฿109,050 (46% of national)</td></tr>
                  <tr><td>Tourism visitors (2019)</td><td>3.94 M — "fastest-growing province"</td></tr>
                  <tr><td>Tourism revenue</td><td>฿15+ billion/yr</td></tr>
                  <tr><td>Rubber area</td><td>243,292 ha — largest in Thailand</td></tr>
                  <tr><td>Oil palm area</td><td>~48,000 ha</td></tr>
                  <tr><td>Livestock</td><td>774,571 head</td></tr>
                </tbody>
              </table>
              <h4 className="manual-h4" style={{ marginTop: 12 }}>Healthcare</h4>
              <table className="manual-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Facility</th><th>Beds</th><th>MOPH code</th></tr></thead>
                <tbody>
                  <tr><td>Maharaj Nakhon Si Thammarat Hospital</td><td>844</td><td>11101</td></tr>
                  <tr><td>Nakhon Si Thammarat City Hospital</td><td>479</td><td>11414</td></tr>
                  <tr><td>Dengue incidence (province)</td><td colSpan={2}>~38 / 100,000 (MOPH HDC)</td></tr>
                  <tr><td>PM2.5 annual mean (proxy)</td><td colSpan={2}>~18 µg/m³ — no permanent PCD station</td></tr>
                </tbody>
              </table>
            </div>
            <div className="whitepaper-col whitepaper-th">
              <h3 className="manual-h3 serif">โปรไฟล์เมืองและจังหวัด</h3>
              <h4 className="manual-h4 serif">ประชากร</h4>
              <p className="serif">
                ประชากรเมือง 102,152 คน (ทพ. 2565);
                จังหวัด 1,545,147 คน ใน 23 อำเภอ
                มีครัวเรือน 509,812 ครัวเรือน โดยประมาณ 250,000 ครัวเรือน
                อยู่ในพื้นที่เสี่ยงน้ำท่วม
                ผู้สูงอายุ (65+ ปี) ~207,000 คน (13.4%)
                อัตราความยากจนหลายมิติ (MPI) 11.2% หรือประมาณ 173,000 คน
              </p>
              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>เศรษฐกิจ</h4>
              <p className="serif">
                GPP จังหวัด (2563): 164,375 ล้านบาท
                GPP ต่อหัว: 109,050 บาท (46% ของค่าเฉลี่ยประเทศ)
                นักท่องเที่ยว 3.94 ล้านคน (2562 — "จังหวัดเติบโตเร็วที่สุด")
                รายได้ท่องเที่ยว 15+ พันล้านบาท/ปี
                พื้นที่ยางพารา 243,292 เฮกตาร์ — ใหญ่ที่สุดในไทย
              </p>
              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>สาธารณสุข</h4>
              <p className="serif">
                โรงพยาบาลมหาราชนครศรีธรรมราช: 844 เตียง (รหัส 11101)
                โรงพยาบาลเทศบาลนครนครศรีธรรมราช: 479 เตียง (รหัส 11414)
                อัตราป่วยไข้เลือดออก: ~38/100,000 (สสจ./HDC)
                PM2.5 เฉลี่ย (ค่าประมาณ): ~18 µg/m³ — ไม่มีสถานีตรวจวัด PCD ถาวร
              </p>
              <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>ธรรมาภิบาล</h4>
              <p className="serif">
                คะแนน ITA: ระดับ A (ปีงบ 2567)
                คะแนน LPA: 82/100 (กรมส่งเสริม ปค. 2567)
                ได้รับทุน DEPA Smart City: ระบบ IoT น้ำท่วม + แพลตฟอร์มข้อมูลเปิด
                รายงาน Traffy Fondue (จังหวัด): ~3,200 รายงาน/ปี
                ชุดข้อมูลเปิดบนแพลตฟอร์ม DEPA: 8 ชุด (เป้าหมาย 20+ ชุดภายในปี 2570)
              </p>
            </div>
          </section>

          {/* ── Partners & Credits ── */}
          <section className="manual-section">
            <h3 className="manual-h3">Partners &amp; Credits · พันธมิตรและเครดิต</h3>
            <div className="manual-grid-2">
              <ul className="manual-flow">
                <li><strong>Nakhon Si Thammarat City Municipality</strong> — เทศบาลนครนครศรีธรรมราช (data owner · nakhoncity.org)</li>
                <li><strong>DEPA</strong> — Digital Economy Promotion Agency (Smart City grant · IoT flood sensors)</li>
                <li><strong>DDPM</strong> — Department of Disaster Prevention and Mitigation (flood data)</li>
                <li><strong>Axiom</strong> — Innovation as a Service (platform engineering)</li>
              </ul>
              <ul className="manual-flow">
                <li><strong>NASA GIBS + POWER</strong> — satellite imagery + MERRA-2 climate (open access)</li>
                <li><strong>GISTDA</strong> — Thai geospatial data + flood mapping (open access)</li>
                <li><strong>OpenStreetMap</strong> — base map + buildings + roads</li>
                <li><strong>Google TimesFM 2.0</strong> — time-series forecast model (open weights)</li>
                <li><strong>AISStream.io</strong> — live vessel AIS feed (Gulf of Thailand)</li>
                <li><strong>Traffy Fondue</strong> — citizen complaint platform</li>
                <li><strong>Open-Meteo</strong> — weather, air quality, GloFAS flood gauges</li>
                <li><strong>Google Trends</strong> — #นครศรีธรรมราช keyword intelligence</li>
              </ul>
            </div>
          </section>

          <footer className="manual-foot caption">
            NST-CTM-01 v0.1 · เทศบาลนครนครศรีธรรมราช · Nakhon Si Thammarat City Municipality
            <span className="serif"> · สำหรับเจ้าหน้าที่เทศบาล</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
