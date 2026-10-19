import { test, expect } from "./fixtures";

test("tablet landmark search remains clear of map action buttons", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
  const search = page.locator(".building-search");
  await expect(search).toBeVisible();
  const overlaps = await search.evaluate((element) => {
    const input = element.getBoundingClientRect();
    return Array.from(document.querySelectorAll(".map-overlay-actions button")).filter((button) => {
      const r = button.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left < input.right && r.right > input.left && r.top < input.bottom && r.bottom > input.top;
    }).map((button) => button.textContent);
  });
  expect(overlaps).toEqual([]);
});

test("the Environment lens label fits a single line", async ({ page }) => {
  await page.goto("/");
  const label = page.locator(".lens__label").filter({ hasText: /^Environment$/i });
  await expect(label).toBeVisible({ timeout: 20_000 });
  const metrics = await label.evaluate((element) => {
    const style = getComputedStyle(element);
    return { height: element.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight) };
  });
  expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight + 1);
});
