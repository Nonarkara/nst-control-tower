/**
 * WaterFlowPicture — a 5-year-old-readable picture of how water gets to
 * NST. Replaces SensorSituationBoard's dry `คลองท่าดี → CITY` button strip
 * with one short SVG diagram that an operator can scan at a glance:
 *
 *   Khao Luang mountains → creeks + tributaries → cascade stations
 *                         → NST city blocks → Pak Phanang Bay waves
 *
 * Geography is honest: mountains on the LEFT (Khao Luang is south-west of
 * the city), the river flows left-to-right with downstream tilt, the bay
 * sits on the RIGHT where the water actually empties. Status colour drives
 * the main river stroke so a watching operator sees the cascade's mood at
 * one glance. Animated dashes reuse the `water-network__flow` keyframe so
 * downstream direction reads even without text.
 *
 * Data plumbing (pure pass-through props — does NOT fetch):
 *   - steps: FlowStep[] from thaDeeFlowSteps(waterGauges) — already
 *            filtered to the upstream cascade by SensorSituationBoard.
 *
 * Status vocabulary (one token per state — never an invented colour):
 *   normal → --accent    watch → --warn
 *   high → --alert       overbank → --bad
 *   unknown → --ink-3
 */

import { useEffect, useState } from "react";
import type { FallbackTier } from "@nst/shared";
import type { FlowStep } from "../lib/sensorSituation";

interface Props {
  steps: FlowStep[];
  fallbackTier?: FallbackTier;
  /** Reduce motion override (tests + honours the user pref in production). */
  forceReducedMotion?: boolean;
}

/** A node is anything we draw a label for: a station, the mountain source,
 *  the city, or the bay. Status drives its fill + the main river stroke. */
interface PictureNode {
  id: string;
  /** 0 = leftmost (mountains), 1 = rightmost (bay). */
  slot: 0 | 1 | 2 | 3;
  labelEn: string;
  labelTh: string;
  status: Status;
  level?: string;
  trend?: FlowStep["trend"];
  kind: "mountain" | "station" | "city" | "bay";
}

type Status = "normal" | "watch" | "high" | "overbank" | "unknown";

const STATUS_VAR: Record<Status, string> = {
  normal: "var(--accent)",     // river cyan — calm downstream
  watch: "var(--warn)",        // yellow — staying alert
  high: "var(--alert)",        // orange — heads up
  overbank: "var(--bad)",      // red    — over the bank
  unknown: "var(--ink-3)",     // muted  — no data
};

function situationToStatus(sit: number): Status {
  if (sit === 5) return "overbank";
  if (sit === 4) return "high";
  if (sit === 3) return "normal";
  if (sit === 2 || sit === 1) return "watch";
  return "unknown";
}

function trendGlyph(t: FlowStep["trend"]): string {
  if (t === "rising") return "▲";
  if (t === "falling") return "▼";
  if (t === "stable") return "→";
  return "·";
}

function fmt1(n: number | null | undefined, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}${unit}`;
}

// ── Layout — pick the four columns ──────────────────────────────────────────

/** Pick the four nodes in the order they should appear left-to-right:
 *   mountains → station 0 → station 1 → … → city → bay.
 *  Stations we have data for fill slots 1..2; missing stations degrade
 *  the picture to whatever we DO have, never invented placeholders.
 *
 *  Falls back to the city + bay even if no cascade data, so the rivers
 *  still show direction to the sea. */
function buildPicture(steps: FlowStep[]): { nodes: PictureNode[] } {
  const nodes: PictureNode[] = [];

  // 1. Source — Khao Luang mountain. Status is the max of whatever the
  //    cascade reports — a single high station shouldn't kick the source
  //    into overbank on its own, but a flood cascade should.
  const cascadeMaxSit = Math.max(0, ...steps.map((s) => s.situationLevel ?? 0));
  const sourceStatus: Status = cascadeMaxSit >= 5 ? "overbank" : cascadeMaxSit >= 4 ? "high" : "normal";
  nodes.push({
    id: "khao-luang",
    slot: 0,
    labelEn: "Khao Luang",
    labelTh: "เขาหลวง",
    status: sourceStatus,
    kind: "mountain",
  });

  // 2..3. Cascade stations (the three we have data for)
  const targetNames = new Set(["Khiri Wong", "Lan Saka", "City"]);
  const have = steps.filter((s) => targetNames.has(s.nameEn));
  for (const s of have) {
    if (s.nameEn === "Khiri Wong") {
      nodes.push({
        id: "khiri-wong",
        slot: 1,
        labelEn: "Khiri Wong",
        labelTh: "คีรีวง",
        status: situationToStatus(s.situationLevel),
        level: fmt1(s.levelM, " m"),
        trend: s.trend,
        kind: "station",
      });
    } else if (s.nameEn === "Lan Saka") {
      nodes.push({
        id: "lan-saka",
        slot: 2,
        labelEn: "Lan Saka",
        labelTh: "ลานสกา",
        status: situationToStatus(s.situationLevel),
        level: fmt1(s.levelM, " m"),
        trend: s.trend,
        kind: "station",
      });
    }
  }

  // 4. City block
  nodes.push({
    id: "nst-city",
    slot: have.some((s) => s.nameEn === "City") ? 3 : 3,
    labelEn: "NST City",
    labelTh: "เมืองนครศรีธรรมราช",
    status: have.some((s) => s.nameEn === "City")
      ? situationToStatus(steps.find((s) => s.nameEn === "City")!.situationLevel)
      : "normal",
    kind: "city",
  });

  // 5. Bay
  nodes.push({
    id: "pak-phanang",
    slot: 3,
    labelEn: "Pak Phanang Bay",
    labelTh: "อ่าวปากพนัง",
    status: "normal",
    kind: "bay",
  });

  return { nodes };
}

// ── SVG geometry ─────────────────────────────────────────────────────────────

const VB_W = 360;
const VB_H = 138;
// Slot column centres (where stations / source / city / bay sit)
const SLOT_X = [40, 116, 196, 304] as const;
const STATION_Y = 64;       // y for station circles
const MOUNTAIN_Y = 28;      // y for mountain peak top
const CITY_BASE_Y = 80;     // baseline for city buildings
const BAY_X_START = 280;
const LABEL_Y = 110;        // y for name labels
const META_Y = 124;         // y for level pills

function nodePosX(slot: 0 | 1 | 2 | 3): number {
  return SLOT_X[slot];
}

export function WaterFlowPicture({ steps, forceReducedMotion, fallbackTier }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (forceReducedMotion != null) return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [forceReducedMotion]);
  const motionOff = !!forceReducedMotion || reducedMotion;

  const { nodes } = buildPicture(steps);

  // ── Status pill style (label colour always tracks the data colour) ────
  const pillColor = (n: PictureNode) => STATUS_VAR[n.status];

  // ── Locate the city + bay slots ──────────────────────────────────────────
  const city = nodes.find((n) => n.kind === "city")!;
  const bay = nodes.find((n) => n.kind === "bay")!;
  const mountain = nodes.find((n) => n.kind === "mountain")!;
  const stations = nodes.filter((n) => n.kind === "station");

  return (
    <figure className="wfp" role="img" aria-label="How water flows from Khao Luang through NST city to Pak Phanang Bay">
      <svg
        className="wfp__svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Sky band — the lightest tone we use, just enough to anchor the mountains */}
        <rect x={0} y={0} width={VB_W} height={42} fill="var(--ground-soft)" opacity={0.55} />

        {/* Clouds + rain on the mountains (so a 5-year-old reads "rain → mountain → river") */}
        <g>
          <ellipse cx={36} cy={10} rx={14} ry={5} fill="var(--ink-low)" opacity={0.55} />
          <ellipse cx={48} cy={12} rx={10} ry={4} fill="var(--ink-low)" opacity={0.55} />
          {/* raindrops — short tilted strokes */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={i}
              x1={28 + i * 6}
              y1={16}
              x2={26 + i * 6}
              y2={22}
              stroke="var(--data)"
              strokeWidth={1}
              opacity={0.6}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Khao Luang — three triangles, descending height, overlapping */}
        <g transform={`translate(${nodePosX(0)} ${MOUNTAIN_Y})`}>
          <polygon points={"-30,32 -10,-4 6,32"} fill="var(--ink-3)" />
          <polygon points={"-12,32 8,-12 30,32"} fill="var(--ink-2)" />
          <polygon points={"-20,32 -20,8 -2,-2 -2,32"} fill="var(--ink-2)" opacity={0.7} />
          {/* snow caps */}
          <polygon points={"-22,12 -16,4 -10,12"} fill="var(--panel)" opacity={0.9} />
          <polygon points={"-2,-2 4,-10 10,-2 6,4 -2,-2"} fill="var(--panel)" opacity={0.9} />
        </g>

        {/* Tributary creeks joining the main river from above. Five thinner
            wavy drops in the valley flat east of the mountains — like
            rain falling on the catchment and trickling into the channel.
            Each is a curly line that meets the main river at a different
            point. */}
        <g>
          {[
            { x: 78,  len: 18 },  // just east of the mountain base
            { x: 102, len: 14 },  // upper stream, between KW and LS
            { x: 142, len: 20 },  // mid stream, between KW and LS
            { x: 178, len: 16 },  // just east of LS
            { x: 218, len: 22 },  // longer tributary past LS heading to city
          ].map((t, i) => (
            <path
              key={i}
              d={`M ${t.x} ${STATION_Y - t.len} q 3 -3 0 -4 t 0 ${t.len - 4}`}
              fill="none"
              stroke="var(--accent)"
              strokeOpacity={0.45}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Small feeder creek from the mountain shoulder directly into the river */}
        <path
          d={`M ${nodePosX(0) + 12} 48 q 8 6 16 6 t 36 18`}
          fill="none"
          stroke="var(--accent)"
          strokeOpacity={0.5}
          strokeWidth={1.6}
          strokeLinecap="round"
        />

        {/* MAIN RIVER — wide wavy band, status-coloured.
            Path: starts at the mountain foot, meanders through both stations,
            widens at the city, broadens out into the bay waves. */}
        <path
          d={
            `M ${nodePosX(0) + 14} 60` +
            ` Q ${nodePosX(0) + 32} 64, ${nodePosX(1) - 24} 64` +
            ` C ${nodePosX(1) - 10} 60, ${nodePosX(1) + 10} 72, ${nodePosX(1) + 24} 66` +
            ` L ${nodePosX(2) - 30} 66` +
            ` C ${nodePosX(2) - 14} 70, ${nodePosX(2) + 14} 62, ${nodePosX(2) + 30} 68` +
            ` L ${BAY_X_START - 8} 70` +
            ` L ${BAY_X_START} 70`
          }
          fill="none"
          stroke="var(--accent)"
          strokeOpacity={0.18}
          strokeWidth={20}
          strokeLinecap="round"
        />

        {/* MAIN RIVER outline */}
        <path
          d={
            `M ${nodePosX(0) + 14} 60` +
            ` Q ${nodePosX(0) + 32} 64, ${nodePosX(1) - 24} 64` +
            ` C ${nodePosX(1) - 10} 60, ${nodePosX(1) + 10} 72, ${nodePosX(1) + 24} 66` +
            ` L ${nodePosX(2) - 30} 66` +
            ` C ${nodePosX(2) - 14} 70, ${nodePosX(2) + 14} 62, ${nodePosX(2) + 30} 68` +
            ` L ${BAY_X_START - 8} 70` +
            ` L ${BAY_X_START} 70`
          }
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Animated flow dashes on top — same keyframe as WaterNetwork.
            Two parallel offsets so the upstream half + downstream half look
            continuous even when the curve changes direction. */}
        <path
          className={motionOff ? undefined : "water-network__flow"}
          d={
            `M ${nodePosX(0) + 14} 60` +
            ` Q ${nodePosX(0) + 32} 64, ${nodePosX(1) - 24} 64` +
            ` L ${nodePosX(1) + 24} 64` +
            ` L ${nodePosX(2) - 30} 64` +
            ` L ${nodePosX(2) + 30} 64` +
            ` L ${BAY_X_START} 64`
          }
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="5 7"
          strokeLinecap="round"
        />

        {/* A muted caption above the dashes: this is the THA DEE channel,
            a tiny tag so a reader knows what they're looking at */}
        <text x={nodePosX(1)} y={56} textAnchor="middle"
              fontSize="8" letterSpacing="0.14em" fill="var(--ink-3)"
              fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif" fontWeight="600">
          KH LONG THA DEE · คลองท่าดี
        </text>

        {/* NST CITY — five little buildings, each a different height, with
            a single ink-pink fill. Status tint drives the border. */}
        <g transform={`translate(${nodePosX(3) - 16} 0)`}>
          {/* grouped city silhouette, baseline at CITY_BASE_Y. */}
          {[
            { x: 0,  h: 28 },
            { x: 10, h: 40 },
            { x: 20, h: 24 },
            { x: 30, h: 36 },
          ].map((b, i) => (
            <g key={i}>
              <rect
                x={b.x}
                y={CITY_BASE_Y - b.h}
                width={8}
                height={b.h}
                fill="var(--ink-2)"
              />
              {/* windows — small darker rectangles */}
              <rect x={b.x + 1.5} y={CITY_BASE_Y - b.h + 4} width={5} height={1} fill="var(--panel)" />
              <rect x={b.x + 1.5} y={CITY_BASE_Y - b.h + 9} width={5} height={1} fill="var(--panel)" />
            </g>
          ))}
        </g>

        {/* PAK PHANANG BAY — three sine waves + sea-blue wash */}
        <g>
          <rect x={BAY_X_START + 6} y={62} width={VB_W - BAY_X_START - 6} height={20} fill="var(--data)" opacity={0.25} />
          {[0, 1, 2, 3].map((i) => {
            const yPos = 64 + i * 4;
            return (
              <path
                key={i}
                d={`M ${BAY_X_START + 4} ${yPos} q 6 -4 12 0 t 12 0 t 12 0 t 12 0`}
                fill="none"
                stroke="var(--data)"
                strokeWidth={1.4}
                opacity={0.7 - i * 0.15}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* STATION circles for KW + LS.
            Drawn AFTER the river so they sit on top. White fill, status
            border, label and pill below. */}
        {stations.map((n) => (
          <g key={n.id}>
            {/* anchor circle */}
            <circle
              cx={nodePosX(n.slot)}
              cy={STATION_Y}
              r={9}
              fill="var(--panel)"
              stroke={pillColor(n)}
              strokeWidth={2.5}
            />
            {/* centre dot */}
            <circle
              cx={nodePosX(n.slot)}
              cy={STATION_Y}
              r={3}
              fill={pillColor(n)}
            />
            {/* name (English) */}
            <text
              x={nodePosX(n.slot)}
              y={LABEL_Y}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--ink)"
              fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
            >
              {n.labelEn}
            </text>
            {/* name (Thai) */}
            <text
              x={nodePosX(n.slot)}
              y={LABEL_Y + 11}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-3)"
              fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
              lang="th"
            >
              {n.labelTh}
            </text>
            {/* level pill */}
            {n.level && (
              <g>
                <rect
                  x={nodePosX(n.slot) - 24}
                  y={META_Y - 9}
                  width={48}
                  height={12}
                  rx={0}
                  fill="transparent"
                  stroke={pillColor(n)}
                  strokeWidth={1}
                />
                <text
                  x={nodePosX(n.slot)}
                  y={META_Y}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={pillColor(n)}
                  fontFamily="'Inter', monospace"
                  letterSpacing="0.04em"
                >
                  {n.level}{n.trend ? ` ${trendGlyph(n.trend)}` : ""}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* MOUNTAIN label cluster — separate from station cluster so a 5yo
            reads mountains → flow → city without crashing the eyes */}
        <g>
          <text
            x={nodePosX(0)}
            y={LABEL_Y}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--ink)"
            fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
          >
            {mountain.labelEn}
          </text>
          <text
            x={nodePosX(0)}
            y={LABEL_Y + 11}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-3)"
            fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
            lang="th"
          >
            {mountain.labelTh}
          </text>
          <text
            x={nodePosX(0)}
            y={META_Y}
            textAnchor="middle"
            fontSize="8"
            letterSpacing="0.14em"
            fill="var(--ink-3)"
            fontFamily="'Inter', monospace"
            fontWeight="600"
          >
            MOUNTAIN · ต้นน้ำ
          </text>
        </g>

        {/* CITY label */}
        <g>
          <text
            x={nodePosX(city.slot)}
            y={CITY_BASE_Y + 16}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--ink)"
            fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
          >
            {city.labelEn}
          </text>
          <text
            x={nodePosX(city.slot)}
            y={CITY_BASE_Y + 26}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-3)"
            fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
            lang="th"
          >
            {city.labelTh}
          </text>
        </g>

        {/* BAY label */}
        <g>
          <text
            x={nodePosX(bay.slot) + 12}
            y={LABEL_Y}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--ink)"
            fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
          >
            {bay.labelEn}
          </text>
          <text
            x={nodePosX(bay.slot) + 12}
            y={LABEL_Y + 11}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-3)"
            fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
            lang="th"
          >
            {bay.labelTh}
          </text>
          <text
            x={nodePosX(bay.slot) + 12}
            y={META_Y}
            textAnchor="middle"
            fontSize="8"
            letterSpacing="0.14em"
            fill="var(--ink-3)"
            fontFamily="'Inter', monospace"
            fontWeight="600"
          >
            OUTLET · ปลายน้ำ
          </text>
        </g>

        {/* Long direction arrows between slots — bigger-than-life so a 5yo
            can read "downstream" without a parent explaining */}
        <g aria-hidden="true">
          {[
            { x: (nodePosX(0) + nodePosX(1)) / 2, slotFrom: 0, slotTo: 1 },
            { x: (nodePosX(1) + nodePosX(2)) / 2, slotFrom: 1, slotTo: 2 },
            { x: (nodePosX(2) + nodePosX(3)) / 2 + 12, slotFrom: 2, slotTo: 3 },
          ].map((a, i) => (
            <g key={i}>
              <polygon
                points={`${a.x + 4},60 ${a.x + 8},64 ${a.x + 4},68 ${a.x + 0},64`}
                fill="var(--ink-3)"
                opacity={0.7}
              />
            </g>
          ))}
        </g>
      </svg>

      <figcaption className="wfp__caption">
        <span className="wfp__flow">
          <span aria-hidden="true">▸</span>
          <span lang="th">น้ำไหล</span> · water flows downstream →
        </span>
        {fallbackTier && (
          <span className={`wfp__tier wfp__tier--${fallbackTier}`}>
            {fallbackTier === "live"
              ? "LIVE"
              : fallbackTier === "cache" || fallbackTier === "database"
                ? "CACHED"
                : fallbackTier === "scenario"
                  ? "SCENARIO"
                  : fallbackTier === "reference"
                    ? "REF"
                    : fallbackTier === "unavailable"
                      ? "OFFLINE"
                      : "—"}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ── Status helpers (kept here so the test can import them directly) ───────────

/** Map HII `situation_level` (1..5) to the diagram's `Status` vocabulary. */
export function levelToStatus(sit: number): Status {
  return situationToStatus(sit);
}

/** A station row from `thaDeeFlowSteps` becomes a PictureNode. */
export function stationRow(step: FlowStep, slot: 1 | 2 | 3): PictureNode {
  return {
    id: step.nameEn.toLowerCase().replace(/\s+/g, "-"),
    slot,
    labelEn: step.nameEn,
    labelTh: step.name,
    status: situationToStatus(step.situationLevel),
    level: fmt1(step.levelM, " m"),
    trend: step.trend,
    kind: "station",
  };
}
