import { useEffect } from "react";
import { useLocale } from "../hooks/useLocale";

/**
 * Keyboard shortcuts help dialog.
 *
 * Press `?` (or Shift+/) anywhere in the app to open. ESC closes.
 *
 * Listed in two columns: lens-switching (most-used) and global app controls.
 * Each row uses a `<kbd>` chip so the keys read as physical keys, not
 * characters — matches what the user actually presses.
 *
 * Lazy-loaded from App.tsx so the bundle is only paid for the first time the
 * user opens the dialog.
 */

interface LensMeta {
  id: string;
  label: string;
  describe?: string;
}

interface Props {
  lenses: LensMeta[];
  onClose: () => void;
}

const SHORTCUTS_GLOBAL: Array<[string, string]> = [
  ["1-9",     "Switch to lens N (matches top-bar order)"],
  ["?",       "Show this help dialog"],
  ["Esc",     "Close the topmost overlay"],
  ["D",       "Toggle 2D / 3D map view"],
  ["T",       "Toggle dark / light theme"],
];

export function ShortcutsDialog({ lenses, onClose }: Props) {
  const { locale } = useLocale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="shortcuts-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <header className="shortcuts-head">
          <div>
            <div className="eyebrow">KEYBOARD SHORTCUTS</div>
            <h2 className="shortcuts-title">
              {locale === "th" ? "แป้นพิมพ์ลัด" : "Shortcuts"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shortcuts-close"
            aria-label="Close shortcuts dialog"
          >
            [ESC] CLOSE
          </button>
        </header>

        <div className="shortcuts-grid">
          <section>
            <h3 className="eyebrow shortcuts-section-title">Lenses</h3>
            <ul className="shortcuts-list">
              {lenses.slice(0, 9).map((l, i) => (
                <li key={l.id}>
                  <kbd className="shortcuts-kbd">{i + 1}</kbd>
                  <span className="shortcuts-lens-label">
                    {l.label}
                    <span className="shortcuts-lens-id">{l.id}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="eyebrow shortcuts-section-title">App</h3>
            <ul className="shortcuts-list">
              {SHORTCUTS_GLOBAL.map(([key, desc]) => (
                <li key={key}>
                  <kbd className="shortcuts-kbd">{key}</kbd>
                  <span className="shortcuts-lens-label">{desc}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="shortcuts-foot mono">
          Press <kbd className="shortcuts-kbd">?</kbd> anytime to open this dialog.
        </footer>
      </div>
    </div>
  );
}
