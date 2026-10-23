import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./adapters/thaiwater.js", () => ({fetchWaterGauges: vi.fn(), fetchRainfall: vi.fn()}));
vi.mock("./adapters/dwrEws.js", () => ({fetchEwsStations: vi.fn()}));
import app from "./index.js";
import { fetchWaterGauges, fetchRainfall } from "./adapters/thaiwater.js";
import { fetchEwsStations } from "./adapters/dwrEws.js";
const stamp = new Date().toISOString();
const meta = {source:"test", fetchedAt:stamp, ageMinutes:0, fallbackTier:"live" as const};
afterEach(() => {vi.resetAllMocks(); vi.useRealTimers();});
describe("readiness differs from liveness", () => {
  it("returns 503 for missing feeds while process liveness remains 200", async () => {
    vi.mocked(fetchWaterGauges).mockResolvedValue({features:[],meta});
    vi.mocked(fetchRainfall).mockResolvedValue({features:[],meta});
    vi.mocked(fetchEwsStations).mockRejectedValue(new Error("source failed"));
    const response = await app.request("/api/health/flood-readiness", {}, {ENVIRONMENT:"test"});
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json() as {available:boolean;feeds:{water:{usableRecent:number};ews:{available:boolean}}};
    expect(body.available).toBe(false); expect(body.feeds.water.usableRecent).toBe(0); expect(body.feeds.ews.available).toBe(false);
    expect((await app.request("/api/health", {}, {ENVIRONMENT:"test"})).status).toBe(200);
  });
  it("bounds an unresponsive source and reports unavailability", async () => {
    vi.useFakeTimers();
    vi.mocked(fetchWaterGauges).mockImplementation(() => new Promise(() => {}));
    vi.mocked(fetchRainfall).mockResolvedValue({features:[],meta});
    vi.mocked(fetchEwsStations).mockResolvedValue({features:[],meta});
    const response = app.request("/api/health/flood-readiness", {}, {ENVIRONMENT:"test"});
    await vi.advanceTimersByTimeAsync(22_001);
    expect((await response).status).toBe(503);
  });
});
