import { test, expect } from "./fixtures";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

test("aerial-reviewed roof forms render with provenance and no geometry errors", async ({ page }) => {
  test.setTimeout(90_000);
  const examples = [
    { id: "way/770813042", shape: "gabled" },
    { id: "way/766207839", shape: "flat" },
    { id: "way/1159797932", shape: "hipped" },
    { id: "way/766207684", shape: "temple-tiered" },
  ];
  const fc = JSON.parse(readFileSync("public/geo/nst/buildings.geojson", "utf8"));
  for (const example of examples) {
    const f = fc.features.find((f: { properties: { id: string } }) => f.properties.id === example.id);
    f.properties.nameEn = `Roof sample ${examples.indexOf(example) + 1}`;
  }
  await page.route("**/geo/nst/buildings.geojson", r => r.fulfill({ json: fc }));
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && /building-roofs|municipality-buildings|tessellat|shader/i.test(m.text())) errors.push(m.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Show Wat Mahathat in 3D", exact: true }).click();
  for (const example of examples) {
    const label = `Roof sample ${examples.indexOf(example) + 1}`;
    await page.getByRole("combobox", { name: "Search buildings by name" }).fill(label);
    await page.getByRole("option", { name: label, exact: true }).click();
    const card = page.getByRole("dialog", { name: label, exact: true });
    await expect(card).toContainText(`${example.shape} · aerial interpretation`);
    await expect(card).toContainText("image capture date unknown");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.waitForTimeout(1100);
    expect(errors).toEqual([]);
    if (process.env.ROOF_SCREENSHOTS) {
      const dir = resolve("../../var/roof-study-2026-10-21"); mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: `${dir}/${example.shape}-1440.png` });
    }
  }
});
