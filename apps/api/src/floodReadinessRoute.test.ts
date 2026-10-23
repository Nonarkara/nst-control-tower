import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./adapters/thaiwater.js", () => ({fetchWaterGauges: vi.fn(), fetchRainfall: vi.fn(), probeWaterGauges: vi.fn(), probeRainfall: vi.fn()}));
vi.mock("./adapters/dwrEws.js", () => ({fetchEwsStations: vi.fn(), probeEwsStations: vi.fn()}));
import app from "./index.js";
import { fetchWaterGauges, fetchRainfall, probeWaterGauges, probeRainfall } from "./adapters/thaiwater.js";
import { fetchEwsStations, probeEwsStations } from "./adapters/dwrEws.js";
const stamp = new Date().toISOString();
const meta = {source:"test", fetchedAt:stamp, ageMinutes:0, fallbackTier:"live" as const};
afterEach(() => {vi.resetAllMocks(); vi.useRealTimers();});
describe("readiness differs from liveness", () => {
  it("returns 503 for missing feeds while process liveness remains 200", async () => {
    vi.mocked(probeWaterGauges).mockResolvedValue({features:[],meta});
    vi.mocked(probeRainfall).mockResolvedValue({features:[],meta});
    vi.mocked(probeEwsStations).mockRejectedValue(new Error("source failed"));
    const response = await app.request("/api/health/flood-readiness", {}, {ENVIRONMENT:"test"});
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json() as {available:boolean;feeds:{water:{usableRecent:number};ews:{available:boolean;error?:string}}};
    expect(body.available).toBe(false); expect(body.feeds.water.usableRecent).toBe(0); expect(body.feeds.ews.available).toBe(false);
    expect((await app.request("/api/health", {}, {ENVIRONMENT:"test"})).status).toBe(200);
  });
  it("bounds an unresponsive source and reports unavailability", async () => {
    vi.useFakeTimers();
    vi.mocked(probeWaterGauges).mockImplementation(() => new Promise(() => {}));
    vi.mocked(probeRainfall).mockResolvedValue({features:[],meta});
    vi.mocked(probeEwsStations).mockResolvedValue({features:[],meta});
    const response = app.request("/api/health/flood-readiness", {}, {ENVIRONMENT:"test"});
    await vi.advanceTimersByTimeAsync(22_001);
    expect((await response).status).toBe(503);
  });
  it("the readiness probe asks the ORIGIN, not the cached read path", async () => {
    // The verdict must not depend on whether a background cache refresh had
    // landed. That is why the route calls the probe functions rather than
    // the ordinary cached reads.
    vi.mocked(probeWaterGauges).mockResolvedValue({features:[],meta});
    vi.mocked(probeRainfall).mockResolvedValue({features:[],meta});
    vi.mocked(probeEwsStations).mockResolvedValue({features:[],meta});
    await app.request("/api/health/flood-readiness", {}, {ENVIRONMENT:"test"});
    expect(probeWaterGauges).toHaveBeenCalled();
    expect(probeRainfall).toHaveBeenCalled();
    expect(probeEwsStations).toHaveBeenCalled();
    expect(fetchWaterGauges).not.toHaveBeenCalled();
    expect(fetchRainfall).not.toHaveBeenCalled();
    expect(fetchEwsStations).not.toHaveBeenCalled();
  });
  it("a failed probe says why, not just that it failed", async () => {
    vi.mocked(probeWaterGauges).mockRejectedValue(new Error("relay origin unavailable"));
    vi.mocked(probeRainfall).mockResolvedValue({features:[],meta});
    vi.mocked(probeEwsStations).mockResolvedValue({features:[],meta});
    const response = await app.request("/api/health/flood-readiness", {}, {ENVIRONMENT:"test"});
    expect(response.status).toBe(503);
    const body = await response.json() as {feeds:{water:{error?:string}}};
    expect(body.feeds.water.error).toContain("relay origin unavailable");
  });
});
