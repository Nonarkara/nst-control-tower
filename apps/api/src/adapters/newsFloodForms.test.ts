import { expect, it } from "vitest";
import { actionTags } from "./news";
for (const title of ["Floods persist in southern Thailand", "Homes flooded overnight", "Rising floodwaters close roads", "Inundation cuts off villages", "River inundates nearby streets", "Water overflowing onto roads", "A deluge hits Nakhon Si Thammarat"]) {
  it(`recognizes the flood report: ${title}`, () => expect(actionTags({ title, summary: "" })).toContain("FL"));
}
for (const title of ["New floodlights installed at stadium", "Floodplain biodiversity survey", "A flood of complaints about the new tax", "Inbox flooded with emails after launch"]) {
  it(`does not manufacture a flood topic from: ${title}`, () => expect(actionTags({ title, summary: "" })).not.toContain("FL"));
}
it("preserves a literal flood in the summary even when the headline contains an idiom", () => {
  expect(actionTags({ title: "A flood of complaints", summary: "River overflow inundated homes after heavy rain." })).toContain("FL");
});
