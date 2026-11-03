import {test,expect} from "./fixtures";
import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";

for (const width of [390,1024,1440]) test(`map entry, evidence exit and keyboard path at ${width}px`,async({page})=>{
  test.setTimeout(120_000);
  const height=width===390?844:900;
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>localStorage.setItem("nst:locale","th"));
  // Explicit synthetic UI case; no production observations are restamped.
  const stamp=new Date().toISOString();
  const meta={source:"synthetic glance test",fetchedAt:stamp,ageMinutes:43,fallbackTier:"cache"};
  const gauge={id:"glance-test",name:"สะพานนางพระยา-บางหลวง ชุมชนปากนคร (ข้อมูลทดสอบ)",stationCode:"TEST",amphoe:"เมืองนครศรีธรรมราช",riverName:"คลองทดสอบ",lat:8.43,lng:100.03,levelMsl:.62,diffFromBank:-.11,fullnessPct:96,trend:"rising",observedAt:stamp};
  let missing=false,critical=false;
  await page.route("**/api/water/gauges?**",r=>r.fulfill({json:{meta:{...meta,fetchedAt:new Date(Date.parse(stamp)+(missing?2000:critical?1000:0)).toISOString()},features:[missing?{...gauge,observedAt:"2000-01-01T00:00:00Z"}:critical?{...gauge,diffFromBank:.1,fullnessPct:102,situationLevel:5}:gauge]}}));
  await page.route("**/geo/nst/terrain-grid.json",r=>r.fulfill({json:{cellLng:1,cellLat:1,cells:[]}}));
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await expect(page.locator('.map-host')).toBeVisible({timeout:30_000});
  if(width<=1100){
    await expect(page.getByRole('tab',{name:/^MAP/})).toHaveAttribute('aria-selected','true');
    await expect(page.getByRole('region',{name:'Water map readout'})).toContainText('96%');
    await expect(page.getByRole('region',{name:'Water map readout'})).toContainText('cache');
    await page.getByRole('button',{name:'More',exact:true}).press('Tab');
    expect(await page.evaluate(()=>!!document.activeElement?.closest('[inert]'))).toBe(false);
  }else await expect(page.getByRole('button',{name:'Layers & news',exact:true})).toHaveAttribute('aria-expanded','false');
  await verifyMap('map');
  if(width<=1100){
    await page.getByRole('region',{name:'Water map readout'}).getByRole('button').click();
    await expect(page.locator('#rail-left')).toBeFocused();
    await expect(page.locator('.map-area')).toHaveAttribute('inert','');
    await expect(page.getByRole('region',{name:'Right now',exact:true})).toContainText('ยังประเมินเวลาล้นตลิ่งไม่ได้');
    await shot('brief');
    await page.getByRole('region',{name:'Right now',exact:true}).getByRole('button',{name:'ดูบนแผนที่',exact:true}).click();
    await expect(page.locator('#city-map')).toBeFocused();
    await page.getByRole('tab',{name:/^LAYERS/}).click();
    await expect(page.getByRole('combobox',{name:'Advanced map views',exact:true})).toBeVisible();
    await page.getByRole('link',{name:'Skip to map tools',exact:true}).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#map-tools-panel')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>!!document.activeElement?.closest('.right-layers'))).toBe(true);
    await shot('tools');
  }else{
    await page.getByRole('button',{name:'Layers & news',exact:true}).click();
    const selector=page.getByRole('combobox',{name:'Advanced map views',exact:true});
    await expect(selector).toBeVisible();
    await expect(selector).toBeFocused();
    await shot('tools');
    await selector.press('Escape');
    await expect(page.getByRole('button',{name:'Layers & news',exact:true})).toBeFocused();
    await expect(page.locator('.right-bar')).toHaveAttribute('inert','');
  }
  critical=true;await page.goto("/",{waitUntil:"domcontentloaded"});
  await expect(page.locator(width<=1100?'.map-situation':'.situation-headline')).toContainText('วิกฤต');
  if(width<=1100) await expect(page.locator('.map-situation')).toContainText('ประสานเวรทันที');
  await verifyMap('critical');
  missing=true;critical=false;await page.goto("/",{waitUntil:"domcontentloaded"});
  await expect(page.locator(width<=1100?'.map-situation':'.situation-headline')).toContainText('ไม่มีข้อมูล');
  await verifyMap('missing');
  const observation={generatedAt:stamp,gauges:[gauge],rain:[],waterMeta:meta,rainMeta:meta,weather:[],weatherFetchedAt:null,tide:null,context:{fetchedAt:stamp,wetness:null,rainTrend:null,tmd:null,errors:[]},cameraCounts:{total:0,online:0,unknown:0},gaps:['Synthetic missing-rain case']};
  await page.route('**/api/flood/operations?**',r=>r.fulfill({json:{meta,features:[observation]}}));
  await page.goto('/flood-ops',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.flood-watch-focal')).toContainText('11 ซม.');
  await expect(page.locator('.flood-watch-status')).toContainText('ไม่ลบล้างระดับน้ำ');
  const focal=await page.locator('.flood-watch-focal').boundingBox();
  expect(focal!.y+focal!.height).toBeLessThan(height-44);
  await expect(page.locator('.flood-watch-verify')).toBeInViewport();
  await shot('flood');
  if(width===1440){
    await page.emulateMedia({colorScheme:'dark',media:'print'});
    expect(await page.locator('.flood-watch-gap').first().evaluate(e=>getComputedStyle(e).color)).toBe('rgb(92, 68, 0)');
    await shot('print');
    await page.emulateMedia({media:'screen'});
  }
  await page.locator('.flood-watch-verify').click();
  await expect(page.locator('#duty-actions')).toBeInViewport();
  await page.route('**/api/water/ews?**',r=>r.fulfill({json:{meta:{...meta,fallbackTier:'live'},features:[{id:'test-dwr',name:'ประกาศทดสอบลำดับอ่าน',lat:8.4,lng:99.9,type:'water',amphoe:'ลานสกา',tambon:'ทดสอบ',basin:'test',status:2,stale:false,observedAt:stamp,rain:null,rain12h:null,rain07h:null,soilMoisture:null}]}}));
  await page.goto('/flood-ops',{waitUntil:"domcontentloaded"});
  await expect(page.locator('.flood-watch-status strong')).toContainText('DWR ประกาศเตือน');
  const authority=await page.evaluate(()=>({status:document.querySelector('.flood-watch-status')!.getBoundingClientRect().top,focal:document.querySelector('.flood-watch-focal')!.getBoundingClientRect().top}));
  expect(authority.status).toBeLessThan(authority.focal);
  await shot('official');
  async function verifyMap(state:string){
  const geometry=await page.evaluate(()=>{
    const map=document.querySelector('.map-host')!.getBoundingClientRect();
    const rects=Array.from(document.querySelectorAll('.building-search,.map-navigation,.map-overlay-actions,.map-panel-toggle,.map-hud-bl,.chatbox-closed')).map(el=>el.getBoundingClientRect());
    const occupied=rects.reduce((n,r)=>n+Math.max(0,Math.min(map.right,r.right)-Math.max(map.left,r.left))*Math.max(0,Math.min(map.bottom,r.bottom)-Math.max(map.top,r.top)),0);
    return {width:innerWidth,height:innerHeight,map:map.toJSON(),visibleMapRatio:(map.width*map.height-occupied)/(innerWidth*innerHeight),scrollWidth:document.documentElement.scrollWidth};
  });
  expect(geometry.visibleMapRatio).toBeGreaterThanOrEqual(.60);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
  await shot(state,geometry);
  }
  async function shot(state:string,geometry?:unknown){
    const dir=process.env.NST_DESK_ARTIFACT_DIR;if(!dir)return;
    mkdirSync(dir,{recursive:true});
    await page.screenshot({path:path.join(dir,`glance-${state}-${width}.png`)});
    if(geometry)writeFileSync(path.join(dir,`glance-${state}-${width}.json`),JSON.stringify(geometry,null,2));
  }
});


test("chat remains reachable when resize restores an inactive map panel",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await page.getByRole("tab",{name:/^LAYERS/}).click();
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole("button",{name:"Ask NST: open concierge chat",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Ask anything about Nakhon Si Thammarat",exact:true});
  await expect(dialog.getByRole("textbox",{name:"Your message",exact:true})).toBeFocused();
  await dialog.getByRole("textbox",{name:"Your message",exact:true}).fill("Unsent test draft");
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#city-map')).toHaveAttribute('inert','');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(e=>!!e.closest('[inert],[aria-hidden="true"]'))).toBe(false);
  await expect(dialog.getByRole("textbox",{name:"Your message",exact:true})).toHaveValue("Unsent test draft");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab",{name:/^LAYERS/})).toBeFocused();
});


test("visible CCTV command walls remain operable and restore focus on exit",async({page})=>{
  await page.goto("/",{waitUntil:"domcontentloaded"});
  const trigger=page.getByRole("button",{name:/^Open CCTV command center/});
  await trigger.click();
  await expect(page.locator('.left-bar')).not.toHaveAttribute('inert','');
  await expect(page.locator('.right-bar')).not.toHaveAttribute('inert','');
  await expect(page.locator('.left-bar')).toHaveAttribute('aria-hidden','false');
  const exit=page.locator('.cctv-cc').first().getByRole('button',{name:'Exit CCTV command center',exact:true});
  await expect(exit).toBeVisible();
  await exit.click();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.right-bar')).toHaveAttribute('inert','');
  await trigger.click();
  await page.getByRole('button',{name:'Layers & news',exact:true}).click();
  await expect(page.locator('.cctv-cc')).toHaveCount(0);
  await expect(page.getByRole('combobox',{name:'Advanced map views',exact:true})).toBeFocused();
});
