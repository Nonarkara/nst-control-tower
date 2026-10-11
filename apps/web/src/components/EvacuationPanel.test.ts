import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * "WHO TO MOVE FIRST" is the one panel on this dashboard that tells a resident
 * to leave their house. It ranked villages by live gauge telemetry and then
 * rendered a PanelHeader carrying neither `ageMinutes` nor `fallbackTier` —
 * the only flood-side rail panel that did not, while its two siblings
 * (SensorInsights, LevelWatch) both did.
 *
 * So a list of people to evacuate could be driven by gauge readings of unknown
 * age with nothing on screen to say so. The ranking logic was honest; the
 * header it was presented under was silent about how fresh the evidence was.
 */

const panel = readFileSync(new URL("./EvacuationPanel.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

/** Just the PanelHeader call at the top of the panel. */
function header(): string {
  const start = panel.indexOf("<PanelHeader");
  expect(start, "the EvacuationPanel PanelHeader disappeared").toBeGreaterThan(-1);
  return panel.slice(start, panel.indexOf("/>", start) + 2);
}

describe("the evacuation panel discloses the age of its own evidence", () => {
  it("shows the data-age chip", () => {
    expect(header()).toMatch(/ageMinutes=\{ageMinutes\}/);
  });

  it("shows the fallback tier when the feed is not live", () => {
    expect(header()).toMatch(/fallbackTier=\{fallbackTier\}/);
  });

  it("receives them from the gauge feed, not from a constant", () => {
    // App.tsx must actually pass the gauge meta through; a header that reads
    // `ageMinutes={null}` satisfies the two guards above and means nothing.
    const call = app.slice(app.indexOf("<EvacuationPanel"), app.indexOf("/>", app.indexOf("<EvacuationPanel")) + 2);
    expect(call).toMatch(/ageMinutes=\{waterGauges\.ageMinutes\}/);
    expect(call).toMatch(/fallbackTier=\{waterGauges\.fallbackTier/);
  });
});

describe("disclosing the age must not cost the alarm", () => {
  it("still shouts when the rivers go dark", () => {
    // The reason the panel could look calm while blind. Keep it.
    expect(panel).toMatch(/role="alert"/);
    expect(panel).toMatch(/River gauges are offline/);
  });

  it("still refuses to call a village safe when it has no signal", () => {
    expect(panel).toMatch(/No live signal/);
  });
});