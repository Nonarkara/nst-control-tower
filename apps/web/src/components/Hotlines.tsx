import { HOTLINES, PRIMARY_HOTLINES } from "../lib/hotlines";

interface Props {
  /** "primary" = the two numbers that matter in a flood; "all" adds the rest. */
  scope?: "primary" | "all";
}

/** Tap-to-call emergency numbers. This dashboard is not an emergency channel —
 *  it says so, and hands over the agencies' numbers instead. */
export function Hotlines({ scope = "primary" }: Props) {
  const list = scope === "all" ? HOTLINES : PRIMARY_HOTLINES;
  return (
    <div className="hotlines" role="group" aria-label="Emergency numbers">
      <ul className="row-list">
        {list.map((h) => (
          <li key={h.number}>
            <a className="btn hotlines__call" href={`tel:${h.number}`}>
              <strong className="num">{h.number}</strong>{" "}
              <span lang="th">{h.agencyTh}</span> · {h.forEn}
            </a>
          </li>
        ))}
      </ul>
      <p className="note">
        This dashboard is not an emergency channel. <span lang="th">โทรหาหน่วยงานโดยตรง</span>.
      </p>
    </div>
  );
}
