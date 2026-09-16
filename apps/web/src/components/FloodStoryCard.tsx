/**
 * FloodStoryCard — a kid-readable explanation of the 7-stage flood story
 * that floodStoryLayer draws on the map. Same step numbers + anchors, so a
 * reader can match the picture on the map to the words here.
 *
 * Stages (real coords anchored on the map):
 *   1. Rain    — clouds drop water on Khao Luang
 *   2. Catchment — mountain + forest hold some water, send the rest downhill
 *   3. Runoff  — small creeks join to form Tha Dee Canal
 *   4. Khiri Wong — first gauge; level rises
 *   5. Lan Saka — second gauge; wave continues downstream
 *   6. City   — wave arrives; if higher than the bank, streets flood
 *   7. Bay    — outflow to Pak Phanang Bay (Gulf of Thailand)
 *
 * The panel is built so an 8-year-old who just learned to read can get the
 * shape ("rain falls, water goes downhill, town gets wet, water leaves to
 * the sea"), and a hydrologist can see the cause→effect chain in one read.
 */

import { useEffect, useMemo, useState } from "react";
import {
  WATERSHED_FORECAST_POINTS,
  type WatershedForecastPoint,
} from "@nst/shared";
import { leadTimeToCity, type ZoneSummary } from "../lib/watershed";
import { PAK_PHANANG_BAY_CENTROID } from "../map/layers";

interface Props {
  summaries: ZoneSummary[];
  className?: string;
  /** Hours of catchment rainfall (peak station) — surfaces a "how much rain"
   *  line above the cascade so the reader sees the cause→effect chain. */
  peakRain24hMm?: number | null;
}

interface Stage {
  step: number;
  en: string;
  th: string;
  /** Plain-language description a primary-schooler can understand. */
  describeEn: string;
  describeTh: string;
  /** Anchor used for the map badge — matches floodStoryLayer's anchor. */
  anchor: { lat: number; lng: number };
}

/** Static 7-stage layout — the labels and kid-readable copy. Live readings
 *  (where they exist) are overlaid at render time. */
const STAGES: Stage[] = [
  {
    step: 1, en: "Rain", th: "ฝนตก",
    describeEn: "Clouds drop rain on the mountain. The rain is what starts a flood.",
    describeTh: "เมฆปล่อยน้ำฝนลงมาที่ภูเขา น้ำฝนคือจุดเริ่มต้นของน้ำท่วม",
    anchor: WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "khiri-wong") ?? { lat: 8.46, lng: 99.78 },
  },
  {
    step: 2, en: "Catchment", th: "ลุ่มน้ำ",
    describeEn: "Some water soaks into the soil. The rest flows downhill.",
    describeTh: "น้ำบางส่วนซึมลงดิน ส่วนที่เหลือไหลลงที่ต่ำ",
    anchor: WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "khiri-wong") ?? { lat: 8.46, lng: 99.78 },
  },
  {
    step: 3, en: "Runoff", th: "น้ำไหลลงคลอง",
    describeEn: "Tiny streams join together and form the Tha Dee Canal.",
    describeTh: "ลำธารเล็กๆ ไหลมารวมกันเป็นคลองท่าดี",
    anchor: WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "khiri-wong") ?? { lat: 8.43, lng: 99.78 },
  },
  {
    step: 4, en: "Khiri Wong", th: "คีรีวง",
    describeEn: "The first gauge (a measuring stick in the water). The number on the stick tells us how high the water is.",
    describeTh: "ไม้วัดน้ำแรก ตัวเลขบอกว่าน้ำสูงแค่ไหน",
    anchor: WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "khiri-wong") ?? { lat: 8.4338, lng: 99.7833 },
  },
  {
    step: 5, en: "Lan Saka", th: "ลานสกา",
    describeEn: "The wave travels downstream. By the time it reaches here, the second gauge starts to rise.",
    describeTh: "คลื่นเคลื่อนลงไป เมื่อถึงที่นี่ไม้วัดที่สองเริ่มขยับขึ้น",
    anchor: WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "lan-saka") ?? { lat: 8.4012, lng: 99.802 },
  },
  {
    step: 6, en: "City", th: "เมืองนครศรีธรรมราช",
    describeEn: "The wave arrives. If the water is higher than the bank (the wall next to the river), the streets flood.",
    describeTh: "คลื่นมาถึงเมือง ถ้าน้ำสูงกว่าตลิ่งก็จะท่วมถนน",
    anchor: WATERSHED_FORECAST_POINTS.find((p: WatershedForecastPoint) => p.key === "city") ?? { lat: 8.4364, lng: 99.9631 },
  },
  {
    step: 7, en: "Bay", th: "อ่าวปากพนัง",
    describeEn: "Water that didn't flood flows out to the sea (the Gulf of Thailand).",
    describeTh: "น้ำที่ไม่ท่วมก็ไหลลงทะเล (อ่าวไทย)",
    anchor: PAK_PHANANG_BAY_CENTROID,
  },
];

function stageLive(stage: number, summaries: ZoneSummary[]): {
  level: string | null;
  trend: string;
  rising: boolean;
} {
  const keyByStep: Record<number, string | null> = {
    1: null,
    2: null,
    3: null,
    4: "khiri-wong",
    5: "lan-saka",
    6: "city",
    7: null,
  };
  const key = keyByStep[stage];
  if (!key) return { level: null, trend: "—", rising: false };
  const s = summaries.find((x) => x.zone.key === key);
  if (!s) return { level: null, trend: "—", rising: false };
  const lvl = s.levelMsl != null && Number.isFinite(s.levelMsl)
    ? `${s.levelMsl.toFixed(1)} m`
    : null;
  const trend = s.rising ? "▲" : "·";
  return { level: lvl, trend, rising: s.rising };
}

function stepToAnchorOffset(step: number, baseLng: number, baseLat: number): { lng: number; lat: number } {
  // Match the offsets used in floodStoryLayer so the on-map badges and the
  // card's step copy line up. Steps 1 + 2 sit above the mountain anchor.
  if (step === 1) return { lng: baseLng, lat: baseLat + 0.045 };
  if (step === 2) return { lng: baseLng, lat: baseLat + 0.018 };
  if (step === 3) return { lng: baseLng, lat: baseLat + 0.005 };
  return { lng: baseLng, lat: baseLat };
}

export function FloodStoryCard({ summaries, className, peakRain24hMm }: Props) {
  // ETA math for the closing line — surfaces the leading-edge travel time.
  const khiriEta = useMemo(() => leadTimeToCity("khiri-wong"), []);
  const [collapsed, setCollapsed] = useState(false);

  // Honour user prefers-reduced-motion (the rail was likely animating when
  // they toggled the card open; auto-collapsed stops the layout from jumping
  // past the rail bounds the moment they read the card).
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setCollapsed(true);
  }, []);

  return (
    <aside
      className={`${className ?? "fsc"} ${collapsed ? "is-collapsed" : ""}`}
      aria-label="How a flood happens in NST — the 7-stage story"
    >
      <header className="fsc__head">
        <div>
          <p className="fsc__eyebrow">HOW A FLOOD HAPPENS · <span lang="th">น้ำท่วมเกิดยังไง</span></p>
          <p className="fsc__title">7 stages · ฝน → เขา → คลอง → เมือง → ทะเล</p>
        </div>
        <button
          type="button"
          className="fsc__toggle"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? "Expand ▾" : "Collapse ▴"}
        </button>
      </header>

      {peakRain24hMm != null && peakRain24hMm > 0 && (
        <p className="fsc__cause">
          Rain right now: <span className="num">{peakRain24hMm.toFixed(0)} mm/24 h</span>
          <span className="fsc__cause-th" lang="th"> · ฝนตกบนเขาหลวง</span>
        </p>
      )}

      <ol className="fsc__list">
        {STAGES.map((s) => {
          const live = stageLive(s.step, summaries);
          const off = stepToAnchorOffset(s.step, s.anchor.lng, s.anchor.lat);
          void off; // anchor reference — kept in sync with floodStoryLayer
          return (
            <li key={s.step} className="fsc__step" data-step={s.step}>
              <span className="fsc__num" aria-hidden="true">{s.step}</span>
              <div className="fsc__body">
                <div className="fsc__head-row">
                  <h3 className="fsc__en">{s.en}</h3>
                  <h3 className="fsc__th" lang="th">{s.th}</h3>
                  {live.level && (
                    <span className="fsc__reading num" aria-label={`Live level ${live.level}`}>
                      {live.level}
                      {live.rising && <span className="fsc__trend" aria-hidden="true"> ▲</span>}
                    </span>
                  )}
                </div>
                <p className="fsc__describe">{s.describeEn}</p>
                <p className="fsc__describe-th" lang="th">{s.describeTh}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {khiriEta && (
        <footer className="fsc__foot">
          <p>
            <span lang="th">เวลาเดินทาง</span> · Travel time from Khao Luang to the city:
            <span className="num"> {khiriEta.minH.toFixed(1)}–{khiriEta.maxH.toFixed(1)} h</span>
            <span className="fsc__foot-meta num"> ({khiriEta.channelKm.toFixed(1)} km channel)</span>
          </p>
          <p className="fsc__foot-note">
            First-order estimate from Haver­sine × channel sinuosity ÷ flood-wave celerity band.
            Not a hydraulic routing result.
          </p>
        </footer>
      )}
    </aside>
  );
}
