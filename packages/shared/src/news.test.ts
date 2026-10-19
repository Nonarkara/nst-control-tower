import { expect, it } from "vitest";
import { isNstNewsText } from "./news";
it("recognizes explicit NST place evidence in both languages", () => {
  for (const text of ["Flooding in Nakhon Si Thammarat", "ฝนตกหนักที่ปากพนัง", "Runoff at Tha Dee", "Cha-uat rainfall"]) expect(isNstNewsText(text)).toBe(true);
});
it("does not label international or generic public-place stories as local", () => {
  for (const text of ["Afghanistan Wakhan road opens near airport", "Police friction at city hall", "Flood at Bangkok railway station"]) expect(isNstNewsText(text)).toBe(false);
});
