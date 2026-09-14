import { PEAK_HOURS } from "../sim/trafficSim";

interface Props {
  hour: number;
  isWeekend: boolean;
  onHourChange: (h: number) => void;
  onWeekendToggle: (w: boolean) => void;
}

const fmt = (h: number) => `${h.toString().padStart(2, "0")}:00`;

export function HourRail({ hour, isWeekend, onHourChange, onWeekendToggle }: Props) {
  return (
    <div className="hrail">
      <div className="hrail__top">
        <div>
          <div className="hrail__title">
            <span className="pc-label">Traffic — hour of day</span>
            {/* Honest labelling: the heatmap is a sinusoidal model (peaks 8:00 / 17:30)
                weighted by road class + weekday/weekend, not live sensor data. */}
            <span
              className="mono caption data-age--warn"
              title="Modelled from road class + hour + weekday/weekend. Not live sensor data."
              aria-label="Modelled — not live sensor data"
            >
              MODELLED
            </span>
          </div>
          <p className="hrail__time num" aria-live="polite">
            {fmt(hour)} <span className="pc-meta">local</span>
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Day type">
          <button
            type="button"
            onClick={() => onWeekendToggle(false)}
            aria-pressed={!isWeekend}
            aria-label="Show weekday traffic pattern"
            className="segmented__btn"
          >
            Weekday
          </button>
          <button
            type="button"
            onClick={() => onWeekendToggle(true)}
            aria-pressed={isWeekend}
            aria-label="Show weekend traffic pattern"
            className="segmented__btn"
          >
            Weekend
          </button>
        </div>
      </div>
      <input
        className="hrail__range"
        type="range"
        min={0}
        max={23}
        step={1}
        value={hour}
        onChange={(e) => onHourChange(Number(e.target.value))}
        aria-label="Hour of day"
        aria-valuetext={`${fmt(hour)}${PEAK_HOURS.has(hour) ? ", peak hour" : ""}`}
      />
      <div className="hrail__ticks" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} className={`hrail__tick${PEAK_HOURS.has(i) ? " hrail__tick--peak" : ""}`} />
        ))}
      </div>
    </div>
  );
}
