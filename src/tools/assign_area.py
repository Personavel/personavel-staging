#!/usr/bin/env python3
"""Gán khu vực (phường mới sau sáp nhập 1/7/2025 + quận cũ) cho từng địa điểm trong src/data.js.

    python3 src/tools/assign_area.py            # tạo data/areas.json + docs/areas.csv
    python3 src/tools/assign_area.py --import docs/areas.csv   # nhập lại CSV đã soát tay -> data/areas.json

Cách gán:
  1. "address": lấy tên "phường …" đầu tiên (bỏ phần trong ngoặc "địa chỉ cũ …") nếu nằm trong danh sách phường mới.
  2. Không có: lấy phường của 3 địa điểm gần nhất đã gán chắc chắn (theo tọa độ), ưu tiên phường thuộc quận cũ
     ghi trong địa chỉ ("Quận 1 cũ"…). Các dòng này có source = nearest → cần nhóm soát lại trong docs/areas.csv.
Không cần thư viện ngoài.
"""
import csv, json, math, re, sys, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'src' / 'data.js'
OUT_JSON = ROOT / 'data' / 'areas.json'
OUT_CSV = ROOT / 'docs' / 'areas.csv'

# phường mới (Nghị quyết sáp nhập, hiệu lực 1/7/2025) -> quận cũ chủ yếu. Thêm dòng khi có địa điểm ở phường khác.
WARDS = {
    'Sài Gòn': 'Quận 1', 'Bến Thành': 'Quận 1', 'Tân Định': 'Quận 1', 'Cầu Ông Lãnh': 'Quận 1',
    'Bàn Cờ': 'Quận 3', 'Xuân Hòa': 'Quận 3', 'Nhiêu Lộc': 'Quận 3',
    'Vườn Lài': 'Quận 10', 'Vĩnh Hội': 'Quận 4', 'Thạnh Mỹ Tây': 'Bình Thạnh',
}

def nfc(s): return unicodedata.normalize('NFC', s or '')

def norm_ward(s):
    s = nfc(s).strip()
    for a, b in (('Hoà', 'Hòa'), ('hoà', 'hòa')): s = s.replace(a, b)
    return s

def slug(s):
    s = unicodedata.normalize('NFD', s.replace('Đ', 'D').replace('đ', 'd'))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def load_places():
    s = DATA.read_text(encoding='utf-8')
    obj, _ = json.JSONDecoder().raw_decode(s[s.index('{'):])
    return obj['places']

def ward_from_address(addr):
    main = re.split(r'\(', nfc(addr))[0]
    for m in re.finditer(r'phường\s+([^,.;()]+)', main, flags=re.I):
        w = norm_ward(m.group(1))
        for name in WARDS:
            if w.lower() == name.lower(): return name, 'address'
    # "khu vực Bàn Cờ", "khu Cầu Ông Lãnh", "Chợ Tân Định", "…, Cầu Ông Lãnh" (tên phường mới đứng riêng)
    names = '|'.join(map(re.escape, WARDS))
    m = re.search(rf'(?:khu vực|khu|chợ)\s+({names})\b|,\s*({names})\s*$', norm_ward(main), flags=re.I)
    if m:
        w = (m.group(1) or m.group(2)).lower()
        return next(n for n in WARDS if n.lower() == w), 'address_hint'
    return None, None

def district_hint(addr):
    m = re.search(r'Quận\s+(\d+)', nfc(addr), flags=re.I)
    return f'Quận {m.group(1)}' if m else None

def dist(a, b):  # mét, đủ chính xác trong phạm vi thành phố
    lat = math.radians((a[1] + b[1]) / 2)
    return math.hypot((a[0] - b[0]) * 111320 * math.cos(lat), (a[1] - b[1]) * 110540)

def build():
    places = load_places()
    rows, known = [], []
    for p in places:
        w, src = ward_from_address(p.get('address'))
        rows.append({'id': p['id'], 'name': p['name'], 'address': p.get('address') or '', 'coords': p.get('coords'),
                     'ward': w, 'source': src})
        if src == 'address' and p.get('coords'): known.append((p['coords'], w))
    for r in rows:
        if r['ward'] or not r['coords']: continue
        hint = district_hint(r['address'])
        cands = [k for k in known if not hint or WARDS[k[1]] == hint] or known
        near = sorted(cands, key=lambda k: dist(k[0], r['coords']))[:3]
        r['ward'] = Counter(w for _, w in near).most_common(1)[0][0]
        r['source'] = 'nearest'
        r['nearest_m'] = round(dist(near[0][0], r['coords']))
    return rows

def write(rows):
    used = sorted({r['ward'] for r in rows if r['ward']}, key=lambda w: (WARDS[w], w))
    areas = [{'slug': slug(w), 'ward': f'Phường {w}', 'district_old': WARDS[w],
              'count': sum(1 for r in rows if r['ward'] == w)} for w in used]
    out = {'version': '2025-07', 'generated_by': 'src/tools/assign_area.py', 'areas': areas,
           'places': {r['id']: slug(r['ward']) for r in rows if r['ward']}}
    OUT_JSON.parent.mkdir(exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    with OUT_CSV.open('w', newline='', encoding='utf-8-sig') as f:
        wr = csv.writer(f)
        wr.writerow(['id', 'name', 'ward', 'district_old', 'source', 'can_soat', 'address'])
        for r in rows:
            wr.writerow([r['id'], r['name'], r['ward'] or '', WARDS.get(r['ward'], ''), r['source'] or '',
                         'x' if r['source'] == 'nearest' else '', r['address']])
    print(f"{len(rows)} địa điểm · {sum(r['source'] in ('address','address_hint') for r in rows)} theo địa chỉ · "
          f"{sum(r['source']=='nearest' for r in rows)} theo điểm gần nhất (cần soát) · {len(areas)} phường")
    for a in areas: print(f"  {a['ward']:<22} {a['district_old']:<11} {a['count']}")

def import_csv(path):
    rows = []
    with open(path, encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            w = norm_ward(r['ward'].replace('Phường', ''))
            if w not in WARDS: sys.exit(f"Phường lạ ở dòng {r['id']}: {r['ward']} – thêm vào WARDS trước")
            rows.append({'id': r['id'], 'name': r['name'], 'address': r['address'], 'ward': w, 'source': 'csv', 'coords': None})
    write(rows)

if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--import': import_csv(sys.argv[2])
    else: write(build())
