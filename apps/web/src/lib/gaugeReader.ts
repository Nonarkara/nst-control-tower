/**
 * gaugeReader — read a canal water line from a CCTV still frame, no ML.
 *
 * The 30 WL cameras stare at canals / drains / street gutters, most with a
 * wooden staff gauge in shot. Absolute metres need per-camera calibration we
 * don't have — so v1 answers the cheaper, more urgent question: WHERE IS THE
 * WATER LINE, and is it RISING between visits? The caller (gaugeWatch) keeps
 * a per-camera baseline and reports significant rises as `water-rising`
 * cv-events, which is exactly the signal the telemetry deserts don't have.
 *
 * Method (pure pixels, no DOM — runs in vitest):
 *   1. Reject unusable frames: near-black (night/IR) or near-white (fog/
 *      blown out) overall → null.
 *   2. Scan rows in the lower 75% of the frame over the centre band. A pixel
 *      is "water-like" when dark AND not red-dominant (canal water here is
 *      murky green-brown; sky, concrete, poles and IR-hot foliage are not).
 *   3. The water body is the longest contiguous run of water-like rows; the
 *      line is its top edge. Confidence comes from run length × edge
 *      contrast (mean luminance just above vs just below the edge).
 *
 * lineY is a fraction of frame height from the TOP (0 = top, 1 = bottom), so
 * a falling lineY between two visits means RISING water.
 */

export interface GaugeReading {
  /** Water-line position as a fraction of frame height from the top. */
  lineY: number;
  /** 0..1 — run length × edge contrast. Below ~0.5 the caller should ignore. */
  confidence: number;
  /** Fraction of rows in the scan zone that read as water. */
  waterCoverage: number;
}

const SCAN_TOP = 0.25; // ignore the top quarter (sky, roofs, wires)
const MIN_RUN_FRAC = 0.08; // water body must cover ≥8% of frame height
const MIN_EDGE_CONTRAST = 14; // mean-luminance step at the edge (0..255)
const NIGHT_MEAN_L = 32; // below this the frame is night/IR — refuse
const FOG_MEAN_L = 225; // above this the frame is fog/blown-out — refuse

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Canal water in NST daylight: dark, green ≥ red, blue not dominant. */
function isWaterLike(r: number, g: number, b: number): boolean {
  const l = luminance(r, g, b);
  return l < 120 && g >= r - 6 && b <= g + 30;
}

export function readWaterLevel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): GaugeReading | null {
  if (width < 8 || height < 8 || data.length < width * height * 4) return null;

  // Whole-frame brightness gate (sampled — cheap).
  let sumL = 0;
  let n = 0;
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      sumL += luminance(data[i]!, data[i + 1]!, data[i + 2]!);
      n++;
    }
  }
  const meanL = sumL / Math.max(1, n);
  if (meanL < NIGHT_MEAN_L || meanL > FOG_MEAN_L) return null;

  // Centre band — the canal/pole is rarely at the frame edges.
  const x0 = Math.floor(width * 0.3);
  const x1 = Math.ceil(width * 0.7);
  const yStart = Math.floor(height * SCAN_TOP);

  const rowWater = new Array<number>(height).fill(0);
  for (let y = yStart; y < height; y++) {
    let wet = 0;
    let tot = 0;
    for (let x = x0; x < x1; x += 2) {
      const i = (y * width + x) * 4;
      if (isWaterLike(data[i]!, data[i + 1]!, data[i + 2]!)) wet++;
      tot++;
    }
    rowWater[y] = tot > 0 ? wet / tot : 0;
  }

  // A row "is water" when most of the band agrees.
  const isWet = rowWater.map((f) => f >= 0.55);

  // Longest contiguous wet run in the scan zone.
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  for (let y = yStart; y <= height; y++) {
    const wet = y < height && isWet[y];
    if (wet && curStart < 0) curStart = y;
    if (!wet && curStart >= 0) {
      const len = y - curStart;
      if (len > bestLen) { bestLen = len; bestStart = curStart; }
      curStart = -1;
    }
  }
  if (bestStart < 0 || bestLen / height < MIN_RUN_FRAC) return null;

  // Edge contrast: mean luminance of the 4 rows above vs 4 below the edge.
  const meanRows = (a: number, b: number): number => {
    let s = 0;
    let c = 0;
    for (let y = Math.max(0, a); y < Math.min(height, b); y++) {
      for (let x = x0; x < x1; x += 3) {
        const i = (y * width + x) * 4;
        s += luminance(data[i]!, data[i + 1]!, data[i + 2]!);
        c++;
      }
    }
    return c > 0 ? s / c : 0;
  };
  const above = meanRows(bestStart - 4, bestStart);
  const below = meanRows(bestStart, bestStart + 4);
  const contrast = Math.abs(above - below);
  if (contrast < MIN_EDGE_CONTRAST) {
    return { lineY: bestStart / height, confidence: 0.2, waterCoverage: bestLen / height };
  }

  // Confidence: run length (0..1 over 8%→40% of height) × edge (14→70).
  const runScore = Math.min(1, bestLen / height / 0.4);
  const edgeScore = Math.min(1, contrast / 70);
  const confidence = Math.round((0.35 * runScore + 0.65 * edgeScore) * 100) / 100;

  return {
    lineY: bestStart / height,
    confidence: Math.max(0.25, Math.min(1, confidence)),
    waterCoverage: bestLen / height,
  };
}
