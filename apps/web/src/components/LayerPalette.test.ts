import { describe, test, expect } from "vitest";
import { leadSentences } from "./LayerPalette";
import { LENSES } from "../map/presets";

describe("leadSentences — the lens hint stays short and whole", () => {
  test("keeps whole sentences under the budget", () => {
    expect(leadSentences("One. Two two. Three three three.", 14)).toBe("One. Two two.");
  });
  test("always returns at least one sentence, even a long one", () => {
    expect(leadSentences("A very long first sentence that is over budget. Second.", 10)).toBe("A very long first sentence that is over budget.");
  });
  test("every real lens hint fits a 300 px rail in a few lines", () => {
    for (const l of LENSES) {
      const hint = leadSentences(l.describe);
      expect(hint.length).toBeGreaterThan(10);
      expect(hint.length).toBeLessThanOrEqual(220);
      expect(hint).toMatch(/[.!?]$/);
    }
  });
});
