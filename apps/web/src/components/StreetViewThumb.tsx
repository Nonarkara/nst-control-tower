import { useEffect, useState } from "react";
import { API_BASE } from "../lib/apiBase";

interface Props {
  /** [lng, lat] of the point to look at. */
  coord: [number, number];
  /** Optional heading override (degrees, 0 = north). */
  heading?: number;
}

type Status = "loading" | "available" | "none";

/**
 * Ground-truth Street View thumbnail for a clicked location. Calls the
 * server-proxied endpoints (/api/streetview/meta + /api/streetview) so the
 * Google key never reaches the browser. Degrades to a clear "no imagery"
 * note when there is no panorama within Google's snap radius.
 */
export function StreetViewThumb({ coord, heading = 0 }: Props) {
  const [lng, lat] = coord;
  const [status, setStatus] = useState<Status>("loading");
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    fetch(`${API_BASE}/api/streetview/meta?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((d: { features?: Array<{ available?: boolean; date?: string | null }> }) => {
        if (!alive) return;
        const f = d.features?.[0];
        setStatus(f?.available ? "available" : "none");
        setDate(f?.date ?? null);
      })
      .catch(() => alive && setStatus("none"));
    return () => {
      alive = false;
    };
  }, [lat, lng]);

  if (status === "loading") {
    return (
      <div className="streetview-thumb streetview-thumb--msg mono">
        <span className="dot loading" /> Street View…
      </div>
    );
  }
  if (status === "none") {
    return <div className="streetview-thumb streetview-thumb--msg mono">No Street View here</div>;
  }

  const src = `${API_BASE}/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=320x180`;
  return (
    <div className="streetview-thumb">
      <img src={src} alt="Street View of this location" loading="lazy" />
      <span className="streetview-cred mono">
        STREET VIEW · GOOGLE{date ? ` · ${date}` : ""}
      </span>
    </div>
  );
}
