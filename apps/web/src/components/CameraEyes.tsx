/**
 * CameraEyes — "what the cameras see", in plain words, for the brief.
 *
 * Flood (water line on the canal cameras) and haze (picture clarity on road
 * cameras), each with how many cameras actually looked. Logic lives in
 * lib/gaugeWatch.ts, lib/hazeReader.ts and lib/cameraEyes.ts (all tested);
 * this only renders. It says what it could NOT do just as plainly.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { getSweepStats, subscribeSweepStats } from "../lib/gaugeWatch";
import { getEyes, subscribeEyes, isDaylightICT } from "../lib/cameraEyes";
import { HAZE_BAND_LABEL, crossCheckHaze, type HazeBand } from "../lib/hazeReader";
import { STATUS, type StatusLevel } from "../lib/status";

const HAZE_LEVEL: Record<HazeBand, StatusLevel> = { clear: "normal", light: "watch", hazy: "warning", thick: "critical" };

interface Props {
  /** Latest PM2.5 from the air sensors, to tell smoke from mist. */
  pm25: number | null;
}

function Row({ label, level, children }: { label: string; level: StatusLevel; children: React.ReactNode }) {
  const st = STATUS[level];
  return (
    <div className="eyes__row">
      <dt>{label}</dt>
      <dd>
        <span className="eyes__glyph" style={{ color: st.color }} aria-hidden="true">{st.glyph}</span>
        {children}
      </dd>
    </div>
  );
}

export function CameraEyes({ pm25 }: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(id); }, []);
  const flood = useSyncExternalStore(subscribeSweepStats, getSweepStats, getSweepStats);
  const eyes = useSyncExternalStore(subscribeEyes, getEyes, getEyes);
  const daylight = isDaylightICT();
  const waiting = daylight ? "Checking the cameras…" : "Automatic reading runs in daylight only (07:00–18:00).";

  // Flood: canal-camera water line.
  let floodLevel: StatusLevel = "unknown";
  let floodText = waiting;
  const freshFlood = daylight && flood.at > 0 && now - flood.at >= -5000 && now - flood.at <= 15 * 60_000;
  if (flood.at > 0 && !freshFlood) floodText = "Previous image checks are stale or paused; no current water assessment. Open a water camera to verify.";
  if (freshFlood) {
    if (flood.confident === 0) {
      floodText = `Looked at ${flood.analysed} canal camera${flood.analysed === 1 ? "" : "s"}; none gave a clear water line.`;
    } else if (flood.previewed > 0) {
      floodLevel = "watch";
      floodText = `${flood.previewed} historical local image-change flag${flood.previewed === 1 ? "" : "s"} recorded — open the cameras and verify; these are not confirmed water rises.`;
    } else {
      floodLevel = "unknown";
      floodText = `${flood.confident} of ${flood.analysed} camera images have readable contrast. No confirmed water trend; no flags does not mean safe.`;
    }
  }

  // Haze: picture clarity.
  const band = eyes.city.band;
  const verdict = crossCheckHaze(band, pm25);
  let hazeLevel: StatusLevel = "unknown";
  let hazeText = eyes.at > 0
    ? `Only ${eyes.city.cameras} road camera${eyes.city.cameras === 1 ? "" : "s"} gave a usable picture — need at least 2.`
    : waiting;
  const freshHaze = Boolean(band) && daylight && eyes.at > 0 && now - eyes.at >= -5000 && now - eyes.at <= 15 * 60_000;
  if (band && freshHaze) {
    hazeLevel = HAZE_LEVEL[band];
    hazeText = `${HAZE_BAND_LABEL[band].en} · ${HAZE_BAND_LABEL[band].th} — ${eyes.city.agreeing} of ${eyes.city.cameras} cameras agree.`;
  }

  // Night, nothing read yet: one sentence, not two identical rows.
  if (!daylight && flood.at === 0 && eyes.at === 0) {
    return (
      <section className="eyes" aria-label="What the cameras see">
        <h3 className="eyes__title">What the cameras see</h3>
        <p className="eyes__note">Automatic camera reading runs in daylight only (07:00–18:00); next check 07:00. Live camera views are still available.</p>
      </section>
    );
  }

  return (
    <section className="eyes" aria-label="What the cameras see">
      <h3 className="eyes__title">What the cameras see</h3>
      <dl className="eyes__rows">
        <Row label="Flood" level={floodLevel}>{floodText}</Row>
        <Row label="Haze" level={hazeLevel}>{hazeText}</Row>
      </dl>
      {freshHaze && verdict.kind !== "clear" && verdict.kind !== "unknown" && <p className="eyes__note">{verdict.text}</p>}
      <p className="eyes__note">
        Estimated from camera pictures, in daylight — not an official reading.
        {eyes.calibrating > 0 ? " Still learning each camera's normal view; ratings sharpen over a few days." : ""}
      </p>
    </section>
  );
}
