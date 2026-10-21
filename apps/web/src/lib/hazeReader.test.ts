import { describe, test, expect } from "vitest";
import { readHaze, rateHaze, summarizeHaze, crossCheckHaze, BASELINE_MIN_SAMPLES, type HazeBand } from "./hazeReader";

const W = 160;
const H = 90;

/** Deterministic pseudo-random so tests never flake. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** A crisp daytime street: bright sky, mid-tone buildings, dark shadows, foliage, road. */
function scene(seed = 1): Uint8ClampedArray {
  const r = rng(seed);
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      let R: number, G: number, B: number;
      if (y < H * 0.3) {
        [R, G, B] = [150, 185, 235]; // sky
      } else {
        const block = (Math.floor(x / 11) * 7 + Math.floor(y / 9) * 13 + seed) % 5;
        if (block === 0) [R, G, B] = [28, 24, 22]; // deep shadow
        else if (block === 1) [R, G, B] = [40, 95, 38]; // foliage
        else if (block === 2) [R, G, B] = [190, 160, 120]; // sunlit wall
        else if (block === 3) [R, G, B] = [70, 72, 80]; // road
        else [R, G, B] = [210, 60, 50]; // signage
        const n = (r() - 0.5) * 30;
        R += n; G += n; B += n;
      }
      d[p] = R; d[p + 1] = G; d[p + 2] = B; d[p + 3] = 255;
    }
  }
  return d;
}

/** Physical haze model: I = J·t + A·(1 − t). */
function withHaze(src: Uint8ClampedArray, t: number, A = 215): Uint8ClampedArray {
  const d = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    d[i] = src[i]! * t + A * (1 - t);
    d[i + 1] = src[i + 1]! * t + A * (1 - t);
    d[i + 2] = src[i + 2]! * t + A * (1 - t);
    d[i + 3] = 255;
  }
  return d;
}

function index(d: Uint8ClampedArray): number {
  const r = readHaze(d, W, H);
  if (!r) throw new Error("unreadable");
  return r.index;
}

describe("readHaze — the index follows the physics", () => {
  test("rises monotonically as transmission falls", () => {
    const base = scene();
    const ts = [1, 0.85, 0.7, 0.55, 0.4, 0.25];
    const idx = ts.map((t) => index(withHaze(base, t)));
    for (let i = 1; i < idx.length; i++) expect(idx[i]!).toBeGreaterThan(idx[i - 1]!);
  });

  test("a crisp scene reads clear, thick fog reads thick", () => {
    const base = scene();
    expect(rateHaze(index(base), null).band).toBe("clear");
    expect(rateHaze(index(withHaze(base, 0.25)), null).band).toBe("thick");
  });

  test("the bands step through light and hazy on the way", () => {
    const base = scene();
    const bands = [1, 0.8, 0.6, 0.4, 0.2].map((t) => rateHaze(index(withHaze(base, t)), null).band);
    expect(new Set(bands).size).toBeGreaterThanOrEqual(3);
    expect(bands[0]).toBe("clear");
    expect(bands.at(-1)).toBe("thick");
  });

  test("is not fooled by a different crisp scene", () => {
    for (const seed of [2, 3, 4]) expect(rateHaze(index(scene(seed)), null).band).toBe("clear");
  });
});

describe("readHaze — refuses what it cannot judge", () => {
  const flat = (v: number) => {
    const d = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < d.length; i += 4) { d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255; }
    return d;
  };
  test("night / IR frame → null", () => expect(readHaze(flat(15), W, H)).toBeNull());
  test("blown-out frame → null", () => expect(readHaze(flat(250), W, H)).toBeNull());
  test("tiny or truncated buffer → null", () => {
    expect(readHaze(new Uint8ClampedArray(16), 2, 2)).toBeNull();
    expect(readHaze(new Uint8ClampedArray(10), W, H)).toBeNull();
  });
  test("a featureless mid-grey frame is readable but low-confidence", () => {
    const r = readHaze(flat(150), W, H);
    expect(r).not.toBeNull();
    expect(r!.confidence).toBeLessThan(0.6);
  });
});

describe("rateHaze — relative to the camera's own clear view", () => {
  test("a white-walled camera is not 'hazy' every day", () => {
    // Absolute 0.55 would read hazy; but THIS camera's clearest ever is 0.50.
    expect(rateHaze(0.55, null).band).toBe("hazy");
    expect(rateHaze(0.55, 0.5).band).toBe("clear");
  });
  test("a real rise above its own baseline is flagged", () => {
    expect(rateHaze(0.5 + 0.3, 0.5).band).toBe("hazy");
    expect(rateHaze(0.5 + 0.45, 0.5).band).toBe("thick");
  });
  test("baseline needs several samples before it is trusted", () => {
    expect(BASELINE_MIN_SAMPLES).toBeGreaterThanOrEqual(3);
  });
});

describe("summarizeHaze — a city is not one camera", () => {
  test("one camera → no verdict", () => {
    expect(summarizeHaze(["thick"]).band).toBeNull();
  });
  test("median of cameras, with how many agree", () => {
    const bands: HazeBand[] = ["clear", "light", "light", "hazy", "light"];
    expect(summarizeHaze(bands)).toEqual({ band: "light", cameras: 5, agreeing: 3 });
  });
  test("one outlier camera cannot flip the city", () => {
    expect(summarizeHaze(["clear", "clear", "clear", "thick"]).band).toBe("clear");
  });
});

describe("crossCheckHaze — cameras vs air sensors", () => {
  test("hazy cameras + clean sensor → says it is probably not smoke", () => {
    const v = crossCheckHaze("hazy", 18);
    expect(v.kind).toBe("camera-only");
    expect(v.kind === "camera-only" && v.text).toMatch(/not smoke/);
  });
  test("hazy cameras + dirty air → confirmed", () => {
    expect(crossCheckHaze("hazy", 62).kind).toBe("confirmed");
  });
  test("hazy cameras, no sensor reading → says unconfirmed", () => {
    expect(crossCheckHaze("hazy", null).kind).toBe("camera-only");
  });
  test("clear is clear whatever the sensor says", () => {
    expect(crossCheckHaze("clear", 80).kind).toBe("clear");
  });
  test("no city band → unknown", () => {
    expect(crossCheckHaze(null, 20).kind).toBe("unknown");
  });
});
