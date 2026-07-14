import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Chonburi Town Center smoke tests.
 *
 * Spawns its own Vite dev server on a non-default port so a developer running
 * `pnpm dev` in another terminal isn't interrupted. The backend API at :8788
 * is reused if it's running — the smoke tests don't assert specific API data,
 * only that the UI renders, panels mount, and critical controls behave.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,        // single dev server, avoid map-render contention
  forbidOnly: !!process.env.CI,
  // CI runners are 2–3× slower than local macs and the upstream HII
  // / Open-Meteo / WRF feeds the ledger depends on can be intermittently
  // slow on cold-cache first hits. 2 retries absorbs that without masking
  // genuine regressions (any test that needs 3 attempts is genuinely broken).
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:5179",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    video: "off",               // keeps test-results/ small; traces provide all debug info
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: "pnpm dev --port 5179 --strictPort",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    // CI cold-cache + first Vite compile of the map + lazy chunks can take
    // 60–120s on a fresh runner; 180s gives the boot room without hiding a
    // real hang.
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
