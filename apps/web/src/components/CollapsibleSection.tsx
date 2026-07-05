import { useState, useEffect, type ReactNode } from "react";

/** Persist collapse state in localStorage so user preferences survive a refresh. */
function useCollapseState(key: string, defaultOpen = true): [boolean, (v: boolean) => void] {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(`panel-collapse:${key}`);
      return stored !== null ? stored === "true" : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const setAndStore = (v: boolean) => {
    setOpen(v);
    try { localStorage.setItem(`panel-collapse:${key}`, String(v)); } catch {}
  };

  // Sync if another tab changes it
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `panel-collapse:${key}` && e.newValue !== null) {
        setOpen(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  return [open, setAndStore];
}

interface CollapsibleSectionProps {
  /** Stable key used for localStorage persistence */
  storageKey: string;
  /** Section title — rendered as eyebrow in the header */
  title: string;
  /** Whether the section starts open (true) or collapsed (false). Default: true. */
  defaultOpen?: boolean;
  children: ReactNode;
  /** Optional right-side actions (e.g. a refresh button) */
  actions?: ReactNode;
  /** Optional CSS class override */
  className?: string;
  /** Controls border-top divider. Default: true. */
  divided?: boolean;
}

export function CollapsibleSection({
  storageKey,
  title,
  defaultOpen = true,
  children,
  actions,
  className,
  divided = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useCollapseState(storageKey, defaultOpen);

  return (
    <div className={`sidebar-section${divided ? " sidebar-section--divided" : ""}${open ? " sidebar-section--open" : " sidebar-section--collapsed"}${className ? ` ${className}` : ""}`}>
      <button
        className="sidebar-section__hdr"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`section-body-${storageKey}`}
        title={open ? "Collapse section" : "Expand section"}
      >
        <span className="eyebrow mono">{title}</span>
        <span className="sidebar-section__chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {actions && !open && null}
      <div
        id={`section-body-${storageKey}`}
        className="sidebar-section__body"
        aria-hidden={!open}
      >
        {children}
        {actions && (
          <div className="sidebar-section__actions">{actions}</div>
        )}
      </div>
    </div>
  );
}
