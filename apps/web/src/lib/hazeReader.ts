/**
 * hazeReader — estimate haze / fog / smoke from one CCTV still, no ML model.
 *
 * Physics: haze mixes a scene J with airlight A by transmission t,
 *   I = J·t + A·(1 − t).
 * Two cheap, well-established cues follow from it:
 *   1. Dark channel prior (He, Sun & Tang, 2009): in a clear outdoor scene almost
 *      every patch has some pixel dark in at least one colour channel
 *      (shadow, foliage, dark paint). Airlight lifts that floor, so
 *      darkChannel/A ≈ 1 − t.
 *   2. Contrast: haze flattens edges; mean gradient / A drops.
 * The index blends them to 0..1 (0 = crisp, 1 = whiteout).
 *
 * HONEST LIMITS (the UI repeats these):
 *  - It measures the camera's picture, not the air. White walls and overcast
 *    sky raise the dark channel with no haze, so a camera is rated against its
 *    OWN clearest view once it has history (see rateHaze).
 *  - It cannot tell smoke from mist or rain. The caller cross-checks the air
 *    sensors before calling anything "smoke".
 *  - Night / blown-out frames return null.
 *
 * Pure pixels (no DOM) so it runs in vitest.
 */

export interface HazeReading {
  /** 0 (crisp) … 1 (whiteout). */
  index: number;
  /** Dark-channel component (≈ 1 − transmission), 0..1. */
  darkChannel: number;
  /** Contrast component, 0 (flat) … 1 (crisp). */
  contrast: number;
  /** 0..1 — how much to trust this reading. */
  confidence: number;
}

const PATCH = 2; // half-size → 5×5 patch
const OMEGA = 0.95; // keep a little haze so distant objects still look real
const SKY_SKIP = 0.3; // ignore the top 30 % (sky breaks the dark channel prior)
const MIN_LUMA = 45; // below this it is night / IR
const MAX_LUMA = 235; // above this it is blown out
const CONTRAST_REF = 0.16; // mean gradient / A of a crisp daytime scene
const W_DARK = 0.6;
const W_CONTRAST = 0.4;

export function readHaze(data: Uint8ClampedArray, width: number, height: number): HazeReading | null {
  if (width < 16 || height < 16 || data.length < width * height * 4) return null;

  const n = width * height;
  const luma = new Float32Array(n);
  const minRgb = new Uint8ClampedArray(n);
  let lumaSum = 0;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const r = data[p]!;
    const g = data[p + 1]!;
    const b = data[p + 2]!;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[i] = l;
    lumaSum += l;
    minRgb[i] = r < g ? (r < b ? r : b) : g < b ? g : b;
  }
  const meanLuma = lumaSum / n;
  if (meanLuma < MIN_LUMA || meanLuma > MAX_LUMA) return null;

  const dark = erode(minRgb, width, height, PATCH);

  // Airlight A: mean luminance of the brightest 0.1 % of dark-channel pixels.
  const sorted = Float32Array.from(dark).sort();
  const topK = Math.max(1, Math.floor(n * 0.001));
  const cutoff = sorted[n - topK]!;
  let aSum = 0;
  let aCount = 0;
  for (let i = 0; i < n; i++) {
    if (dark[i]! >= cutoff) {
      aSum += luma[i]!;
      aCount++;
    }
  }
  const airlight = Math.max(120, aCount > 0 ? aSum / aCount : 200);

  const y0 = Math.floor(height * SKY_SKIP);
  let darkSum = 0;
  let gradSum = 0;
  let count = 0;
  for (let y = Math.max(y0, 1); y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      darkSum += dark[i]!;
      const gx = luma[i + 1]! - luma[i - 1]!;
      const gy = luma[i + width]! - luma[i - width]!;
      gradSum += Math.hypot(gx, gy) / 2;
      count++;
    }
  }
  if (count === 0) return null;

  const darkChannel = clamp01((OMEGA * (darkSum / count)) / airlight);
  const contrast = clamp01(gradSum / count / airlight / CONTRAST_REF);
  const index = clamp01(W_DARK * darkChannel + W_CONTRAST * (1 - contrast));

  // Trust: mid-range exposure, and enough structure in the frame to measure.
  const exposure = 1 - Math.abs(meanLuma - 128) / 128; // 1 at mid-grey
  const structure = clamp01(gradSum / count / 6); // a featureless frame can't be rated
  const confidence = clamp01(0.5 * exposure + 0.5 * structure);

  return { index, darkChannel, contrast, confidence };
}

/** Grey erosion (min filter), separable, (2r+1)² window. */
function erode(src: Uint8ClampedArray, w: number, h: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx < 0 || xx >= w) continue;
        const v = src[y * w + xx]!;
        if (v < m) m = v;
      }
      tmp[y * w + x] = m;
    }
  }
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy < 0 || yy >= h) continue;
        const v = tmp[yy * w + x]!;
        if (v < m) m = v;
      }
      out[y * w + x] = m;
    }
  }
  return out;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ── Rating ──────────────────────────────────────────────────────────────────

export type HazeBand = "clear" | "light" | "hazy" | "thick";

export const HAZE_BAND_LABEL: Record<HazeBand, { en: string; th: string }> = {
  clear: { en: "Clear", th: "ปลอดโปร่ง" },
  light: { en: "Light haze", th: "หมอกบางๆ" },
  hazy: { en: "Hazy", th: "มัวหมอง" },
  thick: { en: "Thick haze", th: "หมอกหนา" },
};

/** Absolute bands — used until a camera has history of its own. */
const ABS_EDGES = [0.3, 0.5, 0.7] as const;
/** Bands for the rise ABOVE a camera's own clearest view. */
const REL_EDGES = [0.1, 0.25, 0.4] as const;

/** Samples a camera needs before its own clearest view is trusted as the baseline. */
export const BASELINE_MIN_SAMPLES = 5;

export function rateHaze(index: number, baseline: number | null): { band: HazeBand; relative: boolean } {
  const relative = baseline != null;
  const value = relative ? index - baseline : index;
  const [a, b, c] = relative ? REL_EDGES : ABS_EDGES;
  const band: HazeBand = value < a ? "clear" : value < b ? "light" : value < c ? "hazy" : "thick";
  return { band, relative };
}

const BAND_ORDER: HazeBand[] = ["clear", "light", "hazy", "thick"];

export interface CityHaze {
  band: HazeBand | null;
  /** Cameras that produced a trustworthy reading. */
  cameras: number;
  /** Cameras whose own band equals the city band. */
  agreeing: number;
}

/** City band = the median of the per-camera bands. Needs ≥ 2 cameras: one
 *  camera is a view, not a city. */
export function summarizeHaze(bands: HazeBand[]): CityHaze {
  if (bands.length < 2) return { band: null, cameras: bands.length, agreeing: 0 };
  const ranks = bands.map((b) => BAND_ORDER.indexOf(b)).sort((x, y) => x - y);
  const median = ranks[Math.floor(ranks.length / 2)]!;
  const band = BAND_ORDER[median]!;
  return { band, cameras: bands.length, agreeing: bands.filter((b) => b === band).length };
}

/** What the camera haze means once the air sensors weigh in. */
export type HazeVerdict =
  | { kind: "clear" }
  | { kind: "confirmed"; text: string }
  | { kind: "camera-only"; text: string }
  | { kind: "unknown"; text: string };

/** PM2.5 µg/m³ (Thai standard: ≤ 37.5 is "good/moderate"). Cameras look hazy
 *  but the sensors read clean → probably mist, rain or low sun, not smoke. */
export function crossCheckHaze(band: HazeBand | null, pm25: number | null): HazeVerdict {
  if (band == null) return { kind: "unknown", text: "Not enough camera views to judge." };
  if (band === "clear") return { kind: "clear" };
  if (pm25 == null) return { kind: "camera-only", text: "Cameras look hazy; the air sensor has no reading to confirm." };
  if (pm25 > 37.5) return { kind: "confirmed", text: `Cameras and the air sensor agree (PM2.5 ${Math.round(pm25)}).` };
  return { kind: "camera-only", text: `Cameras look hazy but the air sensor reads clean (PM2.5 ${Math.round(pm25)}) — likely mist or low light, not smoke.` };
}
