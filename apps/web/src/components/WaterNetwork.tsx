/**
 * WaterNetwork — one diagram that shows how the NST water system actually
 * connects: headwaters → upstream cascade → city → outlet, with the four
 * RID reservoirs + GloFAS runoff proxy off to the side. Replaces the
 * previous "five separate water panels" pattern with a single connected
 * picture an operator can read in three seconds.
 *
 * Layout: horizontal flow left→right, three columns of nodes (headwater
 * / transit / outlet) with the reservoirs stacked below. Edges animate
 * with a dashed flow; status colour drives each node's border + the edge
 * tint. Honours prefers-reduced-motion.
 *
 * Data plumbing (pure pass-through props — the component does NOT fetch
 * anything itself; App.tsx wires the SWR hooks and threads the result in,
 * keeping the panel SSR-able and trivially unit-testable):
 *   - watershedSummaries: ZoneSummary[]   from useMemo in App.tsx
 *   - reservoirs:        RidReservoir[]  from /api/water/reservoirs-rid
 *   - runoffProxy:       DamStatus | null from /api/flood/dam (the
 *                         Khao Luang GloFAS proxy since NST has no
 *                         regulating dam)
 *   - basins:            BasinWaterBalance[] from /api/water/balance
 *
 * Status vocabulary (one token per state, never an invented colour):
 *   normal → --good   watch → --warn   high → --alert   overbank → --bad
 *   unknown → --ink-3
 */

import { useEffect, useState } from "react";
import type { DamStatus, FallbackTier, RidReservoir, BasinWaterBalance, BasinStressBand } from "@nst/shared";
import type { ZoneStatus, ZoneSummary } from "../lib/watershed";

interface Props {
  watershedSummaries: ZoneSummary[];
  reservoirs: RidReservoir[];
  runoffProxy: DamStatus | null;
  basins: BasinWaterBalance[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  /** Reduce motion override (used by tests + honour the user pref in production). */
  forceReducedMotion?: boolean;
}

interface NodeLayout {
  id: string;
  /** Column bucket — 0 headwaters, 1 upstream-cascade, 2 city, 3 outlet. */
  col: 0 | 1 | 2 | 3;
  /** Y offset inside the column (0 = top), in node units. */
  row: number;
  label: string;
  labelTh: string;
  sub?: string;
  status: "normal" | "watch" | "high" | "overbank" | "unknown";
  /** Numeric read-out (e.g. "12.3 m³/s") shown under the label. */
  reading?: string;
}

interface EdgeLayout {
  from: string;
  to: string;
  /** Edge status — drives stroke colour. */
  status: "normal" | "watch" | "high" | "overbank" | "unknown";
}

// ── Status helpers ─────────────────────────────────────────────────────────

function basinBandToStatus(b: BasinStressBand | undefined): NodeLayout["status"] {
  if (b === "overflow") return "overbank";
  if (b === "tight") return "high";
  if (b === "ok") return "normal";
  return "unknown";
}

/** Map the watershed cascade's ZoneStatus (flood/nodata) to the network
 *  diagram's vocabulary (overbank/unknown). Keeps the two systems speaking
 *  the same five levels. */
function zoneStatusToNodeStatus(s: ZoneStatus | undefined): NodeLayout["status"] {
  if (s === "flood") return "overbank";
  if (s === "high") return "high";
  if (s === "watch") return "watch";
  if (s === "normal") return "normal";
  return "unknown";
}

function damStatusToStatus(s: DamStatus["status"] | undefined): NodeLayout["status"] {
  if (s === "spilling" || s === "high") return "overbank";
  if (s === "normal") return "normal";
  if (s === "low") return "watch";
  return "unknown";
}

function reservoirStatus(pct: number | null | undefined): NodeLayout["status"] {
  if (pct == null) return "unknown";
  if (pct >= 90) return "overbank";
  if (pct >= 75) return "high";
  if (pct >= 40) return "normal";
  return "watch";
}

// ── Build the layout from live data ────────────────────────────────────────

function buildLayout(p: {
  watershedSummaries: ZoneSummary[];
  reservoirs: RidReservoir[];
  runoffProxy: DamStatus | null;
  basins: BasinWaterBalance[];
}): { nodes: NodeLayout[]; edges: EdgeLayout[] } {
  const nodes: NodeLayout[] = [];
  const edges: EdgeLayout[] = [];

  // Headwaters — Khao Luang runoff proxy
  const runoffStatus = damStatusToStatus(p.runoffProxy?.status);
  nodes.push({
    id: "khao-luang",
    col: 0,
    row: 0,
    label: "Khao Luang runoff",
    labelTh: "น้ำไหลเขาใหญ่",
    sub: "GloFAS proxy",
    status: runoffStatus,
    reading: p.runoffProxy?.outflowCms != null ? `${p.runoffProxy.outflowCms.toFixed(1)} m³/s` : "—",
  });

  // Upstream cascade — Khiri Wong → Lan Saka
  const kw = p.watershedSummaries.find((s) => s.zone.key === "khiri-wong");
  const ls = p.watershedSummaries.find((s) => s.zone.key === "lan-saka");
  nodes.push({
    id: "khiri-wong",
    col: 1,
    row: 0,
    label: "Khiri Wong",
    labelTh: "คีรีวง",
    sub: "Tha Dee source",
    status: zoneStatusToNodeStatus(kw?.status),
    reading: kw?.levelMsl != null ? `${kw.levelMsl.toFixed(2)} m` : undefined,
  });
  nodes.push({
    id: "lan-saka",
    col: 1,
    row: 1,
    label: "Lan Saka",
    labelTh: "ลานสกา",
    sub: "Tha Dee upper",
    status: zoneStatusToNodeStatus(ls?.status),
    reading: ls?.levelMsl != null ? `${ls.levelMsl.toFixed(2)} m` : undefined,
  });

  // City
  const cityBasin = p.basins.find((b) => b.basinId === "city_tha_dee");
  const cityStatus = basinBandToStatus(cityBasin?.horizons[0]?.band);
  nodes.push({
    id: "city",
    col: 2,
    row: 0,
    label: "NST City",
    labelTh: "เมืองนครศรีธรรมราช",
    sub: "Tha Dee at city",
    status: cityStatus,
    reading: cityBasin
      ? `${(cityBasin.horizons[0]?.inflowM3Lo ?? 0) >= 1e6
          ? `${((cityBasin.horizons[0]!.inflowM3Lo) / 1e6).toFixed(1)}M`
          : `${Math.round((cityBasin.horizons[0]?.inflowM3Lo ?? 0) / 1000)}k`
        } m³/24h`
      : undefined,
  });

  // Outlet — Pak Phanang Bay / Gulf of Thailand
  const pakBasin = p.basins.find((b) => b.basinId === "pak_phanang");
  const outletStatus = basinBandToStatus(pakBasin?.horizons[0]?.band);
  nodes.push({
    id: "pak-phanang",
    col: 3,
    row: 0,
    label: "Pak Phanang Bay",
    labelTh: "อ่าวปากพนัง",
    sub: "Outlet · tidal",
    status: outletStatus,
  });

  // Edges (the cascade + the outflow)
  // Headwater → Khiri Wong → Lan Saka → City → Pak Phanang
  const kwStatus = zoneStatusToNodeStatus(kw?.status);
  const lsStatus = zoneStatusToNodeStatus(ls?.status);
  edges.push({ from: "khao-luang", to: "khiri-wong", status: runoffStatus === "overbank" ? "high" : "normal" });
  edges.push({ from: "khiri-wong", to: "lan-saka", status: kwStatus === "overbank" ? "overbank" : kwStatus === "high" ? "high" : "normal" });
  edges.push({ from: "lan-saka", to: "city", status: lsStatus === "overbank" ? "overbank" : lsStatus === "high" ? "high" : "normal" });
  edges.push({ from: "city", to: "pak-phanang", status: cityStatus === "overbank" ? "overbank" : cityStatus });

  return { nodes, edges };
}

// Reservoir row (separate column below the main flow) — built separately so
// the SVG can render the reservoir strip as a distinct visual region.
interface ReservoirNode {
  id: string;
  label: string;
  pct: number | null;
  volume: number | null;
  capacity: number | null;
  status: NodeLayout["status"];
}

function buildReservoirRow(reservoirs: RidReservoir[]): ReservoirNode[] {
  return reservoirs.slice(0, 6).map((r) => ({
    id: r.id,
    label: r.name,
    pct: r.storagePct,
    volume: r.volumeMcm,
    capacity: r.storageMcm,
    status: reservoirStatus(r.storagePct),
  }));
}

// ── SVG geometry ──────────────────────────────────────────────────────────

const NODE_W = 132;
const NODE_H = 56;
const COL_GAP = 86;
const ROW_GAP = 14;
const PAD_X = 16;
const PAD_Y = 14;
const VIEW_W = PAD_X * 2 + NODE_W * 4 + COL_GAP * 3;
const RESERVOIR_BAND_Y = 168;
const RESERVOIR_H = 64;

function nodePos(n: NodeLayout, totalRowsInCol: number): { x: number; y: number } {
  const colX = PAD_X + n.col * (NODE_W + COL_GAP);
  const rowsCount = totalRowsInCol;
  const colHeight = rowsCount * NODE_H + (rowsCount - 1) * ROW_GAP;
  const colTopY = PAD_Y;
  const rowY = colTopY + n.row * (NODE_H + ROW_GAP);
  // Center the column vertically
  const offset = ((168 - colHeight) / 2) - colTopY;
  return { x: colX, y: rowY + Math.max(0, offset) };
}

function totalRowsInColumn(nodes: NodeLayout[], col: 0 | 1 | 2 | 3): number {
  return Math.max(1, ...nodes.filter((n) => n.col === col).map((n) => n.row + 1));
}

// Cubic-bezier path between two nodes' right-edge → left-edge midpoints.
function edgePath(fromX: number, fromY: number, toX: number, toY: number): string {
  const sx = fromX + NODE_W;
  const sy = fromY + NODE_H / 2;
  const tx = toX;
  const ty = toY + NODE_H / 2;
  const dx = Math.max(20, (tx - sx) * 0.45);
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

// ── Status colour map (token names only — never hardcode RGB) ─────────────

const STATUS_COLOR_VAR: Record<NodeLayout["status"], string> = {
  normal: "var(--good)",
  watch: "var(--warn)",
  high: "var(--alert)",
  overbank: "var(--bad)",
  unknown: "var(--ink-3)",
};

const STATUS_LABEL: Record<NodeLayout["status"], string> = {
  normal: "NORMAL",
  watch: "WATCH",
  high: "HIGH",
  overbank: "OVERBANK",
  unknown: "—",
};

// ── Component ─────────────────────────────────────────────────────────────

export function WaterNetwork({
  watershedSummaries,
  reservoirs,
  runoffProxy,
  basins,
  fallbackTier,
  forceReducedMotion,
}: Props) {
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

  const { nodes, edges } = buildLayout({ watershedSummaries, reservoirs, runoffProxy, basins });
  const reservoirRow = buildReservoirRow(reservoirs);

  // Layout map for edge lookup
  const byCol: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const col of [0, 1, 2, 3] as const) byCol[col] = totalRowsInColumn(nodes, col);
  const posOf = (id: string): { x: number; y: number } | null => {
    const n = nodes.find((nn) => nn.id === id);
    if (!n) return null;
    return nodePos(n, byCol[n.col]);
  };

  const edgeTotal = edges.length;
  const width = VIEW_W;
  const height = RESERVOIR_BAND_Y + RESERVOIR_H + 32;

  return (
    <div className="water-network" role="img" aria-label="NST water network — headwaters through city to outlet">
      <header className="water-network__head">
        <span className="water-network__title">Water Network</span>
        <span className={`water-network__tier water-network__tier--${fallbackTier ?? "unknown"}`}>
          {fallbackTier === "live"
            ? "LIVE"
            : fallbackTier === "scenario"
            ? "SCENARIO"
            : fallbackTier === "unavailable"
            ? "OFFLINE"
            : fallbackTier === "cache" || fallbackTier === "database"
            ? "CACHED"
            : "—"}
        </span>
      </header>

      <svg
        className="water-network__svg"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* reservoir band background */}
        <rect
          x={PAD_X - 4}
          y={RESERVOIR_BAND_Y - 8}
          width={width - PAD_X * 2 + 8}
          height={RESERVOIR_H + 16}
          fill="var(--ground)"
          fillOpacity={0.45}
          stroke="var(--line)"
        />
        <text
          x={PAD_X}
          y={RESERVOIR_BAND_Y - 12}
          fontSize="9"
          letterSpacing="0.12em"
          fill="var(--ink-3)"
          fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
          fontWeight="600"
        >
          RID RESERVOIRS · SOUTH
        </text>

        {/* edges (drawn under nodes) */}
        {edges.map((e) => {
          const a = posOf(e.from);
          const b = posOf(e.to);
          if (!a || !b) return null;
          const d = edgePath(a.x, a.y, b.x, b.y);
          const stroke = STATUS_COLOR_VAR[e.status];
          return (
            <g key={`${e.from}-${e.to}`}>
              <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeOpacity={0.35}
                strokeWidth={6}
              />
              <path
                className={motionOff ? undefined : "water-network__flow"}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={2}
                strokeDasharray="5 7"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* main flow nodes */}
        {nodes.map((n) => {
          const p = posOf(n.id)!;
          const stroke = STATUS_COLOR_VAR[n.status];
          return (
            <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={0}
                fill="var(--panel)"
                stroke={stroke}
                strokeWidth={2}
              />
              <rect
                x={0}
                y={0}
                width={3}
                height={NODE_H}
                fill={stroke}
              />
              <text
                x={10}
                y={16}
                fontSize="11"
                fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
                fontWeight="700"
                fill="var(--ink)"
              >
                {n.label}
              </text>
              <text
                x={10}
                y={30}
                fontSize="9.5"
                fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
                fill="var(--ink-3)"
                lang="th"
              >
                {n.labelTh}
              </text>
              {n.sub && (
                <text
                  x={10}
                  y={42}
                  fontSize="8.5"
                  fontFamily="'Inter', monospace"
                  letterSpacing="0.06em"
                  fill="var(--ink-low)"
                >
                  {n.sub}
                </text>
              )}
              {n.reading && (
                <text
                  x={NODE_W - 8}
                  y={NODE_H - 8}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="'Inter', monospace"
                  fontWeight="600"
                  fill={stroke}
                >
                  {n.reading}
                </text>
              )}
            </g>
          );
        })}

        {/* reservoir row */}
        {reservoirRow.map((r, i) => {
          const slotW = (width - PAD_X * 2) / Math.max(1, reservoirRow.length);
          const x = PAD_X + i * slotW + 4;
          const y = RESERVOIR_BAND_Y;
          const w = slotW - 8;
          const stroke = STATUS_COLOR_VAR[r.status];
          return (
            <g key={r.id} transform={`translate(${x} ${y})`}>
              <rect
                width={w}
                height={RESERVOIR_H}
                fill="var(--panel)"
                stroke={stroke}
                strokeWidth={1.5}
              />
              <rect x={0} y={0} width={w} height={3} fill={stroke} />
              <text
                x={6}
                y={14}
                fontSize="9.5"
                fontFamily="'Inter', 'IBM Plex Sans Thai', sans-serif"
                fontWeight="700"
                fill="var(--ink)"
              >
                {r.label.length > w / 6 ? r.label.slice(0, Math.floor(w / 6) - 1) + "…" : r.label}
              </text>
              <text
                x={6}
                y={28}
                fontSize="9"
                fontFamily="'Inter', monospace"
                letterSpacing="0.06em"
                fill="var(--ink-3)"
              >
                {r.pct != null ? `${r.pct.toFixed(0)}%` : "—"}
              </text>
              {/* storage bar */}
              <rect x={6} y={40} width={w - 12} height={6} fill="var(--ground)" />
              <rect
                x={6}
                y={40}
                width={Math.max(0, Math.min(1, (r.pct ?? 0) / 100)) * (w - 12)}
                height={6}
                fill={stroke}
              />
              <text
                x={w - 6}
                y={58}
                textAnchor="end"
                fontSize="9"
                fontFamily="'Inter', monospace"
                fill="var(--ink-2)"
              >
                {r.volume != null ? `${r.volume.toFixed(1)} MCM` : "—"}
              </text>
            </g>
          );
        })}
      </svg>

      <footer className="water-network__legend" aria-hidden="true">
        {(["normal", "watch", "high", "overbank"] as const).map((s) => (
          <span key={s} className="water-network__legend-item">
            <span
              className="water-network__legend-dot"
              style={{ background: STATUS_COLOR_VAR[s] }}
            />
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="water-network__legend-meta num">
          {edgeTotal} flows · {reservoirRow.length} reservoirs
        </span>
      </footer>
    </div>
  );
}
