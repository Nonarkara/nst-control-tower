import type { IncidentFeature } from "@nst/shared";
import { fmtAge } from "@nst/shared";
import { safeUrl } from "../lib/safeUrl";
import { Dialog } from "./Dialog";

interface Props {
  incident: IncidentFeature | null;
  onClose: () => void;
}

const PLATFORM_LABEL: Record<IncidentFeature["reporterPlatform"], string> = {
  traffy: "Traffy Fondue",
  "city-reporter": "City Reporter",
  itic: "iTIC",
  internal: "Municipal",
};

function minutesSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

/**
 * Right-anchored, non-modal card for a picked incident. Its whole reason to
 * exist is the "Open report ↗" deep-link: an operator clicks an incident on
 * the map and jumps straight to where the citizen reported it, to go fix it.
 * Escape or the Close button closes it.
 */
export function IncidentCard({ incident, onClose }: Props) {
  if (!incident) return null;
  const href = safeUrl(incident.sourceUrl);
  const platform = PLATFORM_LABEL[incident.reporterPlatform] ?? "Report";

  return (
    <Dialog
      open
      modal={false}
      size="sm"
      onClose={onClose}
      eyebrow="NST · Incident"
      title={incident.title}
      description={incident.ticketNumber ? <span className="num">#{incident.ticketNumber}</span> : undefined}
    >
      <dl className="building-card-meta">
        <dt>CATEGORY</dt>
        <dd>{incident.category}</dd>
        <dt>SEVERITY</dt>
        <dd>{incident.severity}</dd>
        <dt>STATUS</dt>
        <dd>{incident.status}</dd>
        <dt>REPORTED</dt>
        <dd>{fmtAge(minutesSince(incident.reportedAt))}</dd>
        <dt>SOURCE</dt>
        <dd>{platform}</dd>
      </dl>

      {incident.description && (
        <section className="building-card-section">
          <h3 className="eyebrow">DESCRIPTION</h3>
          <p className="incident-card-desc">{incident.description}</p>
        </section>
      )}

      {href ? (
        <a href={href} target="_blank" rel="noreferrer noopener" className="link">
          Open report ↗
        </a>
      ) : (
        <p className="note">No public report link</p>
      )}
    </Dialog>
  );
}
