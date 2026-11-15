import { test, expect } from "./fixtures";
import { ensureSectionOpen } from "./floodSmokeHelpers";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
test.describe.configure({ timeout: 90_000 });
for (const width of [1440, 1024, 390]) {
  test(`water-camera image comparison is explicit and local at${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.addInitScript(() => {
      // A decoded, two-tone fixture frames the reference workflow without
      // opening a municipal stream or implying a calibrated measurement.
      class FixturePeer extends EventTarget {
        iceGatheringState = "complete";
        localDescription = { sdp: "fixture" };
        private stream?: MediaStream;
        addTransceiver() {}
        async createOffer() { return this.localDescription; }
        async setLocalDescription() {}
        async setRemoteDescription() {
          const canvas = document.createElement("canvas");
          canvas.width = 160;
          canvas.height = 100;
          const ctx = canvas.getContext("2d")!;
          this.stream = canvas.captureStream();
          ctx.fillStyle = "#aaaaaa";
          ctx.fillRect(0, 0, 160, 60);
          ctx.fillStyle = "#393939";
          ctx.fillRect(0, 60, 160, 40);
          const event = new Event("track");
          Object.defineProperty(event, "streams", { value: [this.stream] });
          this.dispatchEvent(event);
        }
        close() { this.stream?.getTracks().forEach(track => track.stop()); }
      }
      Object.defineProperty(window, "RTCPeerConnection", { value: FixturePeer });
    });
    await page.clock.setFixedTime(new Date("2026-10-21T20:00:00+07:00"));
    await page.route("**/api/cctv?**", r => r.fulfill({ json: { features: [{ id: "wl-fixture", sourceId: "WLTEST", name: "Canal camera test", lat: 8.411, lng: 99.966, category: "water", status: "online", embedUrl: "https://camera.example.test/wl/" }], meta: { source: "fixture", fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "live" } } }));
    await page.route("https://camera.example.test/**", r => r.fulfill({ body: "Test camera source", headers: { "Access-Control-Allow-Origin": "*" } }));
    await page.goto("/");
    if (width <= 1100) await page.getByRole("tab", { name: /^LAYERS/ }).click();
    await ensureSectionOpen(page, "CCTV");
    await page.getByRole("region", { name: "CCTV cameras" }).getByRole("button", { name: /Canal camera test/ }).click();
    const dialog = page.getByRole("dialog", { name: "Canal camera test" });
    await dialog.getByRole("button", { name: "Compare water images · CV" }).click();
    await expect(dialog.locator("iframe")).toHaveCount(0);
    const watch = dialog.getByRole("region", { name: "ตรวจภาพน้ำจากกล้อง" });
    await expect(watch.getByRole("status")).toContainText("หยุดตรวจภาพ");
    await expect(watch.getByRole("button", { name: "เปิดรับภาพและ CV เฉพาะกล้องนี้" })).toBeVisible();
    await expect(watch.locator("select")).toHaveCount(0);
    const showOnMap = watch.getByRole("button", { name: /Watch on map/ });
    await expect(showOnMap).toBeDisabled();
    await watch.getByRole("button", { name: "เปิดรับภาพและ CV เฉพาะกล้องนี้" }).click();
    await watch.getByRole("button", { name: /เลือกจุดอ้างอิงขอบน้ำในภาพ/ }).press("Enter");
    await expect(watch.getByRole("status")).toContainText("บันทึกภาพอ้างอิงแล้ว");
    await showOnMap.click();
    await expect(dialog).toBeHidden();
    const marker = page.getByRole("button", { name: /Canal camera test: CV reference set.*20:00 ICT/ });
    await expect(marker).toBeVisible();
    if (process.env.NST_DESK_ARTIFACT_DIR) {
      await page.screenshot({ path: resolve(process.env.NST_DESK_ARTIFACT_DIR, `camera-watch-map-${width}.png`) });
    }
    await marker.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(watch.getByRole("status")).toContainText("บันทึกภาพอ้างอิงแล้ว");
    await page.clock.setFixedTime(new Date("2026-10-21T20:01:45+07:00"));
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(watch.getByRole("status")).toContainText("ภาพเก่า");
    await dialog.getByRole("button", { name: /Close/ }).click();
    await expect(marker).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.BUILDING_SCREENSHOTS) {
      const dir = resolve("../../var/hero-temple-2026-10-21"); mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: `${dir}/camera-watch-${width}.png` });
    }
  });
}
