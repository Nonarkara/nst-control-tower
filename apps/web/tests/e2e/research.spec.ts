import { test, expect } from "./fixtures";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

for (const width of [390, 1024, 1440]) test(`research entry, evidence, PDF and citation controls at ${width}px`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  if (width < 1101) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page.getByRole("button", { name: /research paper about this system/ })).toBeVisible();
  } else await expect(page.getByRole("link", { name: /research paper about this system/ })).toBeVisible();
  const chrome = await page.locator('.topbar').boundingBox();
  expect(chrome!.height).toBeLessThanOrEqual(60);
  await shot('header');
  if (width < 1101) await page.getByRole("button", { name: /research paper about this system/ }).click();
  else await page.getByRole("link", { name: /research paper about this system/ }).click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The Last Mile Is Institutional", { timeout: 30_000 });
  const download = page.getByRole("link", { name: /Download PDF/ });
  await expect(download).toBeInViewport();
  await expect(download).toHaveAttribute("download", "");
  const res = await page.request.get((await download.getAttribute("href"))!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("pdf");
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
  const viewer = page.locator(".research-viewer");
  if (width <= 900) await expect(viewer).toBeHidden();
  else {
    await expect(viewer.locator('iframe')).toBeVisible();
    await expect(page.frameLocator('.research-viewer iframe').getByRole('heading', { level: 1 })).toContainText('The Last Mile Is Institutional');
  }
  const geometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, headerHeight: document.querySelector('.research-head')!.getBoundingClientRect().height }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
  expect(geometry.headerHeight).toBeLessThanOrEqual(50);
  await shot('page', geometry);
  const citation = page.getByRole('button', { name: 'Copy citation', exact: true });
  await citation.press('Tab'); // focus target is visible, including after scrolling to citation
  await expect(page.getByRole('button', { name: 'Copy BibTeX', exact: true })).toBeFocused();
  await shot('citation-focus');
  await citation.click();
  await expect(page.getByRole('status')).toContainText(/Citation copied|Could not copy/);
  await expect(page.getByRole('link', { name: 'Evidence summary and source hashes ↗' })).toHaveAttribute('href', '/research/evidence-v1.json');
  await page.goto('/research/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The Last Mile Is Institutional');

  async function shot(state: string, geometry?: unknown) {
    const dir = process.env.NST_DESK_ARTIFACT_DIR;
    if (!dir) return;
    mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, `research-${state}-${width}.png`) });
    if (geometry) writeFileSync(path.join(dir, `research-${state}-${width}.json`), JSON.stringify(geometry, null, 2));
  }
});
