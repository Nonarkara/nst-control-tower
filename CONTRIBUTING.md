# ร่วมพัฒนา · Contributing

### ภาษาไทย

แพตช์ยินดีรับ ทั้งแก้บั๊กของข้อมูลน้ำท่วมและเอกสารที่ทำให้เมืองอื่นแตกกิ่งได้ การเปลี่ยนพฤติกรรมบนจอต้องมีเทสต์คู่กัน อย่าปิดเทสต์เพื่อให้ผ่าน

เครื่องที่ใช้คือ Node 20 ขึ้นไป และ pnpm 10.33 ตาม `package.json`

```bash
pnpm install
pnpm dev                         # เว็บ :5173 และ API
pnpm --filter @nst/shared test
pnpm --filter @nst/api test
pnpm --filter @nst/web test
pnpm --filter @nst/web test:e2e  # Playwright
```

CI ใน `.github/workflows/test.yml` รันตรวจชนิดและเทสต์ทุกพูลรีเควสต์ ดีพลอยใน `deploy.yml` รันหลัง Test บน `main` สำเร็จ

สัญญาที่อย่าทำหลุด

- ฟีดทุกเส้นคืน `NormalizedFeed<T>` จาก `@nst/shared`
- อะแดปเตอร์ดึงผ่าน `fetchJsonOrThrow` และโยนเมื่อล้มจริง เพื่อให้แคชส่งค่าดีล่าสุด
- หัวแผงใช้ `<PanelHeader>` อายุและชั้นข้อมูลต้องโผล่
- ระดับสถานการณ์ของ สสน. ที่ว่างเป็น `null` ดู [`c8c785e`](https://github.com/Nonarkara/nst-control-tower/commit/c8c785ef4873d4527c44d407c84f5848ed8a1473)
- เบอร์ฉุกเฉินเพิ่มได้เมื่อตรวจกับหน้าหน่วยงานแล้ว (`apps/web/src/lib/hotlines.ts`)
- คีย์เป็นตัวแปรสภาพแวดล้อม ไม่เข้ากิต
- สีในคอมโพเนนต์ใช้โทเคนใน `apps/web/src/styles/tokens.css`
- ข้อความที่ผู้ใช้เห็นเป็นภาษาไทยที่ใช้การได้ คู่กับอังกฤษ อย่าแปลคำต่อคำแล้วปล่อยไว้

เอกสารที่อ้างตัวเลขต้องชี้ไฟล์ที่ตัวเลขอยู่ ตารางอัตราดึงใน README ใช้ TTL ของอะแดปเตอร์ ไม่ใช้ `pollSeconds` ที่คลาดกัน

รายละเอียดแนวเขียนที่เหลืออยู่ในไฟล์นี้และ [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

### English

Patches are welcome, including flood-data bugs and docs that help another city fork this. A change to what the screen does needs a test beside it. Disabling a test to go green is not a fix.

The toolchain is Node 20 or newer and pnpm 10.33, as `package.json` records.

```bash
pnpm install
pnpm dev                         # web :5173 and the API
pnpm --filter @nst/shared test
pnpm --filter @nst/api test
pnpm --filter @nst/web test
pnpm --filter @nst/web test:e2e  # Playwright
```

CI in `.github/workflows/test.yml` runs typecheck and tests on every pull request. `deploy.yml` deploys only after Test succeeds on `main`.

Contracts to keep:

- Every feed returns `NormalizedFeed<T>` from `@nst/shared`.
- An adapter fetches through `fetchJsonOrThrow` and throws on a real failure, so the cache can serve the last good value.
- A panel section starts with `<PanelHeader>`. Age and tier stay visible.
- A missing HII situation level stays `null`. See [`c8c785e`](https://github.com/Nonarkara/nst-control-tower/commit/c8c785ef4873d4527c44d407c84f5848ed8a1473).
- An emergency number is added only after a check against that agency’s page (`apps/web/src/lib/hotlines.ts`).
- Keys are environment variables. They do not enter git.
- Component colour uses the tokens in `apps/web/src/styles/tokens.css`.
- Copy a resident reads is usable Thai beside the English. A word-for-word gloss is not finished copy.

A doc that states a number points at the file the number came from. The README refresh table uses adapter TTLs, because `pollSeconds` has drifted on a few rows.

Writing conventions that remain are in this file and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
