import { describe, it, expect } from "vitest";
import { validateCvEvent, recordCvEvent, getLatestByCameraId, cvEventStats, listCvEvents } from "./cvEvents.js";

const event = (cameraId: string, timestamp = new Date().toISOString()) => ({ cameraId, timestamp, counts: { "water-rising": 1 }, detections: [{ class: "water-rising", confidence: 0.8 }] });

describe("CV event integrity", () => {
  it.each([null, 3, {}, { class: "water-rising", confidence: 2 }])("rejects malformed detections: %j", (d) => {
    expect(() => validateCvEvent({ ...event("camera"), detections: [d] })).toThrow();
  });
  it("does not let out-of-order arrivals hide newer measurements", () => {
    recordCvEvent(event("out-of-order", "2026-10-15T12:00:00Z"));
    recordCvEvent(event("out-of-order", "2026-10-15T10:00:00Z"));
    expect(listCvEvents({ cameraId: "out-of-order", since: "2026-10-15T11:00:00Z" })).toHaveLength(1);
  });
  it("bounds the camera index together with the event ring", () => {
    for (let i = 0; i < 2001; i++) recordCvEvent(event(`bounded-${i}`));
    expect(cvEventStats().totalEvents).toBe(2000);
    expect(cvEventStats().activeCameras).toBeLessThanOrEqual(2000);
    expect(getLatestByCameraId("bounded-0")).toBeUndefined();
    expect(getLatestByCameraId("bounded-2000")).toBeDefined();
  });
});
