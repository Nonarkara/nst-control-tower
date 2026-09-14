import type { DevicePresence } from "../hooks/useDevicePresence";
import { fmtCoord, fmtAccuracy, networkLabel } from "../lib/device";
import { StatusText } from "../lib/cityStatus";

interface Props {
  presence: DevicePresence;
  onRequest: () => void;
  onClear: () => void;
}

/**
 * DeviceCheckIn — left-rail panel that prompts the user to log this
 * computer into the dashboard by GPS only. After permission, shows the
 * fix, accuracy, network, and whether the device is inside the municipal
 * bounding box.
 */
export function DeviceCheckIn({ presence, onRequest, onClear }: Props) {
  const { state, lng, lat, accuracyM, fixedAt, network, insideArea } = presence;

  return (
    <section className="panel" aria-labelledby="device-checkin-title" aria-busy={state === "asking"}>
      <header className="pc-spread">
        <h3 className="pc-label" id="device-checkin-title">Device check-in · GPS only</h3>
        {state === "granted" ? (
          <button type="button" onClick={onClear} className="btn btn--quiet" aria-label="Clear GPS fix">
            Clear
          </button>
        ) : null}
      </header>

      {state !== "granted" && (
        <div className="pc-section">
          <p className="note">
            Log this computer into the system by GPS. We read your fix locally
            (the browser permission popup gates it) — nothing is sent anywhere.
            Used to anchor the WiFi survey + identify which building you're in.
          </p>
          <button
            type="button"
            onClick={onRequest}
            disabled={state === "asking"}
            className="btn"
          >
            {state === "asking"
              ? "Waiting for browser…"
              : state === "denied"
                ? "Permission denied — retry"
                : state === "unsupported"
                  ? "Geolocation unsupported"
                  : state === "error"
                    ? "Retry"
                    : "Request GPS fix"}
          </button>
          {presence.err && (
            <p role="alert">
              <StatusText level="critical">Error</StatusText> <span className="pc-meta">{presence.err}</span>
            </p>
          )}
        </div>
      )}

      {state === "granted" && (
        <div className="pc-section">
          <dl className="dev-list">
            <dt>Fix</dt>
            <dd className="num">{fmtCoord(lat)}, {fmtCoord(lng)}</dd>
            <dt>Accuracy</dt>
            <dd className="num">{fmtAccuracy(accuracyM)}</dd>
            <dt>Network</dt>
            <dd>{networkLabel(network)}</dd>
            {(network.downlinkMbps != null || network.rttMs != null) && (
              <>
                <dt>Link</dt>
                <dd className="num">
                  {network.downlinkMbps != null ? `${network.downlinkMbps} Mbps` : "—"}
                  {network.rttMs != null ? ` · ${network.rttMs} ms` : ""}
                </dd>
              </>
            )}
            <dt>Area</dt>
            <dd>
              {insideArea == null ? (
                "—"
              ) : insideArea ? (
                <StatusText level="normal">In area</StatusText>
              ) : (
                <StatusText level="critical">Out of area</StatusText>
              )}
            </dd>
          </dl>
          {fixedAt && (
            <p className="pc-meta num">
              FIX {new Date(fixedAt).toLocaleTimeString("en-GB")} · watching
            </p>
          )}
        </div>
      )}
    </section>
  );
}
