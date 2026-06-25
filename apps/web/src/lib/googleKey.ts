/**
 * Google Maps Platform key for client-side layers (photorealistic 3D tiles,
 * traffic + satellite tile sessions). Read from the Vite build-time env.
 *
 * SECURITY: this value is baked into the browser bundle by design — Google
 * tile/3D requests must carry the key. The real protection is a referrer- +
 * API- + quota-restricted key in Google Cloud Console, NOT keeping it secret.
 */
export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

/** True when a Google key is present, so layers can degrade gracefully. */
export const hasGoogleKey = (): boolean => GOOGLE_MAPS_API_KEY.length > 0;
