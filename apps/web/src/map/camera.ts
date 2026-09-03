import type { Coordinates } from "@nst/shared";
import { NST } from "@nst/shared";

/**
 * Zoom range for the NST map controller.
 *
 * Do not pair a low zoom with a tight `maxBounds`. The old boot (zoom ~8.4
 * + `NST.outerBounds` ≈ 1° of longitude) made the viewport wider than the
 * clamp, so every drag was rejected and the camera felt frozen. This build
 * opens on the city and does not pass `maxBounds` to deck.gl — min/max zoom
 * still apply.
 */
export const MAP_MIN_ZOOM = 7;
export const MAP_MAX_ZOOM = 18;

export const MAP_SCROLL_ZOOM = { speed: 0.008, smooth: true } as const;

/** Cap retina DPR so a 2×/3× display does not 4–9× the GPU fill during pan. */
export const MAP_DEVICE_PIXELS = 1.5;

/**
 * Approximate longitude span of a Web Mercator viewport (256 px tiles).
 * Used to detect the "viewport wider than the clamp" failure mode.
 */
export function viewportLngSpanDeg(zoom: number, viewportWidthPx = 1280): number {
  const worldPx = 256 * 2 ** zoom;
  return (viewportWidthPx / worldPx) * 360;
}

export function boundsLngSpanDeg(bounds: [Coordinates, Coordinates]): number {
  const [[west], [east]] = bounds;
  return Math.abs(east - west);
}

/** True when a viewport at `zoom` is so wide that `bounds` cannot pan. */
export function viewportFillsBounds(
  zoom: number,
  bounds: [Coordinates, Coordinates],
  viewportWidthPx = 1280,
): boolean {
  return viewportLngSpanDeg(zoom, viewportWidthPx) >= boundsLngSpanDeg(bounds) * 0.9;
}

/** Distance in degrees from the commanded camera to the city center. */
export function cityCenterDeltaDeg(
  view: { longitude: number; latitude: number },
  center: Coordinates = NST.center,
): number {
  const [lng, lat] = center;
  return Math.hypot(view.longitude - lng, view.latitude - lat);
}
