import { test, expect } from "@playwright/test";

/**
 * /data — open-data workbench smoke. Asserts structure and behaviour only;
 * counts come from the static JSON in public/data/workbench and may change
 * whenever scripts/prep_workbench.py is re-run.
 */

test.setTimeout(60_000);

test("open-data workbench: hero, stats, filter, open a table", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/data");

  await expect(page.getByRole("heading", { level: 1, name: "ข้อมูลทุกชุดต้องค้นได้ ตรวจสอบได้ และพร้อมใช้ต่อ" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: /แผนที่/ })).toHaveAttribute("href", "/");

  // Stat grid
  await expect(page.getByText("Machine-readable tables")).toBeVisible();
  await expect(page.getByText("Failed to read")).toBeVisible();

  // Filter: "has coordinates" chip toggles and every card left carries the COORDINATES badge
  const coords = page.getByRole("button", { name: /^มีพิกัด Has coordinates/ });
  await coords.click();
  await expect(coords).toHaveAttribute("aria-pressed", "true");
  const cards = page.locator(".dwb-cards > li");
  await expect(cards.first()).toBeVisible();
  const n = await cards.count();
  await expect(page.locator(".dwb-cards > li", { hasText: "COORDINATES" })).toHaveCount(n);

  // Open the first table
  await cards.first().getByRole("button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("table")).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByRole("button", { name: /ดาวน์โหลด CSV/ })).toBeEnabled();
  await expect(dialog.getByRole("link", { name: /data\.go\.th/ })).toHaveAttribute("href", /data\.go\.th\/dataset\//);

  // Sort by the first column
  const firstHeader = dialog.getByRole("columnheader").first();
  await firstHeader.getByRole("button").click();
  await expect(firstHeader).toHaveAttribute("aria-sort", "ascending");

  // CSV download
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: /ดาวน์โหลด CSV/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^nst-.+\.csv$/);

  // Close, then the ledger tab lists every dataset
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: /Full source ledger/ }).click();
  await expect(page.locator(".dwb-ledger-item").first()).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});
