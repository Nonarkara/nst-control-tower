import { describe, test, expect } from "vitest";
import { HOTLINES, PRIMARY_HOTLINES, isEmergencyMessage } from "./hotlines";

describe("hotlines", () => {
  test("the two flood numbers come first: DDPM 1784, EMS 1669", () => {
    expect(PRIMARY_HOTLINES.map((h) => h.number)).toEqual(["1784", "1669"]);
  });

  test("no Bangkok-only line leaks into a Nakhon Si Thammarat dashboard", () => {
    const numbers = HOTLINES.map((h) => h.number);
    for (const bkk of ["1555", "02-248-5115", "1130"]) expect(numbers).not.toContain(bkk);
  });

  test("every number is dialable (digits and dashes only)", () => {
    for (const h of HOTLINES) expect(h.number).toMatch(/^[0-9-]+$/);
  });
});

describe("isEmergencyMessage", () => {
  test.each([
    "ยายติดเตียง น้ำเข้าบ้านแล้ว ทำยังไงดี",
    "ช่วยด้วย ติดอยู่บนหลังคา",
    "my grandmother is bedridden and the water is rising",
    "we are trapped on the second floor",
    "มีคนหมดสติ",
  ])("rescue-now message: %s", (msg) => {
    expect(isEmergencyMessage(msg)).toBe(true);
  });

  test.each([
    "What's the current PM2.5 in Nakhon Si Thammarat?",
    "Summarise the flood situation in the Pak Phanang basin",
    "ระดับน้ำคลองท่าดีตอนนี้เท่าไหร่",
  ])("ordinary question stays ordinary: %s", (msg) => {
    expect(isEmergencyMessage(msg)).toBe(false);
  });
});
