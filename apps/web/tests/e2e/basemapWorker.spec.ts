import { test, expect } from "./fixtures";

test.setTimeout(90_000);
test.beforeEach(async ({ page }) => {
  // These contracts need the real map worker, not provider tile downloads or
  // a province-wide terrain mesh. Keep GPU/network work bounded in smoke CI.
  await page.route("**/geo/nst/terrain-grid.json", route => route.fulfill({ json: { cellLng: 1, cellLat: 1, cells: [] } }));
  await page.route("https://services.arcgisonline.com/**", route => route.fulfill({
    contentType: "image/png",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/X8AAAAASUVORK5CYII=", "base64"),
  }));
});

test("map worker is emitted as JavaScript rather than the SPA fallback", async ({ page }) => {
  const worker = page.waitForResponse(response => /maplibre-gl-worker/.test(response.url()), { timeout: 30_000 });
  const ready = page.waitForEvent("worker", { predicate: worker => /maplibre-gl-worker/.test(worker.url()) });
  await page.goto("/");
  const response = await worker;
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/javascript/);
  expect(await response.text()).not.toMatch(/<!doctype html/i);
  expect(await (await ready).evaluate(() => typeof self.postMessage)).toBe("function");
});


test("satellite replaces terrain and missing Google configuration keeps the selected base", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Imagery layers/ }).click();
  const terrain = page.getByRole("checkbox", { name: /^3D Terrain/ });
  const esri = page.getByRole("checkbox", { name: /^Satellite \(Esri HD\)/ });
  await expect(terrain).toBeChecked();
  await esri.click();
  await expect(esri).toBeChecked();
  await expect(terrain).not.toBeChecked();
  const google = page.getByRole("checkbox", { name: /^Satellite \(Google HD\)/ });
  test.skip(!(await google.textContent())?.includes("needs key"), "This fallback contract requires a build without a Google key");
  await expect(google).toContainText("needs key");
  await google.click();
  await expect(google).not.toBeChecked();
  await expect(esri).toBeChecked();
  await expect(page.getByText("Google imagery unavailable — no Google Maps key configured. Current map kept; use Satellite (Esri HD).", { exact: true })).toBeVisible();
});
