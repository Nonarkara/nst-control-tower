# แตกกิ่งไปใช้กับเมืองคุณ · Fork it for your city

คู่มือนี้ทำสี่อย่าง: เลือกภูมิศาสตร์, ตั้งแหล่งข้อมูล, ขึ้น Cloudflare พร้อมเบรกค่าใช้จ่าย, แล้วเดินรายการตรวจ เลขและชื่อไฟล์ยกจากโค้ดปัจจุบัน

This guide does four things: choose the geography, point the sources, deploy on Cloudflare with the cost brakes, then walk the checklist. Figures and filenames are from the current code.

---

## 1. เลือกภูมิศาสตร์ · Choose the ground

### ภาษาไทย

จุดศูนย์กลางเมืองอยู่ใน `packages/shared/src/campus.ts` อ็อบเจกต์ `NST`

- `center` เป็น `[ลองจิจูด, ละติจูด]` ของเมืองเก่า ตอนนี้ `[99.9631, 8.4364]`
- `innerBounds` คือเขตเทศบาลที่ถือเป็นตัวเมือง
- `outerBounds` คือกรอบแผนที่ทั้งจังหวัด ฟีดสดควรคลุมกรอบนี้
- `defaultView` เปิดที่ซูม 14 เพื่อให้เฟรมแรกเป็นตัวเมือง
- `NST_PROVINCE_BBOX` คือกล่องที่อะแดปเตอร์ระดับจังหวัดใช้
- `WATERSHED_FORECAST_POINTS` คือจุดฝนต้นน้ำสี่จุด ลำดับต้องตรงกันทั้ง API และเว็บ

อาคารสามมิติวางที่ `apps/web/public/geo/nst/buildings.geojson` เมืองใหม่ใช้โฟลเดอร์ชื่อเมืองตัวเอง แล้วชี้ไฮเดรตใน `apps/api/src/node.ts` ให้ตรงไฟล์นั้น

รหัสจังหวัดใน ThaiWater คือ `PROVINCE = "80"` ใน `apps/api/src/adapters/thaiwater.ts` รีเลย์ใช้ `?code=80` ใน `floodDashRelay.ts` เมืองอื่นต้องเปลี่ยนทั้งสองจุดให้เป็นรหัสจังหวัดตัวเอง

อ่างเก็บน้ำที่โชว์ถูกกรองด้วย `NST_RESERVOIR_IDS` ใน `apps/api/src/adapters/rid.ts` ใส่เฉพาะอ่างที่อยู่ในลุ่มของเมือง และตรวจรหัสกับ API จริงก่อน คอมเมนต์ในไฟล์นั้นเล่าว่าเคยใส่ยางชุมซึ่งอยู่นอกจังหวัด

หมู่บ้านที่ต้องย้ายก่อนมาจาก `apps/web/public/data/evac/villages.json` ของนครศรีธรรมราช เมืองใหม่ต้องมีทะเบียนของตัวเอง อย่าปล่อยไฟล์นี้ค้างไว้แล้วให้รายชื่อหมู่บ้านนครศรีธรรมราชไปโผล่ในเมืองอื่น

### English

The city centre lives in `packages/shared/src/campus.ts`, object `NST`.

- `center` is `[longitude, latitude]`. Today that is `[99.9631, 8.4364]`, the old town.
- `innerBounds` is the municipality.
- `outerBounds` is the province frame the map can pan across. Live feeds should cover it.
- `defaultView` boots at zoom 14 so the first frame is the city.
- `NST_PROVINCE_BBOX` is the box province-scale adapters use.
- `WATERSHED_FORECAST_POINTS` is four upstream rain points. The order is shared by the API and the web. Change both together.

3D buildings are `apps/web/public/geo/nst/buildings.geojson`. A new city gets its own folder, and the hydrate path in `apps/api/src/node.ts` has to follow that file.

The ThaiWater province code is `PROVINCE = "80"` in `apps/api/src/adapters/thaiwater.ts`. The relay asks `?code=80` in `floodDashRelay.ts`. Both have to become the new province code.

Reservoirs on screen are filtered by `NST_RESERVOIR_IDS` in `apps/api/src/adapters/rid.ts`. Keep only reservoirs in the city’s basins, and check the ids against the live RID API. The file’s own comment records that Yang Chum was once listed here and belongs to another province.

“Who to move first” reads `apps/web/public/data/evac/villages.json`, which is Nakhon Si Thammarat’s register. A new city needs its own register. Leaving this file in place would rank the wrong villages.

---

## 2. ตั้งแหล่งข้อมูล · Point the sources

### ภาษาไทย

สารบบที่หน้า SOURCES อ่านคือ `packages/shared/src/sources.ts` ตัดรายการที่เมืองไม่มี และเติมรายการที่เมืองมี สถานะมีห้าค่า: `live`, `ready`, `planned`, `research`, `stub`

สุขภาพของแต่ละเส้นทางผูกผ่าน `API_PATH_TO_ADAPTER` ใน `apps/web/src/lib/sourceCatalog.ts` เส้นทางใหม่ต้องอยู่ในทั้งสารบบและตารางนี้ ไม่งั้นแหล่งที่ล่มจะไม่โผล่ในหน้า SOURCES

อะแดปเตอร์หนึ่งแหล่งอยู่ที่ `apps/api/src/adapters/<name>.ts`

- ดึงผ่าน `fetchJsonOrThrow` เวลาตัด 25 วินาที
- แปลงเป็น `NormalizedFeed<T>`
- ดึงไม่สำเร็จให้โยนข้อผิดพลาด เพื่อให้แคชส่งค่าดีล่าสุด
- ถ้าไม่มีค่าเก่าเลย ให้คืนฟีดชั้น `unavailable` หรือ `scenario` พร้อม `meta.note` ที่อ่านรู้เรื่อง
- เพิ่มการทดสอบที่เส้นล้มตอนเครื่องเย็น

คีย์ใส่เป็นตัวแปรสภาพแวดล้อม ตามชื่อใน `apps/api/.env.example` ไม่มีคีย์แล้วให้ตั้ง `meta.note` หน้า SOURCES จะขึ้นว่าขาดคีย์

สายด่วนอยู่ใน `apps/web/src/lib/hotlines.ts` เบอร์ท้องถิ่นจะเพิ่มได้ก็ต่อเมื่อตรวจกับหน้าของหน่วยงานนั้นแล้ว คอมเมนต์ในไฟล์บอกเหตุผลตรง ๆ: เบอร์ฉุกเฉินที่ผิด แก้ในรุ่นถัดไปไม่ทัน

ระดับสถานการณ์ของ สสน. ต้องคงกฎจาก [`c8c785e`](https://github.com/Nonarkara/nst-control-tower/commit/c8c785ef4873d4527c44d407c84f5848ed8a1473): ค่าว่างหรือนอกช่วง 1–5 เป็น `null` ห้ามใส่ 3

### English

The SOURCES screen reads `packages/shared/src/sources.ts`. Drop what the city does not have and add what it does. Status is `live`, `ready`, `planned`, `research`, or `stub`.

Route health is joined through `API_PATH_TO_ADAPTER` in `apps/web/src/lib/sourceCatalog.ts`. A new route has to be in the catalog and in that table, or a dead source stays invisible on the SOURCES screen.

One adapter, one file: `apps/api/src/adapters/<name>.ts`.

- Fetch with `fetchJsonOrThrow`. The timeout is 25 seconds.
- Reshape into `NormalizedFeed<T>`.
- Throw when the fetch truly fails, so the cache can serve the last good value.
- With nothing saved yet, return an `unavailable` or `scenario` feed and a `meta.note` a person can read.
- Test the cold-start failure.

Keys are environment variables, named in `apps/api/.env.example`. A missing key sets `meta.note` so SOURCES can say the key is missing.

Hotlines live in `apps/web/src/lib/hotlines.ts`. A local number is added only after it is checked on that agency’s own page. The file says why: a wrong emergency number cannot wait for a later release.

HII situation levels keep the rule from [`c8c785e`](https://github.com/Nonarkara/nst-control-tower/commit/c8c785ef4873d4527c44d407c84f5848ed8a1473): missing or outside 1–5 stays `null`. Do not substitute 3.

---

## 3. ขึ้น Cloudflare พร้อมเบรกค่าใช้จ่าย · Deploy, with the cost brakes

### ภาษาไทย

ของที่รันจริงวันนี้

- เว็บ: Cloudflare Pages โปรเจกต์ `nst-control-tower` จาก `.github/workflows/deploy.yml` ขึ้นก็ต่อเมื่อเวิร์กโฟลว์ Test ผ่าน
- API: Worker ชื่อ `nst-control-tower-api` จาก `apps/api/wrangler.toml` เวิร์กโฟลว์เดียวกันดีพลอยแล้วเช็ค `/api/health` ว่า `version` ตรงกับคอมมิต
- เบราว์เซอร์เรียก API ที่ `https://nst-control-tower-api.drnon.workers.dev` เว้นแต่จะตั้ง `VITE_API_BASE_URL` ตอนบิลด์ (`apps/web/src/lib/apiBase.ts`)
- `wrangler.toml` ไม่มีทริกเกอร์ cron Worker ทำงานเมื่อมีคนขอ ไม่ได้ปลุกตัวเองเป็นรอบ
- บล็อก KV ถูกคอมเมนต์ไว้ แคชคือ `Map` ในหน่วยความจำ เพดาน 200 คีย์ (`apps/api/src/lib/cache.ts`)

เบรกที่อยู่ในโค้ด อย่าถอดตอนแตกกิ่ง

| เบรก | ที่อยู่ | ทำอะไร |
|---|---|---|
| TTL รายอะแดปเตอร์ | แต่ละไฟล์ใน `adapters/` | คนเปิดหน้าไม่เท่ากับหนึ่งครั้งที่ยิงต้นทาง อากาศ Open-Meteo แคช 3 ชั่วโมง เพราะคอมเมนต์ระบุว่าถนอมโควตารายวัน |
| แคชความล้มเหลว 60 วินาที | `FAILURE_RETRY_SECONDS` ใน `cache.ts` | ต้นทางล่มจะไม่ถูกยิงรัว และจะไม่ค้างว่างทั้ง TTL |
| เพดาน 600 คำขอ/นาที/ไอพี | `RATE_LIMIT` ใน `apps/api/src/index.ts` | กันไคลเอนต์ที่รัว เพดานนี้ตั้งหลัง 120 ครั้ง/นาทีไปชนตอนเปิดแดชบอร์ดปกติ |
| แชต 20 ครั้ง/นาที/ไอพี | `CHAT_RATE_LIMIT` | กันโควตา Gemini |
| งบข้อความ | `chat.ts`: 1,200 ตัวอักษร, 16 เทิร์น, พรอมป์ระบบไม่เกิน 40,000 ตัวอักษร, ตัดที่ 15 วินาที | กันหนึ่งเซสชันกินโควตา |
| สำรอง Ollama | `OLLAMA_BASE_URL` | เมื่อ Gemini ตอบ 429 หรือ 503 |
| เที่ยวบินแคช 90 นาที | `flights.ts` | คอมเมนต์ระบุว่าให้อยู่ในชั้นฟรี 1,000 ครั้ง/เดือน |
| Overpass เฉพาะจังหวัด แคช 7 วัน | `waterways.ts` | เลิกดึงทั้งประเทศที่เคยไปชนลิมิตของเซิร์ฟเวอร์ฟรี |
| ตัวอย่างไฟล์ data.go.th | `datagoDetail.ts` | ตัดที่ 256 KB และ 50 แถว |
| ไฟล์ตัวอย่างคีย์ | `.env.example` | Gemini ชั้นฟรี 15 ครั้ง/นาที, FMP 250 ครั้ง/วัน, FRED 120,000 ครั้ง/วัน |

ตัวจำกัดอัตราอยู่ในความจำของ isolate มันกันหนึ่งตัวประมวลผล ไม่ใช่เพดานทั้งบัญชี Cloudflare เมืองที่คนดูหนาแน่นต้องไปตั้งเพดานที่ขอบของ Cloudflare เพิ่มเอง

เมืองใหม่ใช้ชื่อโปรเจกต์ Pages และชื่อ Worker ของตัวเอง แล้วตั้ง `VITE_API_BASE_URL` ให้ชี้เวิร์กเกอร์นั้น อย่าดีพลอยทับโปรเจกต์ `nst-control-tower`

รีเลย์ M3 เป็นของ FloodDash คนละระบบ เมืองที่ Cloudflare ไปถึง ThaiWater ได้ไม่ต้องมีแมคก็ได้ เมืองที่เจอขาออกถูกปฏิเสธแบบนครศรีธรรมราช ต้องมีตัวดึงจากไอพีในไทย แล้วเปลี่ยน `RELAY_URL` ให้เป็นจังหวัดตัวเอง

### English

What production runs today:

- Web: Cloudflare Pages project `nst-control-tower`, from `.github/workflows/deploy.yml`, and only after the Test workflow succeeds.
- API: the Worker `nst-control-tower-api` in `apps/api/wrangler.toml`. The same workflow deploys it and checks that `/api/health` reports the commit as `version`.
- The browser calls `https://nst-control-tower-api.drnon.workers.dev` unless `VITE_API_BASE_URL` was set at build time (`apps/web/src/lib/apiBase.ts`).
- `wrangler.toml` has no cron trigger. The Worker runs when someone asks. It does not wake itself on a timer.
- The KV block is commented out. The cache is an in-memory `Map` capped at 200 keys (`apps/api/src/lib/cache.ts`).

Brakes already in the code. Leave them in a fork.

| Brake | Where | What it does |
|---|---|---|
| Per-adapter TTL | each file in `adapters/` | A page view is not an upstream fetch. Open-Meteo weather is cached 3 hours; the comment says that is to stay kind to the daily quota. |
| 60-second failure cache | `FAILURE_RETRY_SECONDS` in `cache.ts` | A down upstream is not hammered, and an empty payload does not stick for the full TTL. |
| 600 requests / minute / IP | `RATE_LIMIT` in `apps/api/src/index.ts` | Stops a client that spins. The comment records that 120/minute tripped on an ordinary dashboard load. |
| Chat 20 / minute / IP | `CHAT_RATE_LIMIT` | Protects the Gemini quota. |
| Message budget | `chat.ts`: 1,200 characters, 16 turns, system prompt capped at 40,000 characters, 15-second cutoff | One session cannot spend the quota. |
| Ollama fallback | `OLLAMA_BASE_URL` | Used when Gemini returns 429 or 503. |
| Flights cached 90 minutes | `flights.ts` | The comment says this stays inside the 1,000 requests/month free tier. |
| Province-only Overpass, 7-day cache | `waterways.ts` | Replaces a nationwide pull that threatened the free Overpass instance. |
| data.go.th preview cap | `datagoDetail.ts` | Stops at 256 KB and 50 rows. |
| Key examples | `.env.example` | Gemini free tier 15/minute, FMP 250/day, FRED 120,000/day. |

The rate limiter lives in the isolate’s memory. It bounds one isolate. It is not an account-wide Cloudflare ceiling. A busy city still sets a limit at the Cloudflare edge.

A new city uses its own Pages project name and its own Worker name, and sets `VITE_API_BASE_URL` at that Worker. Do not deploy over the `nst-control-tower` project.

The M3 relay belongs to FloodDash, a separate system. A city whose Workers can reach ThaiWater does not need the Mac. A city that sees the same egress refusal Nakhon Si Thammarat saw needs a poller on a Thai IP, and then changes `RELAY_URL` to its own province.

---

## 4. รายการตรวจ · Checklist

### ภาษาไทย

- [ ] `campus.ts` ชี้ศูนย์กลาง กรอบใน กรอบนอก และมุมกล้องของเมืองคุณ
- [ ] รหัสจังหวัดใน `thaiwater.ts` กับ `RELAY_URL` เป็นจังหวัดเดียวกัน
- [ ] `NST_RESERVOIR_IDS` มีแต่อ่างในลุ่มของคุณ และตรวจกับ API ของกรมชลประทานแล้ว
- [ ] ไฟล์อาคารและทะเบียนหมู่บ้านเป็นของเมืองคุณ
- [ ] `sources.ts` กับ `API_PATH_TO_ADAPTER` ตรงกันทุกลำที่ขึ้นว่าสด
- [ ] อะแดปเตอร์ใหม่โยนเมื่อล้ม มี `meta.note` เมื่อไม่มีคีย์ และมีเทสต์ตอนเครื่องเย็น
- [ ] ระดับสถานการณ์ที่ว่างยังเป็น `null`
- [ ] เบอร์ท้องถิ่นทุกเบอร์เปิดจากหน้าหน่วยงานได้
- [ ] ไม่มีคีย์ในกิต `.env` ถูก gitignore
- [ ] ชื่อ Pages กับชื่อ Worker เป็นของเมืองคุณ
- [ ] TTL, เพดานคำขอ, งบแชต และแคชความล้มเหลว 60 วินาทียังอยู่
- [ ] `pnpm` ผ่าน typecheck กับเทสต์ของ `@nst/shared`, `@nst/api`, `@nst/web` ก่อนเปิดพูลรีเควสต์
- [ ] หลังดีพลอย เว็บเสิร์ฟไฟล์ `index-*.js` ที่เพิ่งบิลด์ และ `/api/health` รายงานคอมมิตนั้น

### English

- [ ] `campus.ts` has your centre, inner bounds, outer bounds, and camera.
- [ ] The province code in `thaiwater.ts` and in `RELAY_URL` is the same province.
- [ ] `NST_RESERVOIR_IDS` lists only reservoirs in your basins, checked against the RID API.
- [ ] The buildings file and the village register belong to your city.
- [ ] `sources.ts` and `API_PATH_TO_ADAPTER` agree on every route marked live.
- [ ] A new adapter throws on failure, sets `meta.note` when its key is missing, and has a cold-start test.
- [ ] A missing situation level is still `null`.
- [ ] Every local hotline opens from that agency’s own page.
- [ ] No keys in git. `.env` stays gitignored.
- [ ] The Pages project and the Worker name belong to your city.
- [ ] The TTLs, the request ceiling, the chat budget, and the 60-second failure cache are still there.
- [ ] `pnpm` typecheck and the `@nst/shared`, `@nst/api`, and `@nst/web` tests pass before the pull request.
- [ ] After deploy, the site serves the `index-*.js` you just built, and `/api/health` reports that commit.
