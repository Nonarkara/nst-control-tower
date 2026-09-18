#!/usr/bin/env python3
"""
prep_workbench.py — turn the data.go.th crawl for นครศรีธรรมราช into the static
open-data workbench served at /data.

Setup (once, from repo root — Homebrew Python blocks global pip):
    python3 -m venv .venv-data
    .venv-data/bin/pip install pandas openpyxl xlrd

Run (from repo root, after `npx tsx scripts/crawlDataGoTh.ts`):
    .venv-data/bin/python scripts/prep_workbench.py

Reads   apps/api/datasets/manifest.json + apps/api/datasets/files/**
Writes  apps/web/public/data/workbench/index.json        (stats, domains, ledger, table profiles)
        apps/web/public/data/workbench/tables/{id}.json  ({columns, rows})

Rules
  * Every dataset and every resource appears in the ledger with a status:
    parsed · duplicate · list-only · oversize · fetch-failed · parse-failed ·
    out-of-scope (another province's file inside a national 76-province dataset).
  * Tables are sampled to MAX_ROWS (2,000) rows — fewer for very wide tables so
    one table never exceeds MAX_CELLS — and keep sourceRows + truncated.
  * "Spatial-ready" means coordinate or place-name columns were FOUND; nothing is
    geocoded.
  * Double-encoded Thai (UTF-8 read as cp874 then re-saved) is repaired per cell
    when the round-trip succeeds; otherwise the original text is kept.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "apps/api/datasets"
OUT = ROOT / "apps/web/public/data/workbench"
MAX_ROWS = 2000
MAX_CELLS = 40_000          # wide tables get fewer sampled rows
MAX_COLS = 80               # extremely wide survey dumps keep their first 80 columns
DATASET_URL = "https://data.go.th/dataset/{}"
TABULAR = {"CSV", "XLS", "XLSX", "JSON", "XSL"}

csv.field_size_limit(sys.maxsize)

# ── Text repair ──────────────────────────────────────────────────────────

MOJIBAKE = re.compile(r"เธ|เน")


def _cp874_bytes(text: str) -> bytes:
    """cp874 encode that maps the undefined 0x80–0xA0 code points back to raw bytes."""
    out = bytearray()
    for ch in text:
        try:
            out += ch.encode("cp874")
        except UnicodeEncodeError:
            cp = ord(ch)
            if cp <= 0xFF:
                out.append(cp)
            else:
                raise
    return bytes(out)


def fix_text(s: str) -> str:
    if not s or not MOJIBAKE.search(s):
        return s
    try:
        return _cp874_bytes(s).decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def decode_bytes(b: bytes) -> str:
    for enc in ("utf-8-sig", "cp874"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    return b.decode("utf-8", errors="replace")


def clean_cell(v: object) -> str:
    if v is None:
        return ""
    if isinstance(v, float):
        if v != v:  # NaN
            return ""
        return str(int(v)) if v.is_integer() else repr(v)
    if isinstance(v, (datetime, pd.Timestamp)):
        return v.strftime("%Y-%m-%d") if not (v.hour or v.minute) else v.strftime("%Y-%m-%d %H:%M")
    return fix_text(str(v).replace("\ufeff", "").strip())


# ── Grid → table ─────────────────────────────────────────────────────────

NUM_RE = re.compile(r"^[-+]?\(?\d{1,3}(,\d{3})+(\.\d+)?\)?%?$|^[-+]?\d+(\.\d+)?%?$|^[-+]?\.\d+$")


def to_number(s: str) -> float | None:
    t = s.replace(" ", "").replace("\u00a0", "")
    if not t or not NUM_RE.match(t):
        return None
    neg = t.startswith("(") and t.endswith(")")
    t = t.strip("()%").replace(",", "")
    try:
        n = float(t)
    except ValueError:
        return None
    return -n if neg else n


def find_header(grid: list[list[str]]) -> int:
    width = max((sum(1 for c in r if c) for r in grid[:30]), default=0)
    for i, row in enumerate(grid[:15]):
        filled = sum(1 for c in row if c)
        if filled >= max(2, width * 0.6) and sum(1 for c in row if c and to_number(c) is None) >= filled * 0.6:
            return i
    return 0


def is_garbage_header(row: list[str], header: list[str], body: list[list[str]]) -> bool:
    """A second header row (English labels, units, repeated header) above numeric data."""
    if not body or not any(row):
        return False
    if [c.lower() for c in row] == [c.lower() for c in header]:
        return True
    numeric_cols = 0
    hits = 0
    for j, cell in enumerate(row):
        col = [r[j] for r in body[:50] if j < len(r) and r[j]]
        if len(col) < 3:
            continue
        if sum(1 for c in col if to_number(c) is not None) >= 0.8 * len(col):
            numeric_cols += 1
            if cell and to_number(cell) is None:
                hits += 1
    return numeric_cols >= 1 and hits >= max(1, numeric_cols * 0.6)


def grid_to_table(grid: list[list[str]]) -> tuple[list[str], list[list[str]]] | None:
    grid = [[clean_cell(c) for c in r] for r in grid]
    grid = [r for r in grid if any(r)]
    if len(grid) < 2:
        return None
    h = find_header(grid)
    header = grid[h]
    body = grid[h + 1:]
    if body and is_garbage_header(body[0], header, body[1:]):
        body = body[1:]
    width = max(len(header), max((len(r) for r in body), default=0))
    header = header + [""] * (width - len(header))
    body = [r + [""] * (width - len(r)) for r in body]
    keep = [j for j in range(width) if header[j] or any(r[j] for r in body)]
    if not keep or not body:
        return None
    cols: list[str] = []
    seen: dict[str, int] = {}
    for j in keep:
        name = re.sub(r"\s+", " ", header[j]).strip() or f"คอลัมน์ {j + 1}"
        if name in seen:
            seen[name] += 1
            name = f"{name} ({seen[name]})"
        else:
            seen[name] = 1
        cols.append(name)
    rows = [[r[j] for j in keep] for r in body]
    return cols, rows


# ── Readers ──────────────────────────────────────────────────────────────

def sniff_kind(path: Path, fmt: str) -> str:
    head = path.read_bytes()[:8]
    if head.startswith(b"PK"):
        return "xlsx" if fmt in {"XLSX", "XLS", "XSL"} or path.suffix in {".xlsx", ".xls"} else "zip"
    if head.startswith(b"\xd0\xcf\x11\xe0"):
        return "xls"
    if head.startswith(b"%PDF"):
        return "pdf"
    text = decode_bytes(path.read_bytes()[:2048]).lstrip()
    if text[:1] in "[{":
        return "json"
    if text[:1] == "<":
        return "html"
    return "csv"


def read_csv(path: Path) -> list[tuple[str, list[list[str]]]]:
    text = decode_bytes(path.read_bytes()).replace("\r\n", "\n").replace("\r", "\n")
    sample = text[:4096]
    delim = max([",", ";", "\t", "|"], key=sample.count)
    return [("", list(csv.reader(io.StringIO(text), delimiter=delim)))]


def read_excel(path: Path, kind: str) -> list[tuple[str, list[list[str]]]]:
    engine = "openpyxl" if kind == "xlsx" else "xlrd"
    sheets = pd.read_excel(path, sheet_name=None, header=None, dtype=object, engine=engine)
    return [(str(name), df.where(df.notna(), None).values.tolist()) for name, df in sheets.items()]


def records_from_json(obj: object) -> list[dict] | None:
    if isinstance(obj, list) and obj and all(isinstance(x, dict) for x in obj[:50]):
        if all(x.get("type") == "Feature" for x in obj[:5]):
            return [feature_record(f) for f in obj]
        return obj
    if isinstance(obj, dict) and len(obj) >= 3 and all(v is None or isinstance(v, (str, int, float)) for v in obj.values()):
        # A data dictionary: {"field": "description", …} → a two-column table.
        return [{"ฟิลด์ / field": k, "คำอธิบาย / description": v} for k, v in obj.items()]
    if isinstance(obj, dict):
        if isinstance(obj.get("features"), list):
            return [feature_record(f) for f in obj["features"] if isinstance(f, dict)]
        for key in ("records", "data", "result", "results", "items", "rows"):
            if key in obj:
                found = records_from_json(obj[key])
                if found:
                    return found
    return None


def feature_record(f: dict) -> dict:
    rec = dict(f.get("properties") or {})
    geom = f.get("geometry") or {}
    if geom.get("type") == "Point" and isinstance(geom.get("coordinates"), list):
        rec["longitude"], rec["latitude"] = geom["coordinates"][:2]
    return rec


def read_json(path: Path) -> list[tuple[str, list[list[str]]]]:
    recs = records_from_json(json.loads(decode_bytes(path.read_bytes())))
    if not recs:
        raise ValueError("JSON ไม่มีรายการแบบตาราง / no tabular records")
    cols: list[str] = []
    for r in recs[:500]:
        for k in r:
            if k not in cols:
                cols.append(k)
    grid = [cols] + [[_flat(r.get(c)) for c in cols] for r in recs]
    return [("", grid)]


def _flat(v: object) -> object:
    return json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v


# ── Column profiling ─────────────────────────────────────────────────────

THAI_MONTHS = "มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\."
DATE_RE = re.compile(rf"^\d{{1,4}}[-/.]\d{{1,2}}[-/.]\d{{1,4}}|{THAI_MONTHS}|^(19|20|24|25)\d\d-\d\d")
TIME_HDR = re.compile(r"ปี|พ\.ศ|ค\.ศ|เดือน|วันที่|ไตรมาส|year|month|date|quarter|timestamp|period|งวด", re.I)
COORD_HDR = re.compile(r"^(lat|lng|lon|long|latitude|longitude|ละติจูด|ลองจิจูด|ลองติจูด|พิกัด|x|y)$|lat|lon|พิกัด|ละติจูด|ลองจิจูด|utm|coordinate|location", re.I)
PLACE_HDR = re.compile(r"^(pname|aname|tname|mname)$|อำเภอ|ตำบล|หมู่บ้าน|จังหวัด|ชุมชน|ที่ตั้ง|ที่อยู่|amphoe|amphur|amphor|tambon|tumbon|district|province|village|address", re.I)
ID_HDR = re.compile(r"^[patm]code$|_code$|^code$|รหัส|ลำดับ|^no\.?$|^id$|_id$|^id_|numbers|zip|โทร|phone|เบอร์|objectid|หมู่ที่", re.I)


def profile_column(name: str, values: list[str]) -> dict:
    vals = [v for v in values if v]
    n = len(vals)
    nums = [to_number(v) for v in vals]
    num_share = sum(1 for x in nums if x is not None) / n if n else 0
    kind = "text"
    lname = name.lower()
    if n and COORD_HDR.search(lname) and num_share >= 0.8:
        kind = "coord"
    elif n and COORD_HDR.search(lname) and any(re.search(r"\d+\.\d+\s*,\s*\d+\.\d+", v) for v in vals[:20]):
        kind = "coord"
    elif n and sum(1 for v in vals[:200] if DATE_RE.search(v)) >= 0.6 * min(n, 200):
        kind = "time"
    elif n and TIME_HDR.search(lname) and num_share >= 0.8 and all(
        x is not None and (1900 <= x <= 2100 or 2400 <= x <= 2700 or 1 <= x <= 12) for x in nums[:200]
    ):
        kind = "time"
    elif n and PLACE_HDR.search(lname) and num_share < 0.5:
        kind = "place"
    elif n and ID_HDR.search(lname):
        kind = "id"
    elif n and num_share >= 0.8:
        kind = "number"
    elif n and TIME_HDR.search(lname):
        kind = "time"
    return {"name": name, "kind": kind, "filled": n, "distinct": len(set(vals[:2000]))}


# ── Domains ──────────────────────────────────────────────────────────────

DOMAINS: list[tuple[str, str, str, str]] = [
    ("plan", "แผนงาน / โครงการ", "Plans & projects", r"^แผน|แผนพัฒนา|แผนปฏิบัติ|แผนแม่บท|บรรยายสรุป|ยุทธศาสตร์|อาเซียน"),
    ("safety", "ความปลอดภัย", "Public safety", r"คดี|อาชญากรรม|ยาเสพติด|อุบัติเหตุ|cctv|ทำร้าย|ความรุนแรง|ร้องเรียน|จับกุม"),
    ("environment", "สิ่งแวดล้อม / ภัยพิบัติ", "Environment & disaster", r"อุทกภัย|วาตภัย|ไฟป่า|ภัยพิบัติ|สาธารณภัย|ภัยแล้ง|ขยะ|ฝุ่น|pm2|pm10|ชายฝั่ง|น้ำฝน|ตะกอน|น้ำขึ้นน้ำลง|แหล่งน้ำ|จุดความร้อน|hotspot|สิ่งแวดล้อม|ทรัพยากรธรรมชาติ|ธรณี|หมุดหลักฐาน|ประปา|เสี่ยงภัย|ออกซิเจน|ทะเล|อุทยาน"),
    ("agriculture", "เกษตร / ประมง", "Agriculture & fisheries", r"เกษตร|ยางพารา|ส้มโอ|มังคุด|พืช|ประมง|หม่อนไหม|เพาะปลูก|ปศุสัตว์|ข้าว"),
    ("culture", "ศาสนา–วัฒนธรรม–ท่องเที่ยว", "Religion, culture & tourism", r"วัด|ศาสนา|วัฒนธรรม|ประเพณี|ท่องเที่ยว|โรงแรม|ที่พัก|มรดก|อัตลักษณ์|ภูมิปัญญา|นำเที่ยว|ตลาดน้ำ|อาหารท้องถิ่น|ตราสัญลักษณ์"),
    ("finance", "การคลัง / งบประมาณ", "Public finance", r"งบประมาณ|การคลัง|คลังจังหวัด|ราคาประเมิน|ธนารักษ์|ภาษี|รายจ่าย"),
    ("social", "สาธารณสุข / สังคม / การศึกษา", "Health, welfare & education", r"สุขภาพ|สาธารณสุข|คนพิการ|ผู้สูงอายุ|สวัสดิการ|นักเรียน|การศึกษา|สถานศึกษา|ครู|โรค|คุณภาพชีวิต|ผู้มีรายได้น้อย"),
    ("economy", "เศรษฐกิจ / แรงงาน", "Economy & labour", r"แรงงาน|เศรษฐกิจ|otop|พาณิชย์|ตลาด|ธุรกิจ|ผู้ประกอบการ|โรงงาน|สหกรณ์|คนละครึ่ง|เราชนะ|พลังงาน|มีงานทำ|รายได้|การเงิน|เช่า"),
    ("governance", "การปกครอง / ประชากร", "Government & population", r"ประชากร|ปกครอง|อปท|ท้องถิ่น|ทะเบียน|หมู่บ้าน|ครัวเรือน|บุคลากร|สำนักงาน|เว็บไซต์|หน่วยงาน|ที่ดิน|พื้นที่"),
]
OTHER = ("other", "อื่น ๆ", "Other")


def classify(ds: dict) -> str:
    fields = [ds.get("title", ""), " ".join(ds.get("tags", [])), ds.get("notes", ""), " ".join(ds.get("groups", [])), ds.get("orgName", "")]
    for text in fields:
        low = text.lower()
        for key, _th, _en, pattern in DOMAINS:
            if re.search(pattern, low):
                return key
    return OTHER[0]


# ── Main ─────────────────────────────────────────────────────────────────

def safe_id(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "-", s).strip("-")[:80]


def load_labels(ds: dict) -> dict[str, str]:
    """Column descriptions from a dataset's own data_dictionary JSON (DOPA 76-province sets)."""
    labels: dict[str, str] = {}
    for res in ds["resources"]:
        path = res.get("localPath")
        if not path or "dictionary" not in (res.get("name") or "").lower():
            continue
        try:
            obj = json.loads(decode_bytes((SRC / path).read_bytes()))
        except (OSError, ValueError):
            continue
        if isinstance(obj, dict):
            labels.update({k: fix_text(v.strip()) for k, v in obj.items() if isinstance(v, str) and v.strip()})
    return labels


def other_province_only(rows: list[list[str]], profile: list[dict]) -> bool:
    """True when the place columns name other provinces but never นครศรีธรรมราช (national files)."""
    place_cols = [j for j, p in enumerate(profile) if p["kind"] == "place"]
    if not place_cols:
        return False
    values = {rows[i][j] for i in range(min(len(rows), 5000)) for j in place_cols if rows[i][j]}
    if any(PROVINCE in v for v in values):
        return False
    return any(p != PROVINCE and p in v for v in values for p in PROVINCES if len(p) > 3)



# ── Personal data ─────────────────────────────────────────────────────────
# Several open datasets carry private individuals' names with home addresses
# and mobile numbers (GI licensees, service-centre contacts), and the flood
# casualty table lists each person who died with sex, age band, village and
# house number. They are public on data.go.th, but a municipal dashboard has
# no reason to re-publish them, and combined they identify families. Withheld
# cells keep their column (so the table's shape stays auditable) and say why.
WITHHELD = "[ปิดบัง · withheld: personal data]"
# Datasets that matched the "นครศรีธรรมราช" search but cover another region only.
OTHER_REGION_TITLE = re.compile(r"ภาคตะวันออก(?!เฉียงใต้)|ภาคตะวันออกเฉียงเหนือ|ภาคเหนือ|ภาคกลาง")
PERSON_NAME_HDR = re.compile(r"ชื่อ\s*-?\s*(?:สกุล|นามสกุล)|ชื่อ-สกุล|^ชื่อ\s*\(name\)|full\s*name|ผู้ประสานงาน|นายกสมาคม|ประธานชมรม|ผู้อำนวยการศูนย์", re.I)
CONTACT_HDR = re.compile(r"โทร|เบอร์|phone|mobile|e-?mail|อีเมล|line", re.I)
ADDRESS_HDR = re.compile(r"ที่อยู่|บ้านเลขที่|address|^เลขที่$", re.I)
SEX_HDR = re.compile(r"^เพศ$|gender|^sex$", re.I)
AGE_HDR = re.compile(r"อายุ|age", re.I)


def redact_personal(cols: list[str], rows: list[list[str]]) -> tuple[list[list[str]], list[int]]:
    """Withhold personal columns. Returns (rows, indexes of withheld columns)."""
    names = [i for i, c in enumerate(cols) if PERSON_NAME_HDR.search(c)]
    about_people = bool(names) or (any(SEX_HDR.search(c) for c in cols) and any(AGE_HDR.search(c) for c in cols))
    withheld = set(names)
    for i, c in enumerate(cols):
        if about_people and ADDRESS_HDR.search(c):
            withheld.add(i)
        # Contacts: a person's phone/email/LINE is personal; an organisation's
        # (health posts, offices) is a public service number worth keeping.
        if about_people and CONTACT_HDR.search(c):
            withheld.add(i)
    if not withheld:
        return rows, []
    out = [[(WITHHELD if (j in withheld and v) else v) for j, v in enumerate(r)] for r in rows]
    return out, sorted(withheld)


def build_table(ds: dict, res: dict, idx: int, sheet: str, n: int, cols: list[str], rows: list[list[str]],
                labels: dict[str, str]) -> tuple[dict, dict]:
    source_cols = len(cols)
    cols = [f"{c} · {labels[c]}" if c in labels and labels[c] != c else c for c in cols]
    if len(cols) > MAX_COLS:
        cols, rows = cols[:MAX_COLS], [r[:MAX_COLS] for r in rows]
    rows, withheld = redact_personal(cols, rows)
    profile = [profile_column(c, [r[j] for r in rows]) for j, c in enumerate(cols)]
    for j in withheld:
        profile[j]["kind"] = "text"
        profile[j]["withheld"] = True
    cap = min(MAX_ROWS, max(200, MAX_CELLS // max(1, len(cols))))
    sample = rows[:cap]
    typed = [
        [(to_number(v) if (p["kind"] in {"number", "coord"} and to_number(v) is not None) else v) for v, p in zip(r, profile)]
        for r in sample
    ]
    other = other_province_only(rows, profile)
    tid = safe_id(f"{ds['id']}__r{idx:02d}" + (f"__s{n}" if sheet else ""))
    kinds = [p["kind"] for p in profile]
    summary = {
        "id": tid,
        "datasetId": ds["id"],
        "title": ds["title"],
        "resource": res.get("name") or "",
        "sheet": sheet,
        "format": res.get("format") or "",
        "org": ds.get("orgName", "").strip(),
        "domain": classify(ds),
        "sourceRows": len(rows),
        "sourceColumns": source_cols,
        "rows": len(sample),
        "truncated": len(rows) > len(sample),
        "hasCoords": "coord" in kinds,
        "hasPlace": "place" in kinds,
        "hasTime": "time" in kinds,
        "numeric": kinds.count("number"),
        "otherProvince": other,
        "withheldColumns": [cols[j] for j in withheld],
        "columns": profile,
        "sourceUrl": DATASET_URL.format(ds["id"]),
        "fileUrl": res.get("url") or "",
        "updated": ds.get("updated", "")[:10],
    }
    return summary, {"id": tid, "columns": cols, "rows": typed}


def parse_resource(path: Path, fmt: str) -> list[tuple[str, list[list[str]]]]:
    kind = sniff_kind(path, fmt)
    if kind == "csv":
        return read_csv(path)
    if kind in {"xlsx", "xls"}:
        return read_excel(path, kind)
    if kind == "json":
        return read_json(path)
    raise ValueError({"html": "ไฟล์เป็นหน้าเว็บ ไม่ใช่ตาราง / file is an HTML page",
                      "zip": "ไฟล์ ZIP / archive", "pdf": "ไฟล์ PDF"}.get(kind, kind))


def merge_sheets(grids: list[tuple[str, list[list[str]]]]) -> list[tuple[int, str, list[str], list[list[str]]]]:
    """Parse every sheet; consecutive sheets with the same header (Page 1, Page 2, …) become one table."""
    out: list[tuple[int, str, list[str], list[list[str]]]] = []
    names: list[list[str]] = []
    for n, (sheet, grid) in enumerate(grids):
        parsed = grid_to_table(grid)
        if not parsed:
            continue
        cols, rows = parsed
        if out and out[-1][2] == cols:
            first_n, _label, _cols, prev_rows = out[-1]
            names[-1].append(sheet)
            label = f"{names[-1][0]} – {names[-1][-1]} (รวม {len(names[-1])} ชีต)"
            out[-1] = (first_n, label, cols, prev_rows + rows)
            continue
        out.append((n, sheet, cols, rows))
        names.append([sheet])
    return out


def fingerprint(cols: list[str], rows: list[list[str]]) -> str:
    h = hashlib.sha1(json.dumps([len(rows), rows[:5], rows[-1:]], ensure_ascii=False).encode())
    return h.hexdigest()


LIST_ONLY_REASON = {
    "PDF": "เอกสาร PDF / document", "ZIP": "ไฟล์บีบอัด / archive", "URL": "ลิงก์ภายนอก / external link",
    "API": "API ภายนอก / external API", "JPG": "รูปภาพ / image", "JPEG": "รูปภาพ / image", "PNG": "รูปภาพ / image",
    "SHP": "Shapefile (GIS)", "DOCX": "เอกสาร Word", "DOC": "เอกสาร Word", "RSS": "RSS feed", "XML": "XML",
}


PROVINCE = "นครศรีธรรมราช"
PROVINCES = json.loads((ROOT / "scripts/thaiProvinces.json").read_text())


def is_other_province(name: str, siblings: int) -> bool:
    """Mirror of isOtherProvince() in crawlDataGoTh.ts — a per-province file of a national dataset."""
    if siblings < 20 or PROVINCE in name:
        return False
    return any(p != PROVINCE and p in name for p in PROVINCES)


def process_resource(ds: dict, res: dict, idx: int, seen: dict[str, str], tables: list, tables_dir: Path,
                     labels: dict[str, str]) -> dict:
    fmt = (res.get("format") or "").upper()
    entry = {"idx": idx, "name": res.get("name") or "(ไม่มีชื่อ)", "format": fmt or "?", "url": res.get("url") or "", "tables": []}
    status = res.get("downloadStatus")
    if OTHER_REGION_TITLE.search(ds.get("title", "")) and PROVINCE not in ds.get("title", ""):
        return {**entry, "status": "out-of-scope", "reason": "ชุดข้อมูลของภูมิภาคอื่น ไม่มีข้อมูลนครศรีธรรมราช / another region's dataset (matched the search by accident)"}
    if is_other_province(entry["name"], len(ds["resources"])):
        return {**entry, "status": "out-of-scope", "reason": "ไฟล์ของจังหวัดอื่นในชุดข้อมูลระดับประเทศ / another province's file"}
    if fmt not in TABULAR and fmt:
        return {**entry, "status": "list-only", "reason": LIST_ONLY_REASON.get(fmt, f"รูปแบบ {fmt} ไม่ใช่ตาราง")}
    if status == "oversize":
        return {**entry, "status": "oversize", "reason": "ไฟล์ใหญ่เกิน 10 MB — เปิดที่แหล่งข้อมูล / over 10 MB, open at source"}
    if status != "ok" or not res.get("localPath"):
        return {**entry, "status": "fetch-failed", "reason": "ดาวน์โหลดจาก data.go.th ไม่สำเร็จ / download failed"}
    try:
        grids = parse_resource(SRC / res["localPath"], fmt)
    except Exception as err:  # noqa: BLE001 — every failure is recorded in the ledger
        return {**entry, "status": "parse-failed", "reason": str(err)[:160]}
    dupes = []
    for n, sheet, cols, rows in merge_sheets(grids):
        fp = fingerprint(cols, rows)
        if fp in seen:
            dupes.append(seen[fp])
            continue
        summary, table = build_table(ds, res, idx, sheet, n, cols, rows, labels)
        seen[fp] = summary["id"]
        tables.append(summary)
        entry["tables"].append(summary["id"])
        (tables_dir / f"{summary['id']}.json").write_text(json.dumps(table, ensure_ascii=False, separators=(",", ":")))
    if entry["tables"]:
        return {**entry, "status": "parsed", "reason": ""}
    if dupes:
        return {**entry, "status": "duplicate", "reason": "ซ้ำกับตารางอื่นในชุดเดียวกัน / same table as another file", "tables": dupes[:1]}
    return {**entry, "status": "parse-failed", "reason": "ไม่พบแถวข้อมูล / no data rows"}


def main() -> None:
    manifest = json.loads((SRC / "manifest.json").read_text())
    tables_dir = OUT / "tables"
    if tables_dir.exists():
        shutil.rmtree(tables_dir)
    tables_dir.mkdir(parents=True)

    tables: list[dict] = []
    ledger: list[dict] = []
    for ds in manifest["datasets"]:
        seen: dict[str, str] = {}
        labels = load_labels(ds)
        resources = [process_resource(ds, r, i, seen, tables, tables_dir, labels) for i, r in enumerate(ds["resources"])]
        ledger.append({
            "id": ds["id"], "title": ds["title"], "org": ds.get("orgName", "").strip(), "domain": classify(ds),
            "updated": ds.get("updated", "")[:10], "sourceUrl": DATASET_URL.format(ds["id"]),
            "tables": sum(len(r["tables"]) for r in resources if r["status"] == "parsed"),
            "resources": resources,
        })

    # Most reusable first: coordinates, then place/time/numeric signals, then size.
    tables.sort(key=lambda t: (t["otherProvince"], -(2 * t["hasCoords"] + t["hasPlace"] + t["hasTime"] + (t["numeric"] > 0)),
                               -t["sourceRows"]))
    res_all = [r for d in ledger for r in d["resources"]]
    stats = {
        "datasets": len(ledger),
        "resources": len(res_all),
        "inScope": sum(1 for r in res_all if r["status"] != "out-of-scope"),
        "tables": len(tables),
        "sourceRows": sum(t["sourceRows"] for t in tables),
        "sampledRows": sum(t["rows"] for t in tables),
        "spatial": sum(1 for t in tables if t["hasCoords"] or t["hasPlace"]),
        "coords": sum(1 for t in tables if t["hasCoords"]),
        "time": sum(1 for t in tables if t["hasTime"]),
        "numeric": sum(1 for t in tables if t["numeric"] > 0),
        "otherProvince": sum(1 for t in tables if t["otherProvince"]),
        "listOnly": sum(1 for d in ledger if d["tables"] == 0 and all(r["status"] == "list-only" for r in d["resources"])),
        "failed": sum(1 for r in res_all if r["status"] in {"fetch-failed", "parse-failed", "oversize"}),
        "noTable": sum(1 for d in ledger if d["tables"] == 0),
        "outOfScope": sum(1 for r in res_all if r["status"] == "out-of-scope"),
        "byStatus": {s: sum(1 for r in res_all if r["status"] == s) for s in
                     ["parsed", "duplicate", "list-only", "oversize", "fetch-failed", "parse-failed", "out-of-scope"]},
    }
    domains = []
    for key, th, en, _p in [*DOMAINS, (*OTHER, "")]:
        count = sum(1 for d in ledger if d["domain"] == key)
        if count:
            domains.append({"key": key, "th": th, "en": en, "datasets": count,
                            "tables": sum(1 for t in tables if t["domain"] == key)})
    domains.sort(key=lambda d: -d["datasets"])

    index = {
        "query": manifest.get("query", "นครศรีธรรมราช"),
        "crawledAt": manifest.get("fetchedAt"),
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "maxRows": MAX_ROWS,
        "stats": stats,
        "domains": domains,
        "tables": tables,
        "ledger": ledger,
    }
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")))
    total = sum(p.stat().st_size for p in OUT.rglob("*.json"))
    print(json.dumps(stats, ensure_ascii=False, indent=1))
    print(f"wrote {len(tables)} tables · total {total / 1e6:.1f} MB → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
