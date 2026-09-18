#!/usr/bin/env python3
"""
buildEvacData.py — join the NST open datasets that answer "who must be moved
first when the water comes" into one static file the dashboard ranks live.

Inputs (from the data.go.th crawl, apps/api/datasets/files — see
scripts/crawlDataGoTh.ts):
  dataset_tr_55/r01  flood-risk villages with lat/lng + flood type
                     (น้ำท่วมขัง standing water / น้ำท่วมฉับพลัน ไหลหลาก flash flood)
  dataset_tr_55/r02  impact per village (…อาศัยไม่ได้ต้องอพยพ = must evacuate)
  dataset_tr_55/r04  likelihood (return period, years)
  dataset_tr_55/r05  risk months per village
  pop001/r00         registered population + households per village code (2568)
  os_4061/r00        bedridden elderly (ผู้สูงอายุกลุ่มติดเตียง) per district (2567)
  os_4062/r00        homebound elderly (ผู้สูงอายุกลุ่มติดบ้าน) per district (2567)
  os_4058/r01        registered people with disabilities per district (2566)
  dataset_tr_54/r00  1 tambon 1 disaster-management centre (local authority)

Output: apps/web/public/data/evac/villages.json

Privacy: every vulnerable-people figure here is an AGGREGATE per district
from the open data. No names or addresses exist in these datasets; the
named lists stay with the district health office / village health
volunteers (อสม.). Village-level vulnerable counts are ESTIMATES
(district rate × village population) and are labelled as such in the UI.

Run from repo root:  python3 scripts/buildEvacData.py   (stdlib only)
"""

import csv
import io
import json
import os
import re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = os.path.join(ROOT, "apps/api/datasets/files")
OUT = os.path.join(ROOT, "apps/web/public/data/evac/villages.json")


def read_csv(rel):
    raw = open(os.path.join(FILES, rel), "rb").read()
    text = raw.decode("utf-8-sig", errors="replace")
    # Many data.go.th CSVs are double-encoded: UTF-8 bytes decoded as
    # cp874 then re-encoded. Undo when the round-trip yields Thai.
    try:
        fixed = text.encode("cp874").decode("utf-8")
        if re.search(r"[฀-๿]", fixed):
            text = fixed
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    text = text.lstrip("﻿").lstrip("๏ปฟ")
    rows = list(csv.reader(io.StringIO(text)))
    header = [h.replace("\n", "").strip() for h in rows[0]]
    return [dict(zip(header, [c.strip() for c in r])) for r in rows[1:] if any(c.strip() for c in r)]


def num(v):
    try:
        return float(str(v).replace(",", "").strip())
    except ValueError:
        return None


def norm_amphoe(name):
    return re.sub(r"^(อำเภอ|อ\.)\s*", "", (name or "").strip())


def norm_tambon(name):
    return re.sub(r"^(ตำบล|ต\.)\s*", "", (name or "").strip())


# ── villages ────────────────────────────────────────────────────────────
villages = {}
for r in read_csv("dataset_tr_55/r01.csv"):
    code = r.get("รหัสหมู่บ้าน", "")
    lat, lng = num(r.get("latitude")), num(r.get("longitude"))
    if not code or lat is None or lng is None or not (6 < lat < 10 and 98 < lng < 101):
        continue
    v = villages.setdefault(code, {
        "code": code,
        "village": r.get("ชื่อหมู่บ้าน", ""),
        "moo": r.get("หมู่ที่", ""),
        "community": r.get("ชุมชน", "") or None,
        "tambon": norm_tambon(r.get("ชื่อตำบล", "")),
        "amphoe": norm_amphoe(r.get("ขื่ออำเภอ", "")),
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "floodTypes": [],
    })
    t = r.get("ประเภทความเสี่ยง", "")
    kind = "flash" if "ฉับพลัน" in t or "ไหลหลาก" in t else "standing" if "ขัง" in t else ("landslide" if "ดินโคลน" in t or "ดินถล่ม" in t else None)
    if kind and kind not in v["floodTypes"]:
        v["floodTypes"].append(kind)

for r in read_csv("dataset_tr_55/r02.csv"):
    v = villages.get(r.get("รหัสหมู่บ้าน", ""))
    if v is None:
        continue
    impact = r.get("ผลกระทบ", "")
    must = "ต้องอพยพ" in impact
    v["mustEvacuate"] = v.get("mustEvacuate", False) or must
    v["impactTh"] = impact

for r in read_csv("dataset_tr_55/r04.csv"):
    v = villages.get(r.get("รหัสหมู่บ้าน", ""))
    if v is None:
        continue
    yrs = num(r.get("ค่าเฉลี่ย"))
    if yrs:
        v["returnYears"] = yrs

MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
for r in read_csv("dataset_tr_55/r05.csv"):
    v = villages.get(r.get("รหัสหมู่บ้าน", ""))
    if v is None or "เสี่ยง" not in r.get("ความเสี่ยง", ""):
        continue
    m = r.get("เดือน", "")
    if m in MONTHS:
        v.setdefault("riskMonths", [])
        idx = MONTHS.index(m) + 1
        if idx not in v["riskMonths"]:
            v["riskMonths"].append(idx)

# ── population per village code (latest year only — the file stacks years) ──
pop_rows = read_csv("pop001/r00.csv")
YEAR_KEY = next(iter(pop_rows[0].keys()))  # header "ปี" arrives mangled
latest_year = max(r[YEAR_KEY] for r in pop_rows if r[YEAR_KEY].isdigit())
pop = {}
district_pop = defaultdict(int)
for r in pop_rows:
    if r[YEAR_KEY] != latest_year:
        continue
    code = r.get("รหัสหมู่บ้าน", "")
    # real villages only: 8 digits, not a tambon subtotal (…00)
    if not (len(code) == 8 and code.startswith("80") and not code.endswith("00")):
        continue
    p, h = num(r.get("จำนวนประชากรทั้งหมด")), num(r.get("จำนวนบ้าน (หลังคาเรือน)"))
    if p:
        district_pop[code[:4]] += int(p)
    if code in villages:
        prev = pop.get(code, (0, 0))
        pop[code] = ((prev[0] or 0) + int(p or 0), (prev[1] or 0) + int(h or 0))

for code, v in villages.items():
    p, h = pop.get(code, (None, None))
    v["population"] = p
    v["households"] = h
    v.setdefault("mustEvacuate", False)
    v.setdefault("riskMonths", [])
    v["riskMonths"].sort()

# ── district vulnerable people (aggregates) ─────────────────────────────
districts = defaultdict(lambda: {"bedridden": None, "homebound": None, "disabled": None})
for rel, key in (("os_4061/r00.csv", "bedridden"), ("os_4062/r00.csv", "homebound")):
    for r in read_csv(rel):
        a, n = norm_amphoe(r.get("อำเภอ", "")), num(r.get("ค่าข้อมูล"))
        if a and n is not None:
            districts[a][key] = int(n)
dis_rows = read_csv("os_4058/r01.csv")
dis_year = max(r.get("ปี", "") for r in dis_rows)
for r in dis_rows:
    if r.get("ปี") != dis_year:
        continue
    a, n = norm_amphoe(r.get("อำเภอ", "")), num(r.get("ค่าข้อมูล"))
    if a and n is not None:  # age bands 0-6/6-15/15-60/60+ partition the total
        districts[a]["disabled"] = (districts[a]["disabled"] or 0) + int(n)

# district population by name (amphoe code → name via the village file)
code_to_amphoe = {}
for code, v in villages.items():
    code_to_amphoe.setdefault(code[:4], v["amphoe"])
for a4, total in district_pop.items():
    name = code_to_amphoe.get(a4)
    if name:
        districts[name]["population"] = total

# ── disaster-management centre per tambon ───────────────────────────────
centres = {}
for r in read_csv("dataset_tr_54/r00.csv"):
    key = f"{norm_amphoe(r.get('อำเภอ', ''))}|{norm_tambon(r.get('ตำบล', ''))}"
    centres[key] = {
        "authority": r.get("รายชื่อ อปท", ""),
        "trained": (num(r.get("ฝึกอบรมแล้ว")) or 0) > 0,
    }
for v in villages.values():
    v["centre"] = centres.get(f"{v['amphoe']}|{v['tambon']}")

out = {
    "generatedAt": __import__("datetime").datetime.now().astimezone().isoformat(timespec="minutes"),
    "sources": {
        "villages": "https://data.go.th/dataset/dataset_tr_55",
        "population": "https://data.go.th/dataset/pop001",
        "bedridden": "https://data.go.th/dataset/os_4061",
        "homebound": "https://data.go.th/dataset/os_4062",
        "disabled": "https://data.go.th/dataset/os_4058",
        "centres": "https://data.go.th/dataset/dataset_tr_54",
    },
    "years": {"population": latest_year, "disabled": dis_year, "elderly": "2567"},
    "villages": sorted(villages.values(), key=lambda v: v["code"]),
    "districts": dict(sorted(districts.items())),
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

vs = out["villages"]
print(f"{len(vs)} villages · {sum(1 for v in vs if v['mustEvacuate'])} must-evacuate · "
      f"{sum(1 for v in vs if 'flash' in v['floodTypes'])} flash-flood · "
      f"{sum(1 for v in vs if v['population'])} with population · "
      f"{sum(1 for v in vs if v['centre'])} with a disaster centre · "
      f"{len(out['districts'])} districts · {os.path.getsize(OUT) // 1024} KB")
for name, d in list(out["districts"].items())[:5]:
    print("  ", name, d)
