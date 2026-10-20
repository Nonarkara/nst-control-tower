/** Operator-marked image boundary tracking, including well-lit night images.
 * This is image-space change screening. It does not identify water, measure
 * metres, confirm flooding, or establish safety. Reflections/IR/PTZ can fool it. */
export interface BoundaryReading { y: number; contrast: number; mean: number; digest: number }
export function readMarkedBoundary(data: Uint8ClampedArray, width: number, height: number, mark: { x: number; y: number }): BoundaryReading | null {
  if (width < 16 || height < 16 || data.length !== width * height * 4 || mark.x < 0 || mark.x > 1 || mark.y < 0 || mark.y > 1) return null;
  const x0 = Math.max(0, Math.floor((mark.x - 0.08) * width));
  const x1 = Math.min(width, Math.ceil((mark.x + 0.08) * width));
  const start = Math.max(3, Math.floor((mark.y - 0.08) * height));
  const end = Math.min(height - 3, Math.ceil((mark.y + 0.08) * height));
  const rows: number[] = []; let sum = 0; let samples = 0; let digest = 2166136261;
  for (let y = 0; y < height; y++) {
    let row = 0; let n = 0;
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const l = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      row += l; n++; digest = Math.imul(digest ^ l, 16777619);
    }
    rows.push(row / Math.max(1, n)); sum += row; samples += n;
  }
  const mean = sum / samples;
  if (!Number.isFinite(mean) || mean < 20 || mean > 235) return null;
  let contrast = 0; let boundary = -1;
  for (let y = start; y < end; y++) {
    const edge = Math.abs((rows[y] + rows[y + 1] + rows[y + 2] - rows[y - 1] - rows[y - 2] - rows[y - 3]) / 3);
    if (edge > contrast) { contrast = edge; boundary = y; }
  }
  return contrast >= 18 && boundary >= 0 ? { y: boundary / height, contrast, mean, digest: digest >>> 0 } : null;
}
export function compareBoundary(reference: BoundaryReading, current: BoundaryReading, elapsedMs: number): "unknown" | "repeat" | "inspect-rise" | "no-significant-change" {
  if (elapsedMs <= 0 || elapsedMs > 3600_000 || Math.abs(current.mean - reference.mean) > 35 || current.contrast < 18) return "unknown";
  if (reference.digest === current.digest) return "repeat";
  return reference.y - current.y >= 0.04 ? "inspect-rise" : "no-significant-change";
}
