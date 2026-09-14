import { useRef, type KeyboardEvent } from "react";

export type MobilePanel = "map" | "brief" | "layers";

interface Props {
  panel: MobilePanel;
  onChange: (p: MobilePanel) => void;
}

const TABS: { id: MobilePanel; label: string; sub: string }[] = [
  { id: "brief",  label: "BRIEF",  sub: "WEATHER · DATA" },
  { id: "map",    label: "MAP",    sub: "CITY · 3D" },
  { id: "layers", label: "LAYERS", sub: "LENS · NEWS" },
];

/**
 * MobileNav — fixed bottom tab bar on phones (ARIA tabs pattern: one tab
 * stop, Left/Right/Home/End move and activate).
 *  BRIEF opens the left rail as a full-height sheet.
 *  MAP   collapses both panels so the map is full-bleed.
 *  LAYERS opens the right rail (news + layer palette).
 */
export function MobileNav({ panel, onChange }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next == null) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="mobile-nav" role="tablist" aria-label="Dashboard panels">
        {TABS.map((t, i) => {
          const selected = panel === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={`mobile-nav-btn ${selected ? "active" : ""}`}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="mobile-nav-label">{t.label}</span>
              <span className="mobile-nav-sub">{t.sub}</span>
            </button>
          );
        })}
    </div>
  );
}
