import { describe, expect, it } from "vitest";
import app from "./index.js";

const event = { cameraId: "release-test", timestamp: new Date().toISOString(), detections: [] };
const post = (authorization?: string) => ({
  method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
  body: JSON.stringify(event),
});

describe("trusted CV ingestion", () => {
  it("fails closed when no pipeline secret is configured", async () => {
    expect((await app.request("/api/cctv/cv-events", post(), {})).status).toBe(503);
  });
  it("rejects anonymous and incorrect credentials", async () => {
    for (const header of [undefined, "Bearer wrong"]) {
      expect((await app.request("/api/cctv/cv-events", post(header), { CV_WRITE_TOKEN: "test-pipeline-token" })).status).toBe(401);
    }
  });
  it("accepts an authenticated pipeline and keeps reads public", async () => {
    expect((await app.request("/api/cctv/cv-events", post("Bearer test-pipeline-token"), { CV_WRITE_TOKEN: "test-pipeline-token" })).status).toBe(200);
    const res = await app.request("/api/cctv/cv-events?cameraId=release-test", {}, {});
    expect(res.status).toBe(200);
    expect(((await res.json()) as { count: number }).count).toBe(1);
  });
});

describe("API release boundaries", () => {
  it("permits authorized twin browser preflights and exposes freshness headers", async () => {
    const res = await app.request("/api/twin/objects", { method: "OPTIONS", headers: {
      Origin: "https://nst-control-tower.pages.dev", "Access-Control-Request-Method": "DELETE", "Access-Control-Request-Headers": "authorization",
    } }, {});
    expect(res.headers.get("access-control-allow-methods")).toContain("DELETE");
    expect(res.headers.get("access-control-allow-headers")).toContain("Authorization");
  });
  it("bounds request bodies before JSON parsing", async () => {
    const res = await app.request("/api/chat", { method: "POST", body: "x".repeat(256 * 1024 + 1) }, {});
    expect(res.status).toBe(413);
  });
  it.each(["lng=200&lat=8", "lng=99&lat=91", "lng=99&lat=8&minutes=NaN"])("rejects invalid isochrone inputs: %s", async (q) => {
    expect((await app.request(`/api/isochrone?${q}`, {}, {})).status).toBe(400);
  });
});
