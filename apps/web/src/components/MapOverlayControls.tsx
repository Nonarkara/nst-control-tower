import type { MapViewState } from "../map/presets";

interface MapOverlayControlsProps {
  mapViewState: MapViewState;
  onAerialOnly: () => void;
  onClearOverlays: () => void;
  onRestoreLens: () => void;
}

// Visible text is the accessible name (WCAG 2.5.3); the longer explanation is a tooltip.
export function MapOverlayControls({
  mapViewState,
  onAerialOnly,
  onClearOverlays,
  onRestoreLens,
}: MapOverlayControlsProps) {
  const isCustom = mapViewState.kind === "custom";
  const label = isCustom ? (mapViewState as { kind: "custom"; label: string }).label : null;

  return (
    <div className="map-overlay-controls">
      {isCustom && label && (
        <span className="map-view-status" role="status" aria-live="polite">
          <span className="map-view-status-dot" aria-hidden="true" />
          {label}
        </span>
      )}
      <div className="map-overlay-actions">
        {isCustom ? (
          <button type="button" onClick={onRestoreLens} title="Restore default layers for the current lens">
            RESTORE LENS
          </button>
        ) : (
          <>
            <button type="button" onClick={onAerialOnly} title="Aerial-only view — disables all data overlays">
              AERIAL
            </button>
            <button type="button" onClick={onClearOverlays} title="Clear all active map overlays">
              CLEAR
            </button>
          </>
        )}
      </div>
    </div>
  );
}
