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

test("lens selection stays compact and leaves layer controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  const selector = page.getByRole("combobox", { name: "Lens", exact: true });
  await selector.selectOption({ label: "Environment" });
  await expect(selector).toHaveValue("environment");
  const bounds = await selector.evaluate(el => {
    const r = el.getBoundingClientRect();
    const host = el.closest(".right-layers")!.getBoundingClientRect();
    const layers = Array.from(el.closest(".col")!.querySelectorAll("h2")).find(x => x.textContent === "Layers")!.getBoundingClientRect();
    return { height: r.height, bottom: layers.bottom, hostBottom: host.bottom };
  });
  expect(bounds.height).toBeLessThan(60);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.hostBottom);
});
