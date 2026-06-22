/**
 * MapCompass — a needle compass that reflects the live map bearing and snaps
 * the camera back to true north on click.
 *
 * Bearing comes straight from the controlled viewState, so the dial tracks
 * rotation in real time — most visibly in 3D / 3DS modes, which carry a
 * built-in bearing offset (-18° / -28°). The red half of the needle points
 * north; clicking resets bearing to 0.
 */

interface MapCompassProps {
  bearing: number;
  onResetNorth: () => void;
}

export function MapCompass({ bearing, onResetNorth }: MapCompassProps) {
  // Normalise to [0, 360) for the aria label / readout.
  const deg = Math.round(((bearing % 360) + 360) % 360);

  return (
    <button
      type="button"
      className="map-compass"
      onClick={onResetNorth}
      aria-label={`Map bearing ${deg}°. Click to reset to north.`}
      title={deg === 0 ? "Facing north" : `Bearing ${deg}° · click to reset north`}
    >
      <svg
        viewBox="0 0 40 40"
        width="36"
        height="36"
        className="map-compass-dial"
        style={{ transform: `rotate(${-bearing}deg)` }}
        aria-hidden="true"
      >
        {/* North half — alert red; South half — muted */}
        <polygon points="20,6 24.5,20 20,17 15.5,20" fill="var(--bad)" />
        <polygon points="20,34 24.5,20 20,23 15.5,20" fill="var(--text-3)" />
        <circle cx="20" cy="20" r="1.7" fill="var(--text-1)" />
        <text
          x="20"
          y="5"
          textAnchor="middle"
          fontSize="6"
          fontFamily="var(--font-mono)"
          fill="var(--text-1)"
        >
          N
        </text>
      </svg>
    </button>
  );
}
