import { test, expect } from "./fixtures";
import { selectLens, stubHiiSurvey, openMore } from "./floodSmokeHelpers";

/**
 * Smoke tests — these are the contracts that, if broken, mean a council
 * briefing fails. Each test is independent and runs against a fresh page.
 *
 * Philosophy: assert structure + behaviour, never assert specific live data
 * values (those depend on upstream APIs / env keys we don't control here).
 *
 * Selector strategy: prefer aria-label exact matches and text content. The
 * dashboard is map-heavy so we give it generous timeouts.
 */

// 90s per test — map + lazy chunks + Vite dev server compile time add up.
// Individual tests pass in ~12–40s; the 60s default flakes once Vite cache warms.
test.setTimeout(90_000);

test.describe("Dashboard boot", () => {
  test("loads with map host and top bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    // The header's FLOOD WATCH link is the proof the React tree mounted.
    await expect(page.getByRole("link", { name: "Open flood operations briefing" })).toBeVisible();
  });

  test("does not throw uncaught page errors during initial load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    // Give async chunks + map a beat to finish
    await page.waitForTimeout(2_000);
    await expect(page.locator(".map-host")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard encountered an error" })).toHaveCount(0);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("Lens switching", () => {
  test("Forecast and Flood lens selection updates the map view", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    const selector = page.getByRole("combobox", { name: "Advanced map views", exact: true });
    await selectLens(page, "Forecast");
    await expect(selector).toHaveValue("intelligence");
    await selectLens(page, "Flood");
    await expect(selector).toHaveValue("flood");
  });
});

test.describe("Source catalog modal", () => {
  test("opens on SOURCES click and closes via ESC", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await openMore(page);
    const sourcesBtn = page.getByRole("button", { name: "Open source catalog" });
    await sourcesBtn.focus();
    await sourcesBtn.click();

    const dialog = page.getByRole("dialog", { name: /SOURCES/i });
    // SourceCatalog is lazy-loaded — give the chunk time to arrive on first open.
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    // Catalog row count summary is always rendered (even if /api/health hasn't returned)
    await expect(dialog.getByText(/DATA PIPELINES/i)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });
});

test.describe("Layer palette — count badge suppression", () => {
  test("Distance grid layer toggle does NOT show a numeric count badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Layer toggles have role="checkbox". Distance grid lives in the "municipality"
    // group, which is open by default. Expand it explicitly in case a prior preset collapsed it.
    const muniHead = page.getByRole("button", { name: /Municipality layers/i });
    if (await muniHead.getAttribute("aria-expanded") === "false") await muniHead.click();

    const dgRow = page.getByRole("checkbox").filter({ hasText: /Distance grid/i }).first();
    await expect(dgRow).toBeVisible({ timeout: 10_000 });

    // The row must NOT contain the .layer-count element — that's the contract we just shipped.
    const badgeCount = await dgRow.locator(".layer-count").count();
    expect(badgeCount).toBe(0);
  });
});

test.describe("EAR lens — Earth obs panel header", () => {
  test("EarthAlphaBrief PanelHeader eyebrow is visible in the sidebar", async ({ page }) => {
    // EAR's default layer set includes waterway-flow same as FLOOD — the real
    // 1.9 MB waterways extract pegs the GPU/main-thread in headless CI (see
    // floodSmokeHelpers.stubHiiSurvey), so stub it before the lens switch.
    await stubHiiSurvey(page);
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Rail sections are lens-driven (lib/railSections.ts) — open the lens that owns this panel.
    await selectLens(page, "Satellite");

    // EarthAlphaBrief lives in the EAR (and ENV) lens rail.
    // PanelHeader renders "EARTH OBS · NASA GIBS + GISTDA" immediately on mount.
    await expect(page.getByText(/EARTH OBS/i).first()).toBeVisible({ timeout: 15_000 });
    // SHEETS status badge is rendered as the actions prop — always visible
    await expect(page.getByText(/SHEETS/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("EXEC lens — executive briefing header", () => {
  test("ExecutiveBriefing PanelHeader eyebrow is visible in EXEC lens", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await selectLens(page, "Executive");
    await expect(page.getByRole("combobox", { name: "Advanced map views", exact: true })).toHaveValue("executive");

    // ExecutiveBriefing renders "EXECUTIVE BRIEF" as its PanelHeader title
    await expect(page.getByText(/EXECUTIVE BRIEF/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Source catalog — filter buttons", () => {
  test("LIVE filter narrows the catalog to live-status entries only", async ({ page }) => {
    // The SourceCatalog is lazy-loaded — give it more time than the default 60s.
    test.setTimeout(90_000);

    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Open the catalog — focus before click so the lazy-loaded chunk has time to start
    await openMore(page);
    const sourcesBtn = page.getByRole("button", { name: "Open source catalog" });
    await sourcesBtn.focus();
    await sourcesBtn.click();
    const dialog = page.getByRole("dialog", { name: /SOURCES/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Click the LIVE filter — the button's accessible name IS "LIVE" (text content)
    const liveFilter = dialog.locator("button", { hasText: /^LIVE$/ });
    await liveFilter.click();
    await expect(liveFilter).toHaveAttribute("aria-pressed", "true");

    // Verify filtered view: at least one live entry is visible and its meta reads LIVE.
    // We don't iterate all rows (race-prone with React re-render timing).
    const rows = dialog.locator(".sources-list .row-btn__meta");
    await expect(rows.first()).toBeVisible({ timeout: 5_000 });
    await expect(rows.first()).toContainText("LIVE");
  });
});

test.describe("ChatBox — open / close", () => {
  test("Ask CTM button opens chat panel; ESC closes it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    // Chat handle must be visible before opening
    const handle = page.getByRole("button", { name: /Open concierge chat/i });
    await expect(handle).toBeVisible({ timeout: 10_000 });
    await handle.click();

    // Dialog opens — named by its visible heading (aria-labelledby)
    const chat = page.getByRole("dialog", { name: /Ask anything about Nakhon Si Thammarat/i });
    await expect(chat).toBeVisible({ timeout: 5_000 });

    // Input field and clear button must be present
    await expect(chat.getByRole("textbox")).toBeVisible();

    // ESC closes the panel
    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden({ timeout: 5_000 });
  });
});

test.describe("ChatBox — emergency escalation", () => {
  test("a rescue-now message shows tap-to-call 1784 and 1669 before any reply", async ({ page }) => {
    // Hold the model reply so the test proves the numbers do not wait on it.
    await page.route("**/api/chat", () => { /* never fulfilled */ });
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /Open concierge chat/i }).click();
    const chat = page.getByRole("dialog", { name: /Ask anything about Nakhon Si Thammarat/i });
    await chat.getByRole("textbox", { name: "Your message" }).fill("ยายติดเตียง น้ำเข้าบ้านแล้ว");
    await chat.getByRole("textbox", { name: "Your message" }).press("Enter");

    const numbers = chat.getByRole("group", { name: "Emergency numbers" });
    await expect(numbers).toBeVisible({ timeout: 5_000 });
    await expect(numbers.getByRole("link", { name: /1784/ })).toHaveAttribute("href", "tel:1784");
    await expect(numbers.getByRole("link", { name: /1669/ })).toHaveAttribute("href", "tel:1669");
  });
});

test.describe("WHO TO MOVE FIRST — coverage honesty", () => {
  const offline = JSON.stringify({
    features: [],
    meta: { source: "thaiwater-waterlevel", fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "unavailable", note: "test" },
  });

  test("no 'offline' alarm while the gauge feed is still loading", async ({ page }) => {
    await page.route("**/api/water/gauges*", () => { /* hold: still loading */ });
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    const panel = page.getByRole("region", { name: "Who to move first" });
    await expect(panel.getByText(/Watching now: … river gauges/)).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByText(/River gauges are offline/)).toHaveCount(0);
  });

  test("gauge feed answers with zero stations → says the list is blind", async ({ page }) => {
    await page.route("**/api/water/gauges*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: offline }));
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    const panel = page.getByRole("region", { name: "Who to move first" });
    await expect(panel.getByText(/Watching now: 0 river gauges/)).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByRole("alert")).toContainText(/River gauges are offline/);
  });
});

test.describe("Phone — first screen", () => {
  test("opens on the Brief (the answer), not an empty map", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Right now" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("region", { name: "What the cameras see" })).toBeVisible();
  });

  test("header stays one slim row at laptop width", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    const h = await page.locator(".topbar").evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThan(85); // one row is ~73px; a wrapped bar is ~101px and steals the map
  });
});

/**
 * The header's width budget.
 *
 * The bar had no budget: its content set changed with the viewport width AND
 * with the length of its own longest strings, so it wrapped on the day the
 * feeds went stale and stole a fifth of the map. The desk button then took
 * 64px out of a slack that was already 35px and broke it at 1366.
 *
 * These tests pin the repair: one row at every desktop width, the desk one
 * click away at every one of them, and the preferences that the bar drops
 * still reachable in the More menu.
 */
test.describe("Header — budget, one row, one click", () => {
  const DESKTOP_WIDTHS = [1101, 1200, 1366, 1440, 1536, 1600, 1920];

  test("the bar stays one row at every desktop width", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    for (const width of DESKTOP_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const m = await page.locator(".topbar").evaluate((el) => {
        const box = el.getBoundingClientRect();
        const spacer = el.querySelector(".topbar-spacer");
        return {
          h: Math.round(box.height),
          free: Math.round(spacer?.getBoundingClientRect().width ?? -1),
        };
      });
      // One row is 56px. A wrapped bar is 88–90px and pushes the map down.
      expect(m.h, `bar wrapped at ${width}px`).toBeLessThan(85);
      // The spacer is the bar's free space: it only has width if every
      // control fitted on the row.
      expect(m.free, `no room left at ${width}px`).toBeGreaterThan(40);
    }
  });

  test("the mayor's desk is one click away at every desktop width", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    for (const width of DESKTOP_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const desk = page.locator(".topbar-desk");
      await expect(desk, `desk button missing at ${width}px`).toBeVisible();
      await expect(desk).toHaveAttribute("href", "/mayor-desk");
    }
  });

  test("the desk is reachable from the More menu on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    await openMore(page);
    const entry = page.getByRole("button", { name: /mayor's desk/i });
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page).toHaveURL(/\/mayor-desk$/);
  });

  test("the display preferences stay reachable when the bar drops them", async ({ page }) => {
    // On a desktop they stay in the bar — they are one click there.
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Switch to Thai interface/ })).toBeVisible();

    // On the phone the bar has no room for them, so they move into the More
    // menu, which is where a phone keeps everything else.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await expect(page.locator(".topbar-settings")).toBeHidden();
    await openMore(page);
    await expect(page.getByRole("button", { name: /Switch to Thai interface/ })).toBeVisible();
  });
});

test.describe("Review fixes — phone and sticky mode", () => {
  test("Show on map actually takes a phone to the map", async ({ page }) => {
    const gauge = {
      id: "g1", name: "Pak Nakhon", lat: 8.43, lng: 100.0, levelMsl: 0.6, levelPrev: 0.5, warningMsl: null, criticalMsl: null,
      diffFromBank: -0.13, situationLevel: 4, trend: "rising", riverName: "Pak Nakhon", amphoe: "Mueang", observedAt: new Date().toISOString(),
      isKeyStation: false, stationCode: "PTTEP3", bankMsl: 0.73, fullnessPct: 82, dischargeCms: null, qmaxCms: null,
    };
    await page.route("**/api/water/gauges*", (r) => r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ features: [gauge], meta: { source: "t", fetchedAt: new Date().toISOString(), ageMinutes: 1, fallbackTier: "live" } }),
    }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const headline = page.getByRole("region", { name: "Right now" });
    await expect(headline).toBeVisible({ timeout: 20_000 });
    const show = headline.getByRole("button", { name: "Show on map" });
    await expect(show).toBeVisible({ timeout: 20_000 });
    await show.click();
    await expect(page.getByRole("region", { name: "Right now" })).toBeHidden({ timeout: 5_000 });
  });

  test("the flood briefing is one tap from the phone Brief", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Flood watch briefing/ })).toBeVisible({ timeout: 20_000 });
  });

  test("phone controls are at least 44 px tall", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Right now" })).toBeVisible({ timeout: 20_000 });
    const heights = await page.locator(".topbar .btn, .topbar button").evaluateAll((els) =>
      els.filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => el.getBoundingClientRect().height));
    // The phone header carries the identity, the trust label and the More
    // button — the display preferences live in the More menu, which is where
    // a phone keeps everything else. Two controls is the guard against a
    // vacuous pass; both must clear the 44px touch target.
    expect(heights.length).toBeGreaterThanOrEqual(2);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(43.5);
  });

  test("a remembered analyst-terminal choice never hijacks the next visit", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("nst:mode", "terminal"));
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
  });

  test("a dialog's title is not covered by the header on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Right now" })).toBeVisible({ timeout: 20_000 });
    await openMore(page);
    await page.getByRole("button", { name: /Open flood guide/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const covered = await dialog.getByRole("heading").first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + 8, r.top + r.height / 2);
      return !(hit && (el === hit || el.contains(hit) || hit.closest('[role="dialog"]')));
    });
    expect(covered).toBe(false);
  });
});

test.describe("First map view", () => {
  test("frames the city AND the worst gauge, so the first map shows water", async ({ page }) => {
    const gauge = {
      id: "g1", name: "Pak Nakhon", lat: 8.4304, lng: 100.0, levelMsl: 0.6, levelPrev: 0.5, warningMsl: null, criticalMsl: null,
      diffFromBank: -0.13, situationLevel: 4, trend: "rising", riverName: "Pak Nakhon", amphoe: "Mueang", observedAt: new Date().toISOString(),
      isKeyStation: false, stationCode: "PTTEP3", bankMsl: 0.73, fullnessPct: 97, dischargeCms: null, qmaxCms: null,
    };
    await page.route("**/api/water/gauges*", (r) => r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ features: [gauge], meta: { source: "t", fetchedAt: new Date().toISOString(), ageMinutes: 1, fallbackTier: "live" } }),
    }));
    await page.goto("/");
    await expect(page.locator(".map-host")).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mapCam?: { longitude: number } }).__mapCam?.longitude), { timeout: 20_000 })
      .toBeGreaterThan(99.97); // moved east of City Hall (99.963) toward the gauge (100.0)
    const cam = await page.evaluate(() => (window as unknown as { __mapCam: { longitude: number } }).__mapCam);
    expect(cam.longitude).toBeLessThan(100.0);
  });
});

test.describe("Headline language", () => {
  const stub = async (page: import("@playwright/test").Page) => {
    const gauge = {
      id: "g1", name: "Pak Nakhon", lat: 8.4304, lng: 100.0, levelMsl: 0.6, levelPrev: 0.5, warningMsl: null, criticalMsl: null,
      diffFromBank: -0.13, situationLevel: 4, trend: "rising", riverName: "", amphoe: "Mueang", observedAt: new Date().toISOString(),
      isKeyStation: false, stationCode: "PTTEP3", bankMsl: 0.73, fullnessPct: 97, dischargeCms: null, qmaxCms: null,
    };
    await page.route("**/api/water/gauges*", (r) => r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ features: [gauge], meta: { source: "t", fetchedAt: new Date().toISOString(), ageMinutes: 1, fallbackTier: "live" } }),
    }));
  };

  test("the TH toggle turns the whole headline card Thai", async ({ page }) => {
    await stub(page);
    await page.goto("/");
    const card = page.getByRole("region", { name: "Right now" });
    await expect(card).toContainText("water is 97% of the way", { timeout: 20_000 });
    await page.getByRole("button", { name: /Switch to Thai/ }).click();
    await expect(card).toContainText("น้ำอยู่ที่ 97% ของระดับตลิ่ง");
    await expect(card).toContainText("สิ่งที่ควรทำ");
    await expect(card).not.toContainText("Suggested action");
  });

  test("a Thai browser opens in Thai without touching the toggle", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "th-TH" });
    const page = await ctx.newPage();
    await stub(page);
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Right now" })).toContainText("สิ่งที่ควรทำ", { timeout: 20_000 });
    await ctx.close();
  });
});
