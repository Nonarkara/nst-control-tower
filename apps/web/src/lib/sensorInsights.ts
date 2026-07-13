import type {
  BasinWaterBalance,
  EwsStation,
  RainfallStation,
  RidReservoir,
  WaterGauge,
} from "@nst/shared";

/**
 * Sensor insights — FloodDash's signal families (insights.js) recomputed
 * client-side from the feeds the dashboard already polls. Each insight is one
 * bilingual, severity-tagged sentence with a map target, so a duty officer
 * reads the rail top-to-bottom and taps to fly to the problem.
 *
 * Thresholds trace to the same sources as the rest of the flood stack:
 * TMD 24h rain bands (heavy 35 / very heavy 90), flash rain 30 mm/h,
 * SOIL_PRIMED 85 % (lib/floodPosture.ts), HII situation levels 4–5,
 * FloodDash rise ladder (0.15 m per 6 h ≈ 0.025 m/h significant).
 */

export type InsightSeverity = "info" | "warn" | "critical";

export interface SensorInsight {
  id: string;
  type:
    | "overbank"
    | "rapid_rise"
    | "heavy_rain"
    | "flash_rain"
    | "soil_saturated"
    | "compound"
    | "reservoir_high"
    | "sensor_gap";
  severity: InsightSeverity;
  titleTh: string;
  titleEn: string;
  body: string;
  /** Map target — null for non-spatial insights. */
  lat: number | null;
  lng: number | null;
}

const RAIN_HEAVY_24H = 35; // TMD "heavy"
const RAIN_VERY_HEAVY_24H = 90; // TMD "very heavy"
const RAIN_FLASH_1H = 30;
const SOIL_PRIMED = 85;
const RISE_SIGNIFICANT_M_PER_H = 0.025; // FloodDash 0.15 m / 6 h
const FULLNESS_WARN = 85;
const RESERVOIR_WARN_PCT = 85;
const RESERVOIR_CRIT_PCT = 95;
const SENSOR_GAP_MS = 6 * 3600_000; // FloodDash sensor_gap window
const MAX_PER_TYPE = 4;
const MAX_TOTAL = 14;

const SEV_RANK: Record<InsightSeverity, number> = { critical: 0, warn: 1, info: 2 };

function fmt(n: number, d = 1): string {
  return n.toFixed(d).replace(/\.0+$/, "");
}

/**
 * Parse a ThaiWater "YYYY-MM-DD HH:mm" timestamp as epoch ms; null on any
 * other shape. Deliberately NOT compared against wall clock — upstream clocks
 * and calendars (Buddhist era, odd offsets) make absolute freshness lie, so
 * sensor gaps are measured *relative to the newest station in the same feed*.
 */
export function parseFeedTime(observedAt: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(observedAt);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Number.isFinite(t) ? t : null;
}

function overbankInsights(gauges: WaterGauge[]): SensorInsight[] {
  return gauges
    .filter((g) => g.situationLevel >= 4 || (g.fullnessPct ?? 0) >= FULLNESS_WARN)
    .sort((a, b) => (b.fullnessPct ?? 0) - (a.fullnessPct ?? 0))
    .slice(0, MAX_PER_TYPE)
    .map((g) => {
      const critical = g.situationLevel >= 5 || (g.fullnessPct ?? 0) >= 100;
      const pct = g.fullnessPct != null ? `${Math.round(g.fullnessPct)}% ของตลิ่ง` : `ระดับสถานการณ์ ${g.situationLevel}`;
      const freeboard =
        g.bankMsl != null && g.levelMsl != null
          ? ` · เหลือ ${fmt(Math.max(0, g.bankMsl - g.levelMsl), 2)} ม. ถึงตลิ่ง`
          : "";
      return {
        id: `overbank-${g.id}`,
        type: "overbank" as const,
        severity: critical ? ("critical" as const) : ("warn" as const),
        titleTh: `${g.name} — ${critical ? "ล้น/วิกฤติ" : "ใกล้ล้นตลิ่ง"}`,
        titleEn: `${g.amphoe || g.name} — ${critical ? "overbank/critical" : "near bank"}`,
        body: `${pct}${freeboard}${g.trend === "rising" ? " · กำลังขึ้น ▲" : ""}`,
        lat: g.lat,
        lng: g.lng,
      };
    });
}

// Estuary gauges rise ~twice a day from the tide alone. A "rapid rise" alarm
// that fires every flood tide trains operators to ignore it — so tidal
// stations are capped at warn and say so. (PTTEP3 = Pak Nakhon estuary.)
const TIDAL_STATION_CODES = new Set(["PTTEP3"]);

function rapidRiseInsights(basins: BasinWaterBalance[]): SensorInsight[] {
  // Basin gauge snapshots carry no lat/lng — these insights are non-spatial.
  const rising = basins
    .flatMap((b) => b.gauges)
    .filter((g) => (g.riseMPerH ?? 0) >= RISE_SIGNIFICANT_M_PER_H);
  return rising
    .sort((a, b) => (a.etaOvertopH ?? Infinity) - (b.etaOvertopH ?? Infinity))
    .slice(0, MAX_PER_TYPE)
    .map((g) => {
      const tidal = g.code != null && TIDAL_STATION_CODES.has(g.code);
      return {
        id: `rise-${g.id}`,
        type: "rapid_rise" as const,
        severity:
          !tidal && g.etaOvertopH != null && g.etaOvertopH <= 12
            ? ("critical" as const)
            : ("warn" as const),
        titleTh: `${g.code ?? g.name} — น้ำขึ้นเร็ว +${fmt((g.riseMPerH ?? 0) * 6, 2)} ม./6 ชม.`,
        titleEn: `${g.code ?? g.name} — rapid rise`,
        body: tidal
          ? "สถานีปากน้ำ — ส่วนหนึ่งเป็นจังหวะน้ำขึ้น-ลงปกติ ดูประกอบกับสถานีต้นน้ำ"
          : g.etaOvertopH != null
            ? `ถึงตลิ่งใน ~${fmt(g.etaOvertopH)} ชม. หากอัตราคงที่`
            : `เหลือ ${g.freeboardM != null ? fmt(g.freeboardM, 2) : "—"} ม. ถึงตลิ่ง`,
        lat: null,
        lng: null,
      };
    });
}

function rainInsights(rain: RainfallStation[]): SensorInsight[] {
  const heavy = rain
    .filter((r) => (r.rain24h ?? 0) >= RAIN_HEAVY_24H)
    .sort((a, b) => (b.rain24h ?? 0) - (a.rain24h ?? 0))
    .slice(0, MAX_PER_TYPE)
    .map((r) => ({
      id: `rain-${r.id}`,
      type: "heavy_rain" as const,
      severity:
        (r.rain24h ?? 0) >= RAIN_VERY_HEAVY_24H ? ("critical" as const) : ("warn" as const),
      titleTh: `ฝนหนัก${(r.rain24h ?? 0) >= RAIN_VERY_HEAVY_24H ? "มาก" : ""} อ.${r.amphoe || "—"}`,
      titleEn: `${(r.rain24h ?? 0) >= RAIN_VERY_HEAVY_24H ? "Very heavy" : "Heavy"} rain — ${r.amphoe}`,
      body: `${fmt(r.rain24h ?? 0)} มม./24 ชม. (${r.name})`,
      lat: r.lat,
      lng: r.lng,
    }));
  const flash = rain
    .filter((r) => (r.rain1h ?? 0) >= RAIN_FLASH_1H)
    .sort((a, b) => (b.rain1h ?? 0) - (a.rain1h ?? 0))
    .slice(0, 2)
    .map((r) => ({
      id: `flash-${r.id}`,
      type: "flash_rain" as const,
      severity: "critical" as const,
      titleTh: `ฝนถล่มเฉียบพลัน อ.${r.amphoe || "—"}`,
      titleEn: `Flash rain — ${r.amphoe}`,
      body: `${fmt(r.rain1h ?? 0)} มม. ในชั่วโมงเดียว (${r.name})`,
      lat: r.lat,
      lng: r.lng,
    }));
  return [...flash, ...heavy];
}

function soilInsights(ews: EwsStation[]): SensorInsight[] {
  return ews
    .filter((e) => e.status >= 2 || (e.soilMoisture ?? 0) >= SOIL_PRIMED)
    .sort((a, b) => b.status - a.status || (b.soilMoisture ?? 0) - (a.soilMoisture ?? 0))
    .slice(0, MAX_PER_TYPE)
    .map((e) => ({
      id: `soil-${e.id}`,
      type: "soil_saturated" as const,
      severity: e.status >= 3 ? ("critical" as const) : ("warn" as const),
      titleTh: `${e.status >= 3 ? "EWS วิกฤติ" : e.status >= 2 ? "EWS เตรียมพร้อม" : "ดินอิ่มตัว"} — ${e.tambon || e.name}`,
      titleEn: `${e.status >= 3 ? "EWS critical" : e.status >= 2 ? "EWS prepare" : "Soil saturated"} — ${e.amphoe}`,
      body: [
        e.soilMoisture != null ? `ดินชื้น ${Math.round(e.soilMoisture)}%` : null,
        e.rain12h != null && e.rain12h > 0 ? `ฝน 12 ชม. ${fmt(e.rain12h)} มม.` : null,
        e.warn,
      ]
        .filter(Boolean)
        .join(" · ") || "สถานีเตือนภัยชุมชนยกระดับ",
      lat: e.lat,
      lng: e.lng,
    }));
}

/** FloodDash "compound event": ≥2 independent signals in the same amphoe. */
function compoundInsights(
  gauges: WaterGauge[],
  rain: RainfallStation[],
  ews: EwsStation[],
): SensorInsight[] {
  const byAmphoe = new Map<string, { signals: string[]; lat: number; lng: number }>();
  const add = (amphoe: string, signal: string, lat: number, lng: number) => {
    if (!amphoe) return;
    const cur = byAmphoe.get(amphoe) ?? { signals: [], lat, lng };
    if (!cur.signals.includes(signal)) cur.signals.push(signal);
    byAmphoe.set(amphoe, cur);
  };
  for (const g of gauges) {
    if (g.situationLevel >= 4) add(g.amphoe, `น้ำสูง (${g.name})`, g.lat, g.lng);
    if (g.trend === "rising" && g.situationLevel >= 3) add(g.amphoe, "ระดับกำลังขึ้น", g.lat, g.lng);
  }
  for (const r of rain) {
    if ((r.rain1h ?? 0) >= RAIN_FLASH_1H) add(r.amphoe, `ฝน 1 ชม. ${fmt(r.rain1h ?? 0)} มม.`, r.lat, r.lng);
    else if ((r.rain24h ?? 0) >= RAIN_VERY_HEAVY_24H) add(r.amphoe, `ฝน 24 ชม. ${fmt(r.rain24h ?? 0)} มม.`, r.lat, r.lng);
  }
  for (const e of ews) {
    if ((e.soilMoisture ?? 0) >= SOIL_PRIMED) add(e.amphoe, "ดินอิ่มตัว", e.lat, e.lng);
  }
  return Array.from(byAmphoe.entries())
    .filter(([, v]) => v.signals.length >= 2)
    .sort((a, b) => b[1].signals.length - a[1].signals.length)
    .slice(0, 3)
    .map(([amphoe, v]) => ({
      id: `compound-${amphoe}`,
      type: "compound" as const,
      severity: v.signals.length >= 3 ? ("critical" as const) : ("warn" as const),
      titleTh: `อ.${amphoe} — เหตุการณ์ซ้อน (${v.signals.length} สัญญาณ)`,
      titleEn: `${amphoe} — compound event (${v.signals.length} signals)`,
      body: v.signals.join(" · "),
      lat: v.lat,
      lng: v.lng,
    }));
}

function reservoirInsights(reservoirs: RidReservoir[]): SensorInsight[] {
  return reservoirs
    .filter((r) => (r.storagePct ?? 0) >= RESERVOIR_WARN_PCT)
    .sort((a, b) => (b.storagePct ?? 0) - (a.storagePct ?? 0))
    .slice(0, 2)
    .map((r) => ({
      id: `rsv-${r.id}`,
      type: "reservoir_high" as const,
      severity:
        (r.storagePct ?? 0) >= RESERVOIR_CRIT_PCT ? ("critical" as const) : ("warn" as const),
      titleTh: `${r.name} — เก็บ ${Math.round(r.storagePct ?? 0)}%`,
      titleEn: `${r.name} — ${Math.round(r.storagePct ?? 0)}% full`,
      body:
        r.outflowMcm != null
          ? `ระบายออก ${fmt(r.outflowMcm, 2)} ล้าน ลบ.ม./วัน`
          : "ใกล้เต็มความจุ — ความจุรับน้ำเพิ่มเหลือน้อย",
      lat: null,
      lng: null,
    }));
}

/** Silent stations, measured against the newest observation in the same feed. */
function sensorGapInsights(gauges: WaterGauge[]): SensorInsight[] {
  const times = gauges
    .map((g) => ({ g, t: parseFeedTime(g.observedAt) }))
    .filter((x): x is { g: WaterGauge; t: number } => x.t != null);
  if (times.length < 3) return [];
  const newest = Math.max(...times.map((x) => x.t));
  return times
    .filter((x) => newest - x.t >= SENSOR_GAP_MS)
    .sort((a, b) => a.t - b.t)
    .slice(0, 2)
    .map(({ g, t }) => ({
      id: `gap-${g.id}`,
      type: "sensor_gap" as const,
      severity: "info" as const,
      titleTh: `${g.name} — ไม่รายงานมา ${Math.round((newest - t) / 3600_000)} ชม.`,
      titleEn: `${g.stationCode ?? g.name} — silent ${Math.round((newest - t) / 3600_000)}h`,
      body: "ค่าอาจไม่สะท้อนปัจจุบัน — อย่าใช้สถานีนี้ตัดสินใจลำพัง",
      lat: g.lat,
      lng: g.lng,
    }));
}

export function buildSensorInsights(inputs: {
  gauges: WaterGauge[];
  rain: RainfallStation[];
  ews: EwsStation[];
  reservoirs: RidReservoir[];
  basins: BasinWaterBalance[];
}): SensorInsight[] {
  const all = [
    ...compoundInsights(inputs.gauges, inputs.rain, inputs.ews),
    ...overbankInsights(inputs.gauges),
    ...rapidRiseInsights(inputs.basins),
    ...rainInsights(inputs.rain),
    ...soilInsights(inputs.ews),
    ...reservoirInsights(inputs.reservoirs),
    ...sensorGapInsights(inputs.gauges),
  ];
  return all
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity])
    .slice(0, MAX_TOTAL);
}
