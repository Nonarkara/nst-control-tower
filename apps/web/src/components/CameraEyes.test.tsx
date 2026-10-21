import { describe, test, expect, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { CameraEyes } from "./CameraEyes";
import { __resetEyes } from "../lib/cameraEyes";

afterEach(() => { vi.useRealTimers(); __resetEyes(); });

describe("CameraEyes", () => {
  test("at night, says so once — not two identical rows", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T20:00:00+07:00"));
    const html = renderToString(<CameraEyes pm25={null} />);
    expect(html).toContain("runs in daylight only");
    expect(html.match(/daylight only/g)).toHaveLength(1);
    expect(html).not.toContain("Flood<");
  });

  test("by day, before the first sweep: shows both rows as 'checking', never a fake reading", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T10:00:00+07:00"));
    const html = renderToString(<CameraEyes pm25={20} />);
    expect(html.match(/Checking the cameras/g)).toHaveLength(2);
    expect(html).toContain("not an official reading");
  });
});

test("no image-change flags cannot produce a green water all-clear", async () => {
  const { recordSweep } = await import("../lib/gaugeWatch");
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-21T10:00:00+07:00"));
  recordSweep([{ outcome: { status: "read", decision: { confidence: .8 } } as never, previewed: false }]);
  const html = renderToString(<CameraEyes pm25={null} />);
  expect(html).not.toContain("water not rising");
  expect(html).toContain("No confirmed water trend");
  vi.setSystemTime(new Date("2026-10-21T10:16:00+07:00"));
  expect(renderToString(<CameraEyes pm25={null} />)).toContain("stale or paused");
});
