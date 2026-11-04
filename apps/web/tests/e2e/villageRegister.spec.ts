import {test,expect} from "./fixtures";
import {ensureSectionOpen} from "./floodSmokeHelpers";
import {mkdirSync} from "node:fs";
import path from "node:path";

for (const width of [390,1024,1440]) test(`village register is evidence, not an evacuation order at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width===390?844:900});
  await page.route("**/data/evac/villages.json",r=>r.fulfill({json:{
    generatedAt:"2026-11-04T00:00:00Z",sources:{register:"synthetic UI fixture"},
    years:{population:"test",disabled:"test",elderly:"test"},districts:{},
    villages:[{code:"TEST",village:"หมู่บ้านทดสอบ",moo:"1",community:null,tambon:"ทดสอบ",amphoe:"ทดสอบ",lat:8.4,lng:99.9,floodTypes:["flash"],mustEvacuate:true,riskMonths:[1,2,3,4,5,6,7,8,9,10,11,12],population:100,households:30,centre:null}]
  }}));
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await ensureSectionOpen(page,"People First");
  const panel=page.getByRole("region",{name:"Who to move first",exact:true});
  await expect(panel).toContainText("evacuation listed in flood-risk register");
  await expect(panel).toContainText("No live signal — the register lists evacuation when this village floods.");
  await expect(panel).toContainText("Confirm current conditions and any evacuation decision with the responsible local authority.");
  await expect(panel).not.toContainText("residents must leave");
  await expect(panel.getByRole("button",{name:"Show village",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const dir=process.env.NST_DESK_ARTIFACT_DIR;
  if(dir){mkdirSync(dir,{recursive:true});await panel.screenshot({path:path.join(dir,`village-register-${width}.png`)});}
});
