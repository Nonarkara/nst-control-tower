/**
 * CameraEyes — "what the cameras see", in plain words, for the brief.
 *
 * Flood (water line on the canal cameras) and haze (picture clarity on road
 * cameras), each with how many cameras actually looked. Logic lives in
 * lib/gaugeWatch.ts, lib/hazeReader.ts and lib/cameraEyes.ts (all tested);
 * this only renders. It says what it could NOT do just as plainly.
 */
import { useSyncExternalStore } from "react";
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
  const flood = useSyncExternalStore(subscribeSweepStats, getSweepStats, getSweepStats);
  const eyes = useSyncExternalStore(subscribeEyes, getEyes, getEyes);
  const daylight = isDaylightICT();
  const waiting = daylight ? "Checking the cameras…" : "Cameras are read in daylight only (07:00–18:00).";

  // Flood: canal-camera water line.
  let floodLevel: StatusLevel = "unknown";
  let floodText = waiting;
  if (flood.at > 0) {
    if (flood.confident === 0) {
      floodText = `Looked at ${flood.analysed} canal camera${flood.analysed === 1 ? "" : "s"}; none gave a clear water line.`;
    } else if (flood.previewed > 0) {
      floodLevel = "warning";
      floodText = `${flood.previewed} canal camera${flood.previewed === 1 ? "" : "s"} show water rising — check them on the map.`;
    } else {
      floodLevel = "normal";
      floodText = `${flood.confident} of ${flood.analysed} canal cameras read — water not rising.`;
    }
  }

  // Haze: picture clarity.
  const band = eyes.city.band;
  const verdict = crossCheckHaze(band, pm25);
  let hazeLevel: StatusLevel = "unknown";
  let hazeText = eyes.at > 0
    ? `Only ${eyes.city.cameras} road camera${eyes.city.cameras === 1 ? "" : "s"} gave a usable picture — need at least 2.`
    : waiting;
  if (band) {
    hazeLevel = HAZE_LEVEL[band];
    hazeText = `${HAZE_BAND_LABEL[band].en} · ${HAZE_BAND_LABEL[band].th} — ${eyes.city.agreeing} of ${eyes.city.cameras} cameras agree.`;
  }

  // Night, nothing read yet: one sentence, not two identical rows.
  if (!daylight && flood.at === 0 && eyes.at === 0) {
    return (
      <section className="eyes" aria-label="What the cameras see">
        <h3 className="eyes__title">What the cameras see</h3>
        <p className="eyes__note">Cameras are read in daylight only (07:00–18:00). The next look is at 07:00.</p>
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
      {band && verdict.kind !== "clear" && verdict.kind !== "unknown" && <p className="eyes__note">{verdict.text}</p>}
      <p className="eyes__note">
        Estimated from camera pictures, in daylight — not an official reading.
        {eyes.calibrating > 0 ? " Still learning each camera's normal view; ratings sharpen over a few days." : ""}
      </p>
    </section>
  );
}
