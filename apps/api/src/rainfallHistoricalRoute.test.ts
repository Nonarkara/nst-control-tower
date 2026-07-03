import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

/**
 * /api/rainfall/historical, /api/google/air-quality, /api/streetview/meta —
 * lat/lng range-validation tests.
 *
 * These routes parse ?lat=&lng= with parseFloat + Number.isFinite only, which
 * accepts out-of-range values like lat=999. That let obviously-garbage input
 * reach the upstream fetch (Open-Meteo archive, or billed Google Maps
 * Platform APIs) before failing. isValidLatLng (lib/bbox.ts) now rejects
 * out-of-range coordinates with a 400 before the adapter is ever called.
 */

describe("/api/rainfall/historical lat/lng validation", () => {
  it("returns 400 for out-of-range lat/lng instead of hitting the upstream API", async () => {
    const res = await app.request("/api/rainfall/historical?lat=999&lng=999", {}, {});
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/lat.*-90.*90|lng.*-180.*180/i);
  });

  it("returns 400 when only lng is out of range", async () => {
    const res = await app.request("/api/rainfall/historical?lat=8.44&lng=999", {}, {});
    expect(res.status).toBe(400);
  });

  it("returns 400 when only lat is out of range", async () => {
    const res = await app.request("/api/rainfall/historical?lat=999&lng=99.93", {}, {});
    expect(res.status).toBe(400);
  });

  it("does not 400 when lat/lng are omitted (defaults apply)", async () => {
    // Valid coordinates fall through to the real adapter, which hits the network —
    // stub fetch so this stays a validation test, not a live upstream integration test.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ daily: null }), { status: 200 }),
    );
    const res = await app.request("/api/rainfall/historical", {}, {});
    expect(res.status).not.toBe(400);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe("/api/google/air-quality lat/lng validation", () => {
  it("returns 400 for out-of-range lat/lng before calling Google (billed API)", async () => {
    const res = await app.request("/api/google/air-quality?lat=999&lng=999", {}, {});
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/lat.*-90.*90|lng.*-180.*180/i);
  });
});

describe("/api/streetview/meta lat/lng validation", () => {
  it("returns 400 for out-of-range lat/lng before calling Google (billed API)", async () => {
    const res = await app.request("/api/streetview/meta?lat=999&lng=999", {}, {});
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/lat.*-90.*90|lng.*-180.*180/i);
  });
});
