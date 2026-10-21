import { expect, it } from "vitest";
import { compareBoundary, readMarkedBoundary } from "./cameraBoundary";
function image(edge: number, dark = 55, light = 130) { const a = new Uint8ClampedArray(100 * 100 * 4); for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) { const i = (y * 100 + x) * 4; a[i] = a[i + 1] = a[i + 2] = y < edge ? light : dark; a[i + 3] = 255; } return a; }
it("tracks an operator-marked contrasting boundary without claiming water depth", () => {
  const ref = readMarkedBoundary(image(60), 100, 100, { x: .5, y: .6 })!;
  const next = readMarkedBoundary(image(55), 100, 100, { x: .5, y: .6 })!;
  expect(ref.y).toBeCloseTo(.6, 1);
  expect(compareBoundary(ref, next, 60_000)).toBe("inspect-rise");
});
it("rejects dark, blown-out and textureless images", () => {
  for (const data of [image(50, 0, 0), image(50, 250, 250), image(50, 100, 100)]) expect(readMarkedBoundary(data, 100, 100, { x: .5, y: .5 })).toBeNull();
});
it("does not interpret a repeated frame or expired reference as stable water", () => {
  const r = readMarkedBoundary(image(60), 100, 100, { x: .5, y: .6 })!;
  expect(compareBoundary(r, r, 60_000)).toBe("repeat");
  expect(compareBoundary(r, r, 3600_001)).toBe("unknown");
  expect(compareBoundary(r, { ...r, mean: r.mean + 40 }, 60_000)).toBe("unknown");
});
it("rejects gross same-brightness scene changes and frame-size changes", () => {
  const ref = readMarkedBoundary(image(60), 100, 100, { x: .5, y: .6 })!;
  const next = readMarkedBoundary(image(55), 100, 100, { x: .5, y: .6 })!;
  expect(compareBoundary(ref, { ...next, width: 200 }, 60_000)).toBe("unknown");
  expect(compareBoundary(ref, { ...next, scene: ref.scene.map(v => 185 - v) }, 60_000)).toBe("unknown");
});

it("includes an exact four-percent rise despite floating-point rounding", () => {
  const ref = readMarkedBoundary(image(60), 100, 100, { x: .5, y: .6 })!;
  expect(compareBoundary({ ...ref, y: .6 }, { ...ref, y: .56, digest: ref.digest + 1 }, 60_000)).toBe("inspect-rise");
});
