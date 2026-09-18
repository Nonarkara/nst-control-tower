/**
 * SituationHeadline — the first thing in the left rail, on every lens.
 *
 * Three things above the fold: the headline (worst gauge + time to
 * overtop), the suggested action, and how old the numbers are. Logic lives
 * in lib/situationHeadline.ts (tested); this only renders.
 */

import type { BasinWaterBalance, FallbackTier, WaterGauge } from "@nst/shared";
import type { CctvCamera } from "../map/layers";
import { buildSituationHeadline } from "../lib/situationHeadline";
import type { EvacSummary } from "../lib/evacPriority";
import { STATUS } from "../lib/status";
import { statusStyle } from "../lib/cityStatus";

interface Props {
  gauges: WaterGauge[];
  basins: BasinWaterBalance[];
  cameras: CctvCamera[];
  ageMinutes: number | null;
  tier?: FallbackTier | "loading";
  onFocus: (lng: number, lat: number) => void;
  onOpenCamera: (camera: CctvCamera) => void;
  /** Who-to-move-first totals; null while the village register loads. */
  evac?: EvacSummary | null;
}

export function SituationHeadline({ gauges, basins, cameras, ageMinutes, tier, onFocus, onOpenCamera, evac }: Props) {
  const h = buildSituationHeadline({ gauges, basins, cameras, ageMinutes, tier });
  const st = STATUS[h.level];

  return (
    <section className="situation-headline" aria-label="Right now" aria-live="polite" style={statusStyle(h.level)}>
      <p className="situation-headline__level">
        <span className="pc-glyph" aria-hidden="true">{st.glyph}</span> {st.en} · Water right now
      </p>
      <p className="situation-headline__title">{h.headline}</p>
      <p className="situation-headline__detail num">{h.detail}</p>
      <p className="situation-headline__action">
        <span className="situation-headline__label">Suggested action</span> {h.action}
      </p>
      {evac && (evac.moveNow > 0 || evac.getReady > 0) && (
        <p className="situation-headline__evac">
          <span className="situation-headline__label">People first</span>
          {evac.moveNow > 0
            ? `${evac.moveNow} village${evac.moveNow === 1 ? "" : "s"} to move now — about ${evac.needHelpMoveNow.toLocaleString()} bedridden or homebound residents need help to leave. `
            : ""}
          {evac.getReady > 0 ? `${evac.getReady} village${evac.getReady === 1 ? "" : "s"} to get ready. ` : ""}
          See "People First" below.
        </p>
      )}
      {(h.gauge || h.camera) && (
        <div className="situation-headline__buttons">
          {h.gauge && (
            <button type="button" className="btn" onClick={() => onFocus(h.gauge!.lng, h.gauge!.lat)}>
              Show on map
            </button>
          )}
          {h.camera && (
            <button type="button" className="btn" onClick={() => onOpenCamera(h.camera!)}>
              Open nearest camera
            </button>
          )}
        </div>
      )}
      <p className="situation-headline__age">{h.freshness}</p>
    </section>
  );
}
