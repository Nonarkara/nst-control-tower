import { useLocale } from "../hooks/useLocale";
import { Dialog } from "./Dialog";

/**
 * Keyboard shortcuts help dialog.
 *
 * Press `?` (or Shift+/) anywhere in the app to open. ESC closes.
 *
 * Listed in two columns: lens-switching (most-used) and global app controls.
 * Each row uses a `<kbd>` chip so the keys read as physical keys, not
 * characters — matches what the user actually presses.
 *
 * Rendered by App.tsx only while open.
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

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      eyebrow="Keyboard shortcuts"
      title={locale === "th" ? <span lang="th">แป้นพิมพ์ลัด</span> : "Shortcuts"}
    >
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

      <p className="note shortcuts-foot">
        Press <kbd className="shortcuts-kbd">?</kbd> anytime to open this dialog.
      </p>
    </Dialog>
  );
}
