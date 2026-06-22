/**
 * CCTV Stream Modal
 *
 * Opens when the operator clicks a camera dot on the map.
 * Shows:
 *   1. Live snapshot (imageUrl, auto-refreshed every 5 s)
 *   2. HLS video player (hlsUrl, via native <video> — browsers handle HLS on macOS/iOS
 *      natively; on Chrome you'd add hls.js, but that's a future enhancement)
 *   3. Latest CV detections from GET /api/cctv/cv-events?cameraId=
 *   4. Camera metadata
 *
 * HLS fallback strategy:
 *   hlsUrl present  → try <video src={hlsUrl} autoPlay muted playsInline>
 *   imageUrl only   → polling img refresh every 5 s (MJPEG-style)
 *   neither         → "No stream available" message
 *
 * The component owns its own fetch loop for CV events so it doesn't
 * pollute the global feed state.
 */

import { useState, useEffect, useRef } from "react";
import type { CvDetectionEvent } from "@nst/shared";

interface CctvCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vendor?: string;
  imageUrl?: string;
  hlsUrl?: string;
  organization?: string;
}

interface Props {
  camera: CctvCamera | null;
  onClose: () => void;
  /** Base URL for the API — defaults to empty string (same origin). */
  apiBase?: string;
}

const CV_POLL_MS = 10_000;     // refresh CV detections every 10 s
const IMG_REFRESH_MS = 5_000;  // snapshot refresh interval

function DetectionBadge({ cls, count }: { cls: string; count: number }) {
  const label = cls.charAt(0).toUpperCase() + cls.slice(1);
  return (
    <span className="cctv-det-badge mono">
      {label} {count > 1 && <strong>{count}</strong>}
    </span>
  );
}

export function CctvStreamModal({ camera, onClose, apiBase = "" }: Props) {
  const [cvEvent, setCvEvent] = useState<CvDetectionEvent | null>(null);
  const [imgTs, setImgTs] = useState(Date.now());
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // CV detection poll
  useEffect(() => {
    if (!camera) return;
    let active = true;

    async function fetchCv() {
      try {
        const res = await fetch(
          `${apiBase}/api/cctv/cv-events?cameraId=${encodeURIComponent(camera!.id)}&limit=1`,
        );
        if (!res.ok) return;
        const data = await res.json() as { events: CvDetectionEvent[] };
        if (active && data.events.length > 0) setCvEvent(data.events[0]);
      } catch {
        // silent — CV pipeline may not be running yet
      }
    }

    fetchCv();
    const timer = setInterval(fetchCv, CV_POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [camera, apiBase]);

  // Snapshot refresh (imageUrl only, no HLS)
  useEffect(() => {
    if (!camera?.imageUrl || camera.hlsUrl) return;
    const timer = setInterval(() => setImgTs(Date.now()), IMG_REFRESH_MS);
    return () => clearInterval(timer);
  }, [camera]);

  // Reset video error when camera changes
  useEffect(() => {
    setVideoError(false);
    setCvEvent(null);
  }, [camera?.id]);

  if (!camera) return null;

  const hasHls = !!camera.hlsUrl && !videoError;
  const hasImg = !!camera.imageUrl;

  return (
    <div className="cctv-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="cctv-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="cctv-modal-head">
          <div>
            <span className="eyebrow mono">CCTV · {camera.vendor ?? camera.organization ?? "CAMERA"}</span>
            <h3 className="cctv-modal-title">{camera.name}</h3>
            <div className="cctv-modal-coords mono">
              {camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="building-card-close mono">
            ESC
          </button>
        </header>

        {/* Stream / snapshot */}
        <div className="cctv-modal-stream">
          {hasHls ? (
            <video
              ref={videoRef}
              src={camera.hlsUrl}
              autoPlay
              muted
              playsInline
              controls
              className="cctv-video"
              onError={() => setVideoError(true)}
            />
          ) : hasImg ? (
            <img
              src={`${camera.imageUrl}?_ts=${imgTs}`}
              alt={`Live view — ${camera.name}`}
              className="cctv-snapshot"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="cctv-no-stream mono">NO STREAM AVAILABLE</div>
          )}

          {/* CV detection overlay */}
          {cvEvent && Object.keys(cvEvent.counts).length > 0 && (
            <div className="cctv-det-overlay">
              {Object.entries(cvEvent.counts).map(([cls, count]) => (
                <DetectionBadge key={cls} cls={cls} count={count} />
              ))}
              <span className="cctv-det-ts mono">
                {new Date(cvEvent.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* CV summary */}
        {cvEvent && (
          <section className="cctv-modal-cv">
            <span className="eyebrow mono">LAST DETECTION</span>
            <div className="cctv-cv-row">
              <span className="mono" style={{ color: "var(--ink-mid)", fontSize: "0.7rem" }}>
                {cvEvent.model && `${cvEvent.model} · `}
                {new Date(cvEvent.timestamp).toLocaleString()}
              </span>
            </div>
            {cvEvent.detections.length > 0 && (
              <ul className="cctv-det-list">
                {cvEvent.detections.slice(0, 8).map((d, i) => (
                  <li key={i} className="cctv-det-item mono">
                    <span className="cctv-det-class">{d.class}</span>
                    <span className="cctv-det-conf" style={{ color: "var(--ink-mid)" }}>
                      {Math.round(d.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {cvEvent.snapshotUrl && (
              <a href={cvEvent.snapshotUrl} target="_blank" rel="noreferrer" className="mono cctv-snap-link">
                snapshot ↗
              </a>
            )}
          </section>
        )}

        {/* Metadata */}
        <footer className="cctv-modal-meta mono">
          <span>ID: {camera.id}</span>
          {camera.vendor && <span>VENDOR: {camera.vendor}</span>}
        </footer>
      </aside>
    </div>
  );
}
