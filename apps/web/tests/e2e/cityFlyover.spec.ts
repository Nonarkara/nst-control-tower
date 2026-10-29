import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
const infill = JSON.parse(readFileSync("public/geo/nst/buildings-infill.geojson", "utf8"));
const coverageFixture = { ...infill, features: infill.features.slice(0, 1) };

// Deliberately no third-party imagery requests or production API calls in CI.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Full asset integrity/geometry is tested in unit tests; UI tests need one
  // source-backed example, not 17k software-rendered buildings per viewport.
  await page.route("**/geo/nst/buildings-infill.geojson", route => route.fulfill({ json: coverageFixture }));
  await page.route("https://services.arcgisonline.com/**", route => route.abort());
});
// Release WebGL tile resources before browser-context trace teardown.
test.afterEach(async ({ page }) => {
  await page.goto("about:blank", { waitUntil: "commit" });
});
for (const width of [390, 1024, 1440]) {
  test(`city flyover keeps flood comparison and expanded limits usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/?demo=city");
    const controls = page.getByRole("region", { name: "City flyover controls" });
    await expect(controls).toBeVisible();
    await expect(page.getByRole("button", { name: "Play flyover", exact: true })).toBeDisabled();
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Next flyover stop" }).click();
    await page.getByRole("button", { name: "2.12 m", exact: true }).click();
    await expect(controls).toContainText(/surveyed road km below level/);
    await expect(controls).toContainText(/not tonight’s flood forecast/);
    await controls.locator("summary").click();
    await expect(controls).toContainText(/No flow routing, drainage or arrival time/);
    const box = await controls.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(52);
    expect(box!.y + box!.height).toBeLessThanOrEqual(width <= 1100 ? (width === 390 ? 782 : 838) : 900);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await controls.getByRole("button", { name: "Previous flyover stop" }).focus();
    await expect(controls.getByRole("button", { name: "Previous flyover stop" })).toBeFocused();
    await page.screenshot({ path: test.info().outputPath(`expanded-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(controls).toHaveCount(0);
    await expect(page).not.toHaveURL(/demo=city/);
    expect(errors).toEqual([]);
  });
}
test("malformed critical assets fail closed and do not claim coverage or a flood result", async ({ page }) => {
  test.setTimeout(90_000);
  await page.route("**/geo/nst/buildings-infill.geojson", route => route.fulfill({ json: {} }));
  await page.route("**/geo/nst/hii/road-levels.geojson", route => route.fulfill({ json: {} }));
  await page.goto("/?demo=city");
  const controls = page.getByRole("region", { name: "City flyover controls" });
  await expect(controls).toContainText("Satellite-derived infill unavailable", { timeout: 45_000 });
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Next flyover stop" }).click();
  await expect(controls).toContainText("HII survey unavailable — no what-if result.", { timeout: 45_000 });
  await expect(page.getByRole("button", { name: "2.12 m", exact: true })).toBeDisabled();
  await expect(controls).not.toContainText(/surveyed road km below level/);
  await page.screenshot({ path: test.info().outputPath("missing-assets.png") });
});
