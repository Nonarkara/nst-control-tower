/**
 * MetroInfographic — watershed-as-subway standalone infographic.
 *
 * One self-contained deck.gl canvas at a tilted angle, drawing the Tha
 * Dee cascade as a metro line. The path follows real lng/lat between
 * stations (so the reader can flip to the actual map and recognise the
 * shape) but renders with subway-map styling: rounded caps, station
 * markers, status-coloured stroke, EN + TH station labels above each
 * stop. A side panel lists every station with its live reading so the
 * "which trains go where" question reads as a list, not a guess.
 *
 * Trigger button on FLOOD / ENV / INT lens header opens the modal.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { MapView } from "@deck.gl/core";
import type { MapViewState, Layer } from "@deck.gl/core";
import { metroRouteLayer } from "../map/layers";
import {
  buildCascadeLine,
  buildLineGeometry,
  METRO,
  type MetroLine,
  type MetroStation,
  type MetroStatus,
} from "../lib/metroLines";
import type { ZoneSummary } from "../lib/watershed";
import { Dialog } from "./Dialog";

interface Props {
  summaries: ZoneSummary[];
}

const INFOGRAPHIC_W = 1280;
const INFOGRAPHIC_H = 800;

const STATUS_LABEL_EN: Record<MetroStatus, string> = {
  normal: "Normal · running on time",
  watch: "Watch · slowing down",
  prepare: "Prepare · over-capacity imminent",
  critical: "Critical · service suspended",
  unknown: "Status unknown",
};

const STATUS_LABEL_TH: Record<MetroStatus, string> = {
  normal: "ปกติ",
  watch: "เฝ้าระวัง",
  prepare: "เตรียมพร้อม",
  critical: "วิกฤติ",
  unknown: "—",
};

// Camera centred on the cascade — fit so the whole line is visible at
// a tilted angle (subway-map oblique). `fitBounds` would be tighter, but
// a fixed state is reproducible and avoids first-frame jank.
const INFOGRAPHIC_VIEW: MapViewState = {
  longitude: 100.0,
  latitude: 8.4,
  zoom: 9.4,
  pitch: 30,
  bearing: -10,
  minZoom: 7,
  maxZoom: 14,
};

function fmtLevel(level: number | null | undefined): string {
  if (level == null || !Number.isFinite(level)) return "—";
  return `${level.toFixed(2)} m`;
}

function fmtKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return "—";
  return `${km.toFixed(1)} km`;
}

export function MetroInfographic({ summaries }: Props) {
  const [open, setOpen] = useState(false);

  // The line + path are computed once; React.memo equivalent (useMemo)
  // means we don't re-sample the Bezier on every render.
  const line = useMemo<MetroLine>(() => buildCascadeLine(summaries), [summaries]);
  const path = useMemo(() => buildLineGeometry(line, 64), [line]);

  const layers = useMemo<Layer[]>(
    () => [
      ...metroRouteLayer(summaries, { translucent: true }),
    ],
    [summaries],
  );

  return (
    <>
      <button
        type="button"
        className="mtr__trigger"
        onClick={() => setOpen(true)}
        aria-label={`Open watershed metro infographic (${line.stations.length} stops)`}
      >
        <span aria-hidden="true">Ⓜ</span>
        Metro
        <span className="mtr__trigger-count">{line.stations.length}</span>
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="WATERSHED METRO · รถไฟลุ่มน้ำท่าดี"
        size="full"
        className="mtr__dlg"
      >
        <div className="mtr" data-testid="metro-infographic">
          <Header line={line} />

          <div className="mtr__stage" role="img" aria-label="Tha Dee cascade as a metro line">
            <DeckGL
              views={new MapView({ repeat: true, controller: false })}
              initialViewState={INFOGRAPHIC_VIEW}
              viewState={INFOGRAPHIC_VIEW}
              layers={layers}
              useDevicePixels
              style={{ width: "100%", height: `${INFOGRAPHIC_H}px`, position: "relative", background: "#0e0e0e" }}
            />
          </div>

          <div className="mtr__stations">
            <ol className="mtr__list">
              {line.stations.map((s, i) => (
                <StationRow key={s.id} station={s} index={i} total={line.stations.length} />
              ))}
            </ol>
          </div>

          <Legend line={line} path={path} />
        </div>
      </Dialog>
    </>
  );
}

function Header({ line }: { line: MetroLine }) {
  const headerColour = METRO.STATUS_COLOR[line.overallStatus];
  return (
    <header className="mtr__hdr" style={{ borderBottom: `4px solid ${headerColour}` }}>
      <div>
        <p className="mtr__eyebrow">WATERSHED METRO · NST LIVE</p>
        <h2 className="mtr__title">
          <span lang="th">{line.nameTh}</span>
          <span aria-hidden="true"> · </span>
          <span>{line.nameEn}</span>
        </h2>
        <p className="mtr__sub">
          {line.stations.length} stops · upstream → downstream · นครศรีธรรมราช
        </p>
      </div>
      <span
        className="mtr__chip"
        style={{ color: headerColour, borderColor: headerColour }}
      >
        {STATUS_LABEL_EN[line.overallStatus]}
      </span>
    </header>
  );
}

function StationRow({
  station, index, total,
}: { station: MetroStation; index: number; total: number }) {
  const colour = METRO.STATUS_COLOR[station.status];
  return (
    <li className="mtr__row" data-kind={station.kind}>
      <span className="mtr__num" aria-hidden="true">{index + 1}</span>
      {/* Connector line — drawn between rows so the list itself echoes
          the metro-line continuity. */}
      {index < total - 1 && <span className="mtr__thread" aria-hidden="true" />}
      <div className="mtr__dot" style={{ background: colour, borderColor: colour }} aria-hidden="true" />
      <div className="mtr__main">
        <h3 className="mtr__en">{station.labelEn}</h3>
        <p className="mtr__th" lang="th">{station.labelTh}</p>
        <p className="mtr__role">{station.role}</p>
      </div>
      <dl className="mtr__readings">
        <div>
          <dt>Level</dt>
          <dd className="num">{fmtLevel(station.levelM)}</dd>
        </div>
        <div>
          <dt>Trend</dt>
          <dd className="num">{station.trend}</dd>
        </div>
        <div>
          <dt>From source</dt>
          <dd className="num">{fmtKm(station.kmFromSource)}</dd>
        </div>
        <div>
          <dt>ETA → city</dt>
          <dd className="num">{station.etaH != null ? `${station.etaH.toFixed(1)} h` : "—"}</dd>
        </div>
      </dl>
    </li>
  );
}

function Legend({ line, path }: { line: MetroLine; path: [number, number][] }) {
  const totalKm = line.stations.at(-1)?.kmFromSource ?? 0;
  // Pre-compute the bounding box for the camera + the path so the
  // footnote can show the right altitude band.
  const bbox = useMemo(() => computeBbox(path), [path]);
  void bbox;
  return (
    <footer className="mtr__foot">
      <div className="mtr__status-legend">
        <span className="mtr__legend-title">Service status</span>
        <ol className="mtr__legend-list">
          {(Object.entries(STATUS_LABEL_TH) as [MetroStatus, string][])
            .filter(([s]) => s !== "unknown")
            .map(([s, th]) => (
              <li key={s}>
                <span className="mtr__legend-dot" style={{ background: METRO.STATUS_COLOR[s] }} aria-hidden="true" />
                <span className="mtr__legend-en">{STATUS_LABEL_EN[s]}</span>
                <span className="mtr__legend-th" lang="th">· {th}</span>
              </li>
            ))}
        </ol>
      </div>
      <p className="mtr__meta num">
        Total channel length · {fmtKm(totalKm)} downstream ·
        Source anchor Khao Luang · Destination Pak Phanang Bay
      </p>
    </footer>
  );
}

function computeBbox(path: [number, number][]): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of path) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, maxLng, minLat, maxLat };
}
