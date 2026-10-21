/**
 * situationHeadline — the one sentence a mayor needs above the fold:
 * which gauge is worst, how long until it overtops, what to do, and how old
 * the numbers are.
 *
 * Urgency order (first match wins):
 *   1. a gauge already over its bank                      → critical
 *   2. the soonest observed time-to-overtop ≤ 6 h          → critical
 *   3. time-to-overtop ≤ 24 h                              → warning
 *   4. the LEVEL WATCH ranking (fullness / RID critical)   → its own level
 *   5. otherwise every gauge is below watch                → normal
 *
 * Time-to-overtop is never invented: it is the basin ledger's
 * `etaOvertopH` (freeboard ÷ observed rise rate). When no gauge is rising
 * there is no ETA and the headline says so.
 *
 * Suggested actions are plain guidance tied to the level, labelled as a
 * suggestion in the UI — the municipality's SOP stays the authority.
 */

import type { BasinWaterBalance, FallbackTier, WaterGauge } from "@nst/shared";
import type { CctvCamera } from "../map/layers";
import type { StatusLevel } from "./status";
import { distanceM, rankLevelWatch } from "./levelWatch";

export interface SituationHeadline {
  level: StatusLevel;
  /** The sentence: "คลองท่าดี at Lan Saka may overtop in about 3.5 h". */
  headline: string;
  /** Supporting numbers: level, headroom, rise rate. */
  detail: string;
  /** What to do. */
  action: string;
  /** "Gauges updated 12 min ago" (+ a caveat when the feed isn't live). */
  freshness: string;
  gauge: { name: string; lat: number; lng: number } | null;
  camera: CctvCamera | null;
}

const OVERTOP_CRITICAL_H = 6;
const OVERTOP_WARNING_H = 24;
const CAMERA_MAX_M = 1500;

function place(g: Pick<WaterGauge, "name" | "riverName">): string {
  const river = g.riverName?.trim();
  return river && !g.name.includes(river) ? `${g.name} (${river})` : g.name;
}

function hours(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  return `${h < 10 ? h.toFixed(1) : Math.round(h)} h`;
}

function ageWords(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${Math.round(min)} min ago`;
  if (min < 1440) return `${Math.round(min / 60)} h ago`;
  const d = Math.round(min / 1440);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function freshnessOf(ageMinutes: number | null, tier: FallbackTier | "loading" | undefined): string {
  if (tier === "loading") return "Loading gauge data…";
  if (ageMinutes == null || !Number.isFinite(ageMinutes)) return "Gauge data age unknown";
  const age = `Gauges updated ${ageWords(ageMinutes)}`;
  if (tier && tier !== "live") return `${age} · not live (${tier}) — treat as a snapshot`;
  return age;
}

function nearestCamera(lat: number, lng: number, cameras: CctvCamera[]): CctvCamera | null {
  let best: { c: CctvCamera; d: number } | null = null;
  for (const c of cameras) {
    if (c.status === "offline") continue;
    const d = distanceM(lat, lng, c.lat, c.lng);
    if (d <= CAMERA_MAX_M && (!best || d < best.d)) best = { c, d };
  }
  return best?.c ?? null;
}

export type HeadlineLang = "en" | "th";

export function buildSituationHeadline(opts: {
  gauges: WaterGauge[];
  basins?: BasinWaterBalance[];
  cameras?: CctvCamera[];
  ageMinutes: number | null;
  tier?: FallbackTier | "loading";
  /** The whole card reads in one language. Thai is not an afterthought: it is
   *  the language the mayor and the duty officers read it in. */
  lang?: HeadlineLang;
}): SituationHeadline {
  const th = opts.lang === "th";
  const { gauges } = opts;
  const basins = opts.basins ?? [];
  const cameras = opts.cameras ?? [];
  const freshness = th ? freshnessTh(opts.ageMinutes, opts.tier) : freshnessOf(opts.ageMinutes, opts.tier);

  if (gauges.length === 0) {
    return {
      level: "unknown",
      headline: th
        ? (opts.tier === "loading" ? "กำลังตรวจสอบสถานีวัดน้ำ…" : "ขณะนี้ไม่มีข้อมูลสถานีวัดน้ำ")
        : (opts.tier === "loading" ? "Checking the water gauges…" : "No water-gauge data right now"),
      detail: th ? "ไม่สามารถประเมินระดับน้ำในแม่น้ำได้หากไม่มีข้อมูลจากสถานี" : "The river levels can't be judged without the gauge feed.",
      action: th ? "เปิดเมนู “More” แล้วเลือก “Source catalog” เพื่อดูว่าแหล่งข้อมูลใดขัดข้อง" : "Open Source catalog to see which feed is down.",
      freshness,
      gauge: null,
      camera: null,
    };
  }

  const byId = new Map(gauges.map((g) => [g.id, g]));
  const byCode = new Map(gauges.filter((g) => g.stationCode).map((g) => [g.stationCode as string, g]));
  const withCamera = (g: WaterGauge) => nearestCamera(g.lat, g.lng, cameras);

  // 1. Already over the bank.
  const over = gauges
    .filter((g) => (g.situationLevel ?? 0) >= 5 || (g.bankMsl != null && g.bankMsl !== 0 && g.diffFromBank != null && g.diffFromBank >= 0))
    .sort((a, b) => (b.diffFromBank ?? 0) - (a.diffFromBank ?? 0))[0];
  if (over) {
    const lvl = over.levelMsl != null ? `${over.levelMsl.toFixed(2)} m` : "—";
    if (th) {
      const aboveTh = over.diffFromBank != null && over.diffFromBank > 0 ? ` สูงกว่าตลิ่ง ${over.diffFromBank.toFixed(2)} ม.` : "";
      return {
        level: "critical",
        headline: `${place(over)} น้ำล้นตลิ่ง${aboveTh}`,
        detail: `ระดับน้ำ ${lvl.replace(" m", " ม.")} · ${trendTh(over.trend)}${over.amphoe ? ` · ${over.amphoe}` : ""}`,
        action: `แจ้งเตือนประชาชนริม${over.riverName || "ลำน้ำนี้"} และส่งทีมตอบสนอง ยืนยันจากกล้องที่ใกล้ที่สุด`,
        freshness,
        gauge: { name: over.name, lat: over.lat, lng: over.lng },
        camera: withCamera(over),
      };
    }
    const above = over.diffFromBank != null && over.diffFromBank > 0 ? ` by ${over.diffFromBank.toFixed(2)} m` : "";
    return {
      level: "critical",
      headline: `${place(over)} is over its bank${above}`,
      detail: `Water level ${lvl} · ${over.trend}${over.amphoe ? ` · ${over.amphoe}` : ""}`,
      action: `Warn residents along ${over.riverName || "this waterway"} and send the response team. Confirm on the nearest camera.`,
      freshness,
      gauge: { name: over.name, lat: over.lat, lng: over.lng },
      camera: withCamera(over),
    };
  }

  // 2–3. Soonest observed time-to-overtop from the basin ledger.
  let soonest: { h: number; snap: BasinWaterBalance["gauges"][number]; g: WaterGauge | undefined } | null = null;
  for (const b of basins) {
    for (const snap of b.gauges) {
      const h = snap.etaOvertopH;
      if (h == null || !Number.isFinite(h) || h <= 0) continue;
      if (!soonest || h < soonest.h) {
        soonest = { h, snap, g: byId.get(snap.id) ?? (snap.code ? byCode.get(snap.code) : undefined) };
      }
    }
  }
  if (soonest && soonest.h <= OVERTOP_WARNING_H) {
    const { h, snap, g } = soonest;
    const critical = h <= OVERTOP_CRITICAL_H;
    const name = g ? place(g) : snap.name;
    if (th) {
      const detailTh = [
        snap.freeboardM != null ? `ต่ำกว่าตลิ่ง ${snap.freeboardM.toFixed(2)} ม.` : null,
        snap.riseMPerH != null ? `น้ำขึ้น ${(snap.riseMPerH * 100).toFixed(0)} ซม./ชม.` : "น้ำกำลังขึ้น",
        snap.fullnessPct != null ? `เต็ม ${Math.round(snap.fullnessPct)}%` : null,
      ].filter(Boolean).join(" · ");
      return {
        level: critical ? "critical" : "warning",
        headline: `${name} อาจล้นตลิ่งในอีกประมาณ ${hoursTh(h)}`,
        detail: detailTh,
        action: critical
          ? `แจ้งเตือนประชาชนริม${g?.riverName || "ลำน้ำนี้"} ทันที เตรียมเครื่องสูบน้ำและทีมตอบสนอง`
          : `ให้ทีมตอบสนองของ${g?.amphoe || "อำเภอ"}เตรียมพร้อม และตรวจสอบอีกครั้งใน 1 ชั่วโมง`,
        freshness,
        gauge: g ? { name: g.name, lat: g.lat, lng: g.lng } : null,
        camera: g ? withCamera(g) : null,
      };
    }
    const detail = [
      snap.freeboardM != null ? `${snap.freeboardM.toFixed(2)} m below bank` : null,
      snap.riseMPerH != null ? `rising ${(snap.riseMPerH * 100).toFixed(0)} cm/h` : "rising",
      snap.fullnessPct != null ? `${Math.round(snap.fullnessPct)}% full` : null,
    ].filter(Boolean).join(" · ");
    return {
      level: critical ? "critical" : "warning",
      headline: `${name} may overtop in about ${hours(h)}`,
      detail,
      action: critical
        ? `Warn residents along ${g?.riverName || "this waterway"} now; put pumps and the response team on standby.`
        : `Put the ${g?.amphoe || "district"} response team on standby and check again in 1 hour.`,
      freshness,
      gauge: g ? { name: g.name, lat: g.lat, lng: g.lng } : null,
      camera: g ? withCamera(g) : null,
    };
  }

  // 4. LEVEL WATCH ranking — full channels / near RID critical, no ETA.
  const top = rankLevelWatch({ gauges, cameras })[0];
  if (top) {
    const level: StatusLevel = top.level === "critical" ? "critical" : top.level === "warning" ? "warning" : "watch";
    const nameWithRiver = top.river && !top.name.includes(top.river) ? `${top.name} (${top.river})` : top.name;
    if (th) {
      return {
        level,
        headline: `${nameWithRiver}: ${plainReasonTh(top.reason, top.reasonTh)} ${trendTh(top.trend)}`,
        detail: `ระดับน้ำ ${top.levelM != null ? `${top.levelM.toFixed(2)} ม.` : "—"}${top.refM != null ? ` · ${top.refKind === "critical" ? "ระดับวิกฤต" : "ตลิ่ง"} ${top.refM.toFixed(2)} ม.` : ""}${soonest ? ` · ไม่มีสถานีใดล้นตลิ่งภายใน ${OVERTOP_WARNING_H} ชม. ตามอัตราปัจจุบัน` : " · ไม่มีสถานีใดมีแนวโน้มล้นตลิ่ง"}`,
        action: level === "watch"
          ? "ยังไม่ต้องดำเนินการ เฝ้าระวังต่อไป สถานีนี้ใกล้ระดับสูงสุดมากที่สุด"
          : "ตรวจสอบกล้องที่ใกล้ที่สุด และตรวจซ้ำใน 1 ชั่วโมง",
        freshness,
        gauge: { name: top.name, lat: top.lat, lng: top.lng },
        camera: top.camera,
      };
    }
    const trend = top.trend === "rising" ? "and rising" : top.trend === "falling" ? "and falling" : "and holding steady";
    return {
      level,
      headline: `${nameWithRiver}: ${plainReason(top.reason)}, ${trend}`,
      detail: `Water level ${top.levelM != null ? `${top.levelM.toFixed(2)} m` : "—"}${top.refM != null ? ` · ${top.refKind === "critical" ? "critical" : "bank"} ${top.refM.toFixed(2)} m` : ""}${soonest ? ` · no gauge overtops within ${OVERTOP_WARNING_H} h at current rates` : " · no gauge is on course to overtop its bank"}`,
      action: level === "watch"
        ? "No action yet. Keep watching; this gauge is closest to its limit."
        : "Check the nearest camera and re-check in 1 hour.",
      freshness,
      gauge: { name: top.name, lat: top.lat, lng: top.lng },
      camera: top.camera,
    };
  }

  // 5. Calm.
  return {
    level: "normal",
    headline: th ? `สถานีวัดน้ำทั้ง ${gauges.length} แห่งอยู่ต่ำกว่าระดับเฝ้าระวัง` : `All ${gauges.length} water gauges are below watch level`,
    detail: th
      ? (soonest ? `ประมาณการล้นตลิ่งที่ใกล้ที่สุดยังอีกมากกว่า ${OVERTOP_WARNING_H} ชม.` : "ไม่มีสถานีใดมีแนวโน้มล้นตลิ่ง")
      : (soonest ? `Nearest overtop estimate is more than ${OVERTOP_WARNING_H} h away.` : "No gauge is rising toward its bank."),
    action: th ? "ไม่ต้องดำเนินการ" : "No action needed.",
    freshness,
    gauge: null,
    camera: null,
  };
}

/** "97% of bank" is analyst shorthand; the mayor reads a sentence. */
export function plainReason(reason: string): string {
  const pct = reason.match(/^(\d+)% of bank$/);
  if (pct) return `water is ${pct[1]}% of the way to the top of the bank`;
  if (reason === "over bank") return "water is over the bank";
  if (reason === "at/above critical level") return "water has reached the critical level";
  const gap = reason.match(/^([\d.]+) m below critical$/);
  if (gap) return `water is ${gap[1]} m from the critical level`;
  if (reason === "high (situation 4)") return "water is high";
  return reason;
}

// ── Thai ────────────────────────────────────────────────────────────────────

function trendTh(trend: string): string {
  return trend === "rising" ? "และกำลังสูงขึ้น" : trend === "falling" ? "และกำลังลดลง" : "และทรงตัว";
}

function hoursTh(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} นาที`;
  return `${h < 10 ? h.toFixed(1) : Math.round(h)} ชั่วโมง`;
}

/** Plain Thai for a level-watch reason; falls back to the table's own Thai. */
export function plainReasonTh(reason: string, reasonTh: string): string {
  const pct = reason.match(/^(\d+)% of bank$/);
  if (pct) return `น้ำอยู่ที่ ${pct[1]}% ของระดับตลิ่ง`;
  if (reason === "over bank") return "น้ำล้นตลิ่ง";
  if (reason === "at/above critical level") return "น้ำถึงระดับวิกฤตแล้ว";
  const gap = reason.match(/^([\d.]+) m below critical$/);
  if (gap) return `น้ำต่ำกว่าระดับวิกฤต ${gap[1]} ม.`;
  if (reason === "high (situation 4)") return "ระดับน้ำสูง";
  return reasonTh || reason;
}

function ageWordsTh(min: number): string {
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${Math.round(min)} นาทีที่แล้ว`;
  if (min < 1440) return `${Math.round(min / 60)} ชั่วโมงที่แล้ว`;
  return `${Math.round(min / 1440)} วันที่แล้ว`;
}

function freshnessTh(ageMinutes: number | null, tier: FallbackTier | "loading" | undefined): string {
  if (tier === "loading") return "กำลังโหลดข้อมูลสถานี…";
  if (ageMinutes == null || !Number.isFinite(ageMinutes)) return "ไม่ทราบอายุของข้อมูลสถานี";
  const age = `อัปเดตข้อมูลสถานี${ageWordsTh(ageMinutes)}`;
  if (tier && tier !== "live") return `${age} · ไม่ใช่ข้อมูลสด (${tier}) — ถือเป็นภาพ ณ เวลาหนึ่ง`;
  return age;
}
