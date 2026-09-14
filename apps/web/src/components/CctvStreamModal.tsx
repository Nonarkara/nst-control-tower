/**
 * CCTV live view — opens from a camera dot on the map or a row in the CCTV
 * directory.
 *
 * Stream strategy, by what the camera actually publishes:
 *   embedUrl  → <iframe> of the upstream player page (NST municipal MediaMTX
 *               WebRTC reader; SD by default, HD on request)
 *   hlsUrl    → native <video> (Longdo)
 *   imageUrl  → JPEG snapshot refreshed every 5 s
 *   none      → a plain "no stream" message
 *
 * Accessible dialog: labelled by the camera name, focus trapped while open and
 * returned to the trigger on close, Escape closes, every control is a real
 * button with a visible text label.
 */

import { useEffect, useId, useState } from "react";
import type { CvDetectionEvent } from "@nst/shared";
import type { CctvCamera } from "../map/layers";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { CCTV_CATEGORY_LABEL, statusLabel } from "../lib/cctv";

interface Props {
  camera: CctvCamera | null;
  onClose: () => void;
  /** Base URL for the API — defaults to empty string (same origin). */
  apiBase?: string;
}

const CV_POLL_MS = 10_000;
const IMG_REFRESH_MS = 5_000;

export function CctvStreamModal({ camera, onClose, apiBase = "" }: Props) {
  const [cvEvent, setCvEvent] = useState<CvDetectionEvent | null>(null);
  const [imgTs, setImgTs] = useState(Date.now());
  const [videoError, setVideoError] = useState(false);
  const [hd, setHd] = useState(false);
  const trapRef = useFocusTrap(!!camera);
  const titleId = useId();

  useEffect(() => {
    if (!camera) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [camera, onClose]);

  useEffect(() => {
    setVideoError(false);
    setCvEvent(null);
    setHd(false);
  }, [camera?.id]);

  // CV detections (our own pipeline keyed by camera id) — silent when absent.
  useEffect(() => {
    if (!camera) return;
    let active = true;
    const fetchCv = async () => {
      try {
        const res = await fetch(`${apiBase}/api/cctv/cv-events?cameraId=${encodeURIComponent(camera.id)}&limit=1`);
        if (!res.ok) return;
        const data = (await res.json()) as { events?: CvDetectionEvent[] };
        if (active && data.events?.length) setCvEvent(data.events[0]);
      } catch {
        // CV pipeline not running — nothing to show.
      }
    };
    fetchCv();
    const timer = setInterval(fetchCv, CV_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [camera, apiBase]);

  const snapshotOnly = !!camera?.imageUrl && !camera.embedUrl && !camera.hlsUrl;
  useEffect(() => {
    if (!snapshotOnly) return;
    const timer = setInterval(() => setImgTs(Date.now()), IMG_REFRESH_MS);
    return () => clearInterval(timer);
  }, [snapshotOnly]);

  if (!camera) return null;

  const category = CCTV_CATEGORY_LABEL[camera.category ?? "other"];
  const embedSrc = hd && camera.embedHdUrl ? camera.embedHdUrl : camera.embedUrl;
  const canHls = !camera.embedUrl && !!camera.hlsUrl && !videoError;

  return (
    <div className="cctv-modal-overlay" onClick={onClose}>
      <div
        ref={trapRef}
        className="cctv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cctv-modal-head">
          <div className="cctv-modal-heading">
            <p className="cctv-modal-eyebrow">
              CCTV · {category.en} · <span lang="th">{category.th}</span>
            </p>
            <h2 id={titleId} className="cctv-modal-title" lang="th">{camera.name}</h2>
            <p className="cctv-modal-sub">
              <span className="num">{camera.sourceId ?? camera.id}</span>
              {" · "}
              <span className={`cctv-status cctv-status--${camera.status ?? "unknown"}`}>{statusLabel(camera)}</span>
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </header>

        {camera.status === "offline" && (
          <p className="cctv-modal-notice" role="status">
            This camera reports offline — the stream may not load.
          </p>
        )}

        <div className="cctv-modal-stream">
          {camera.embedUrl ? (
            <iframe
              key={embedSrc}
              src={embedSrc}
              title={`Live view: ${camera.name}`}
              className="cctv-video"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : canHls ? (
            <video
              src={camera.hlsUrl}
              autoPlay
              muted
              playsInline
              controls
              className="cctv-video"
              aria-label={`Live view: ${camera.name}`}
              onError={() => setVideoError(true)}
            />
          ) : camera.imageUrl ? (
            <img
              src={`${camera.imageUrl}?_ts=${imgTs}`}
              alt={`Latest snapshot: ${camera.name}`}
              className="cctv-video"
            />
          ) : (
            <p className="cctv-no-stream">No stream available for this camera.</p>
          )}
        </div>

        <div className="cctv-modal-controls">
          {camera.embedHdUrl && (
            <div className="segmented" role="group" aria-label="Stream quality">
              <button type="button" className="segmented__btn" aria-pressed={!hd} onClick={() => setHd(false)}>
                SD
              </button>
              <button type="button" className="segmented__btn" aria-pressed={hd} onClick={() => setHd(true)}>
                HD
              </button>
            </div>
          )}
          {embedSrc && (
            <a className="link" href={embedSrc} target="_blank" rel="noreferrer">
              Open player in new tab ↗
            </a>
          )}
          <span className="cctv-modal-coords num">
            {camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}
          </span>
        </div>

        {cvEvent && Object.keys(cvEvent.counts).length > 0 && (
          <section className="cctv-modal-cv" aria-label="Latest computer-vision detection">
            <p className="cctv-modal-eyebrow">
              Last detection · <span className="num">{new Date(cvEvent.timestamp).toLocaleTimeString()}</span>
            </p>
            <ul className="cctv-det-list">
              {Object.entries(cvEvent.counts).map(([cls, count]) => (
                <li key={cls}>
                  {cls} <span className="num">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
