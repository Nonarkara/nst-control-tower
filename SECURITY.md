# ความปลอดภัย · Security

### ภาษาไทย

รีโปนี้ตั้งใจไม่มีความลับ `.gitignore` กัน `.env`, `.env.*`, `.dev.vars` และไฟล์ service account ไฟล์ที่ติดตามได้คือ `apps/api/.env.example` ซึ่งมีแต่ชื่อตัวแปร

ถ้าพบคีย์หลุดในคอมมิต หรือช่องทางที่ทำให้ผู้อื่นดึงข้อมูลที่ไม่ได้เปิดสาธารณะ ให้เปิด GitHub private security advisory ของรีโปนี้ อย่าเปิดประเด็นสาธารณะสำหรับคีย์หรือช่องโหว้ที่ยังใช้การได้

สิ่งที่โค้ดกันไว้ และขอบเขตของมัน

- ตัวจำกัดอัตราใน `apps/api/src/index.ts` คือ `Map` ในความจำของ isolate: 600 คำขอต่อนาทีต่อไอพี สำหรับ `/api/*` และ 20 ครั้งต่อนาทีสำหรับ `/api/chat` มันกันหนึ่งตัวประมวลผล มันไม่ใช่เพดานทั้งบัญชี
- แชตตัดที่ความยาวข้อความ จำนวนเทิร์น และเวลา 15 วินาที และมีชั้นตรวจรูปแบบก่อนยิงโมเดล (`apps/api/src/adapters/chat.ts`)
- `/api/health/keys` ตอบแค่ว่ามีคีย์หรือไม่ ไม่ตอบค่าคีย์
- แผง “ใครต้องย้ายก่อน” ไม่เปิดชื่อและที่อยู่ของผู้อยู่อาศัย ข้อความท้ายแผงบอกว่าชื่ออยู่ที่สถานีอนามัยกับ อสม.
- เบอร์ใน `apps/web/src/lib/hotlines.ts` ใส่ได้เมื่อตรวจกับหน้าหน่วยงานแล้ว เบอร์ผิดในหน้าน้ำท่วมเป็นบั๊กที่รอรุ่นถัดไปไม่ได้

การดีพลอยใช้ `CLOUDFLARE_API_TOKEN` จากซีเคร็ตของ GitHub Actions โทเคนนั้นไม่ควรอยู่ในกิตหรือในล็อก

### English

This repository is meant to contain no secrets. `.gitignore` keeps out `.env`, `.env.*`, `.dev.vars`, and service-account files. The tracked example is `apps/api/.env.example`, names only.

If a key has landed in a commit, or you find a path that lets someone pull data that is not already public, open a GitHub private security advisory on this repository. A public issue is the wrong place for a live key or an unfixed hole.

What the code already bounds, and how far that bound goes:

- The limiter in `apps/api/src/index.ts` is a `Map` in the isolate’s memory: 600 requests per minute per IP on `/api/*`, and 20 per minute on `/api/chat`. It bounds one isolate. It is not an account-wide ceiling.
- Chat stops on message length, turn count, and a 15-second cutoff, and it checks the latest message before calling the model (`apps/api/src/adapters/chat.ts`).
- `/api/health/keys` reports whether a key is present. It does not return the value.
- The “who to move first” panel does not publish residents’ names or addresses. The footer says those stay with the health station and the village health volunteers.
- A number enters `apps/web/src/lib/hotlines.ts` only after a check against the agency’s own page. A wrong number on a flood screen cannot wait for a later release.

Deploy uses `CLOUDFLARE_API_TOKEN` from GitHub Actions secrets. That token does not belong in git or in a log.
