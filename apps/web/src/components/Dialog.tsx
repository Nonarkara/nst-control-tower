/**
 * Dialog — the one dialog pattern for the dashboard.
 *
 * Modal (default): overlay (click to close) + role="dialog" aria-modal panel,
 * focus trapped while open and returned to the trigger on close.
 * Non-modal (modal={false}): a floating card — role="dialog" without
 * aria-modal, no trap, but focus moves to the card on open and back on close.
 *
 * Both: labelled by the visible <h2> title (+ optional description), Escape
 * closes the topmost dialog, and a single close control:
 * <button class="btn">Close <kbd>Esc</kbd></button>.
 */

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export type DialogSize = "sm" | "md" | "lg" | "full";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  /** Small caps line above the title. */
  eyebrow?: ReactNode;
  /** Extra header controls rendered before the Close button. */
  actions?: ReactNode;
  children?: ReactNode;
  size?: DialogSize;
  modal?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Extra class on the panel for per-dialog layout. */
  className?: string;
}

// Open dialogs, oldest first. Only the topmost handles Escape.
const openStack: symbol[] = [];

export function Dialog({
  open,
  onClose,
  title,
  titleId,
  description,
  eyebrow,
  actions,
  children,
  size = "md",
  modal = true,
  initialFocusRef,
  className,
}: DialogProps) {
  const autoTitleId = useId();
  const descId = useId();
  const headingId = titleId ?? autoTitleId;
  const trapRef = useFocusTrap(open && modal);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Initial focus override (runs after the trap focused the first control).
  useEffect(() => {
    if (open) initialFocusRef?.current?.focus();
  }, [open, initialFocusRef]);

  // Non-modal: move focus to the card on open, back to the trigger on close.
  useEffect(() => {
    if (!open || modal) return;
    const panel = trapRef.current;
    const trigger = document.activeElement as HTMLElement | null;
    if (!initialFocusRef?.current) panel?.focus({ preventScroll: true });
    return () => {
      const active = document.activeElement;
      const focusLost = !active || active === document.body || (panel?.contains(active) ?? false);
      if (focusLost && trigger && trigger !== document.body && trigger.isConnected) trigger.focus();
    };
  }, [open, modal, trapRef, initialFocusRef]);

  // Escape closes the topmost dialog.
  useEffect(() => {
    if (!open) return;
    const id = Symbol("dialog");
    openStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || openStack[openStack.length - 1] !== id) return;
      // Another app modal (not built on Dialog) holds focus — let it handle Escape.
      const foreign = (document.activeElement as HTMLElement | null)?.closest('[aria-modal="true"]');
      if (foreign && foreign !== trapRef.current) return;
      e.stopPropagation();
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      const i = openStack.indexOf(id);
      if (i >= 0) openStack.splice(i, 1);
    };
  }, [open, trapRef]);

  if (!open) return null;

  const panel = (
    <div
      ref={trapRef}
      className={`dialog dialog--${size}${modal ? "" : " dialog--floating"}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal={modal ? "true" : undefined}
      aria-labelledby={headingId}
      aria-describedby={description ? descId : undefined}
      tabIndex={-1}
      onClick={modal ? (e) => e.stopPropagation() : undefined}
    >
      <header className="dialog__head">
        <div className="dialog__heading">
          {eyebrow ? <p className="dialog__eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId} className="dialog__title">{title}</h2>
          {description ? <p id={descId} className="dialog__desc">{description}</p> : null}
        </div>
        <div className="dialog__actions">
          {actions}
          <button type="button" className="btn" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </div>
      </header>
      <div className="dialog__body">{children}</div>
    </div>
  );

  if (!modal) return panel;

  return (
    <div className={`dialog-overlay dialog-overlay--${size}`} onClick={onClose}>
      {panel}
    </div>
  );
}
