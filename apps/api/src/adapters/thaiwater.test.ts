import { describe, test, expect } from "vitest";
import { signedDiffFromBank } from "./thaiwater";

/**
 * HII reports diff_wl_bank as a positive magnitude with the direction carried
 * in diff_wl_bank_text. signedDiffFromBank normalises to: positive = above bank
 * (overbank/flooding), negative = below bank (freeboard). Getting this sign
 * wrong would render calm dry-season mountain gauges as catastrophic floods.
 */
describe("signedDiffFromBank", () => {
  test("below bank (ต่ำกว่าตลิ่ง) → negative freeboard", () => {
    expect(signedDiffFromBank(5.24, "ต่ำกว่าตลิ่ง (ม.)")).toBe(-5.24);
    expect(signedDiffFromBank("1.88", "ต่ำกว่าตลิ่ง (ม.)")).toBe(-1.88);
  });

  test("above bank (สูงกว่าตลิ่ง) → positive overbank", () => {
    expect(signedDiffFromBank(0.8, "สูงกว่าตลิ่ง (ม.)")).toBe(0.8);
  });

  test("overflow (ล้นตลิ่ง) → positive overbank", () => {
    expect(signedDiffFromBank(1.2, "ล้นตลิ่ง")).toBe(1.2);
  });

  test("already-negative magnitude with below-bank text stays negative", () => {
    expect(signedDiffFromBank(-3.3, "ต่ำกว่าตลิ่ง (ม.)")).toBe(-3.3);
  });

  test("null magnitude → null", () => {
    expect(signedDiffFromBank(null, "ต่ำกว่าตลิ่ง")).toBeNull();
    expect(signedDiffFromBank(undefined, null)).toBeNull();
  });

  test("unknown direction text → passes magnitude through unchanged", () => {
    expect(signedDiffFromBank(2.5, null)).toBe(2.5);
    expect(signedDiffFromBank(2.5, "(ม.)")).toBe(2.5);
  });
});
