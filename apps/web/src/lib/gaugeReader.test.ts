import { describe, expect, test } from "vitest";
import { readWaterLevel } from "./gaugeReader";

const W = 120;
const H = 90;

/** Paint helper: fill rows [y0,y1) with rgb, rest sky-bright. */
function frame(paint: (x: number, y: number) => [number, number, number]): Uint8ClampedArray {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * W + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  return d;
}

const SKY: [number, number, number] = [165, 190, 215];
const WATER: [number, number, number] = [38, 62, 48]; // murky canal green
const POLE: [number, number, number] = [225, 225, 220]; // white staff gauge

describe("readWaterLevel", () => {
  test("finds the water line where sky meets canal", () => {
    const d = frame((_x, y) => (y < 40 ? SKY : WATER));
    const r = readWaterLevel(d, W, H);
    expect(r).not.toBeNull();
    // Edge at row 40 → lineY ≈ 40/90. Tolerance ±3 rows.
    expect(Math.abs(r!.lineY * H - 40)).toBeLessThanOrEqual(3);
    expect(r!.confidence).toBeGreaterThanOrEqual(0.5);
  });

  test("a white gauge pole in the water does not move the line", () => {
    const d = frame((x, y) => {
      if (y < 40) return SKY;
      if (x >= 55 && x <= 65) return POLE; // pole stripe through the water
      return WATER;
    });
    const r = readWaterLevel(d, W, H);
    expect(r).not.toBeNull();
    expect(Math.abs(r!.lineY * H - 40)).toBeLessThanOrEqual(3);
  });

  test("a higher water line reads higher (smaller lineY)", () => {
    const low = readWaterLevel(frame((_x, y) => (y < 55 ? SKY : WATER)), W, H)!;
    const high = readWaterLevel(frame((_x, y) => (y < 30 ? SKY : WATER)), W, H)!;
    expect(high.lineY).toBeLessThan(low.lineY);
    expect(low.lineY - high.lineY).toBeCloseTo(25 / H, 1);
  });

  test("night/IR frame is refused", () => {
    const d = frame(() => [14, 15, 14]);
    expect(readWaterLevel(d, W, H)).toBeNull();
  });

  test("dry street (no water body) yields nothing confident", () => {
    // Concrete + a dark drain strip too thin to be a water body.
    const d = frame((_x, y) => (y >= 70 && y < 74 ? [50, 52, 50] : [150, 148, 140]));
    const r = readWaterLevel(d, W, H);
    expect(r === null || r.confidence < 0.5).toBe(true);
  });

  test("garbage input returns null, never throws", () => {
    expect(readWaterLevel(new Uint8ClampedArray(0), 0, 0)).toBeNull();
    expect(readWaterLevel(new Uint8ClampedArray(10), 120, 90)).toBeNull();
  });
});
