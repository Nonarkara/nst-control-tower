import { describe, it, expect } from "vitest";
import {
  adapterStatus,
  alertLevelStatus,
  aqiStatus,
  delayStatus,
  dischargeStatus,
  floodWatchStatus,
  gaugeStatus,
  initiativeStatus,
  insightStatus,
  loadStatus,
  seriesSummary,
  statusStyle,
} from "./cityStatus";

describe("aqiStatus", () => {
  it("maps US AQI band edges onto the status vocabulary", () => {
    expect(aqiStatus(50)).toBe("normal");
    expect(aqiStatus(51)).toBe("watch");
    expect(aqiStatus(100)).toBe("watch");
    expect(aqiStatus(101)).toBe("warning");
    expect(aqiStatus(150)).toBe("warning");
    expect(aqiStatus(151)).toBe("critical");
  });
  it("returns unknown for missing readings", () => {
    expect(aqiStatus(null)).toBe("unknown");
    expect(aqiStatus(Number.NaN)).toBe("unknown");
  });
});

describe("domain scale mappings", () => {
  it("keeps warning distinct from critical for executive alerts", () => {
    expect(alertLevelStatus("warning")).toBe("warning");
    expect(alertLevelStatus("critical")).toBe("critical");
    expect(alertLevelStatus("info")).toBe("unknown");
  });
  it("maps flood watch bands so watch is not an informational blue", () => {
    expect(floodWatchStatus("watch")).toBe("watch");
    expect(floodWatchStatus("elevated")).toBe("warning");
    expect(floodWatchStatus("high")).toBe("critical");
  });
  it("maps gauge warning to warning, not watch", () => {
    expect(gaugeStatus("warning")).toBe("warning");
    expect(gaugeStatus("flood")).toBe("critical");
  });
  it("maps discharge, initiative, adapter and insight scales", () => {
    expect(dischargeStatus("emergency")).toBe("critical");
    expect(dischargeStatus("unknown")).toBe("unknown");
    expect(initiativeStatus("delayed")).toBe("warning");
    expect(initiativeStatus("at-risk")).toBe("watch");
    expect(adapterStatus("down")).toBe("critical");
    expect(adapterStatus("degraded")).toBe("watch");
    expect(insightStatus("warn")).toBe("watch");
  });
  it("grades load shares and delays", () => {
    expect(loadStatus(0.95, 0.75, 0.9)).toBe("critical");
    expect(loadStatus(0.8, 0.75, 0.9)).toBe("watch");
    expect(loadStatus(0.5, 0.75, 0.9)).toBe("normal");
    expect(delayStatus(0)).toBeNull();
    expect(delayStatus(10)).toBe("watch");
    expect(delayStatus(30)).toBe("warning");
  });
});

describe("statusStyle", () => {
  it("exposes the status colour as a token reference", () => {
    expect(statusStyle("critical")).toEqual({ "--status": "var(--bad)" });
  });
});

describe("seriesSummary", () => {
  it("summarises min, max, latest and trend", () => {
    expect(seriesSummary([10, 40, 30, 60])).toBe("Min 10, max 60, latest 60, trend rising.");
    expect(seriesSummary([60, 20], " µg")).toBe("Min 20 µg, max 60 µg, latest 20 µg, trend falling.");
    expect(seriesSummary([5, 5, 5])).toBe("Min 5, max 5, latest 5, trend flat.");
  });
  it("handles empty series", () => {
    expect(seriesSummary([])).toBe("No data.");
  });
});
