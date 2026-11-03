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
  let missing=false;
  await page.route("**/api/water/gauges?**",r=>r.fulfill({json:{meta,features:[missing?{...gauge,observedAt:"2000-01-01T00:00:00Z"}:gauge]}}));
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
  const geometry=await page.evaluate(()=>{
    const map=document.querySelector('.map-host')!.getBoundingClientRect();
    const rects=Array.from(document.querySelectorAll('.building-search,.map-navigation,.map-overlay-actions,.map-panel-toggle,.map-hud-bl,.chatbox-closed')).map(el=>el.getBoundingClientRect());
    const occupied=rects.reduce((n,r)=>n+Math.max(0,Math.min(map.right,r.right)-Math.max(map.left,r.left))*Math.max(0,Math.min(map.bottom,r.bottom)-Math.max(map.top,r.top)),0);
    return {width:innerWidth,height:innerHeight,map:map.toJSON(),visibleMapRatio:(map.width*map.height-occupied)/(innerWidth*innerHeight),scrollWidth:document.documentElement.scrollWidth};
  });
  expect(geometry.visibleMapRatio).toBeGreaterThanOrEqual(.60);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
  await shot('map',geometry);
  if(width<=1100){
    await page.getByRole('region',{name:'Water map readout'}).getByRole('button').click();
    await expect(page.locator('#rail-left')).toBeFocused();
    await expect(page.locator('.map-area')).toHaveAttribute('inert','');
    await expect(page.getByRole('region',{name:'Right now',exact:true})).toContainText('ยังประเมินเวลาล้นตลิ่งไม่ได้');
    await shot('brief');
    await page.getByRole('tab',{name:/^LAYERS/}).click();
    await expect(page.getByRole('combobox',{name:'Advanced map views',exact:true})).toBeVisible();
    await shot('tools');
  }else{
    await page.getByRole('button',{name:'Layers & news',exact:true}).click();
    const selector=page.getByRole('combobox',{name:'Advanced map views',exact:true});
    await expect(selector).toBeVisible();
    await shot('tools');
    await selector.press('Escape');
    await expect(page.getByRole('button',{name:'Layers & news',exact:true})).toBeFocused();
    await expect(page.locator('.right-bar')).toHaveAttribute('inert','');
  }
  missing=true;await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.locator(width<=1100?'.map-situation':'.situation-headline')).toContainText('ไม่มีข้อมูล');
  await shot('missing');
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
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.locator('.flood-watch-status strong')).toContainText('DWR ประกาศเตือน');
  const authority=await page.evaluate(()=>({status:document.querySelector('.flood-watch-status')!.getBoundingClientRect().top,focal:document.querySelector('.flood-watch-focal')!.getBoundingClientRect().top}));
  expect(authority.status).toBeLessThan(authority.focal);
  await shot('official');
  async function shot(state:string,geometry?:unknown){
    const dir=process.env.NST_DESK_ARTIFACT_DIR;if(!dir)return;
    mkdirSync(dir,{recursive:true});
    await page.screenshot({path:path.join(dir,`glance-${state}-${width}.png`)});
    if(geometry)writeFileSync(path.join(dir,`glance-${state}-${width}.json`),JSON.stringify(geometry,null,2));
  }
});
