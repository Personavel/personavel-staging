# Personavel – Your trip · Your story

Bản đồ du lịch tự túc TP.HCM của nhóm 11A13, THPT Lê Quý Đôn: bản đồ địa điểm, lịch trình thông minh, dẫn đường có giọng đọc, chatbot hướng dẫn viên, bộ sưu tập dấu mộc, nhật ký ảnh và đánh giá công khai.

**Xem web:** https://personavel.github.io

## Chạy ở máy local
Cần Python 3 và Node.js (Node chỉ dùng để chạy `npx esbuild` nén code; nếu thiếu Node, web vẫn build được, chỉ là không nén).
```bash
python3 src/build.py web          # tạo index.html, assets/, sw.js, manifest.json, sitemap.xml, robots.txt
python3 -m http.server 8000       # mở http://localhost:8000
python3 src/build.py              # tạo dist/personavel.html – 1 file chạy offline, ảnh nhúng sẵn (dùng để gửi/thuyết trình)
```
Service Worker chỉ bật trên `https` (GitHub Pages), không bật trên `localhost` qua http.

## Deploy
GitHub Pages phục vụ nhánh **`main`** (thư mục gốc). Quy trình:
1. Sửa trong `src/` (không sửa `index.html` hay `assets/` – đó là file sinh ra).
2. `python3 src/build.py web` rồi kiểm tra ở `localhost`.
3. Commit cả `src/` lẫn các file sinh ra (`index.html`, `assets/`, `sw.js`, …) rồi push lên `main`.
Tên file trong `assets/` có mã băm (`app.3f9c….js`) nên trình duyệt luôn lấy bản mới; `sw.js` tự xóa cache cũ.

Nhánh **`legacy`** giữ nguyên bản trước khi tối ưu (18/11/2026). Nhánh **`v2`** chứa đợt tối ưu Giai đoạn 0–2.

## Cấu trúc thư mục
```
src/                mã nguồn (xem bảng file trong CLAUDE.md)
  build.py          build web / bản offline
  gen_imgs.py       tạo ảnh WebP (img/) và imgs_desk.js từ ảnh gốc imgs*.js
  vendor/           Leaflet 1.9.4, Leaflet.markercluster 1.5.3
  static/           icon PWA, ảnh chia sẻ (og.jpg)
img/                ảnh WebP: hN.webp (địa điểm), t/ (ảnh nhỏ), gN(-800|-1200).webp (ảnh thành phố)
assets/             JS/CSS/font đã nén – file sinh ra
supabase/migrations/ cấu trúc database (chạy theo thứ tự 001 → 003)
docs/               hướng dẫn cài đặt, báo cáo Lighthouse, checklist kiểm thử
```

## Cấu trúc dữ liệu
`src/data.js` khai báo `window.PV_DATA = {places, streets, clusters}`.

Mỗi địa điểm (`places[]`):

| Trường | Ý nghĩa |
|---|---|
| `id` | mã duy nhất: `h…` di tích/văn hóa, `f…` ẩm thực, `s…` mua sắm, `c…` check-in |
| `name`, `name_en` | tên (Việt / Anh) |
| `cats` | nhóm: `history`, `food`, `shopping`, `checkin`, `fun`, `nature` (nhóm đầu là nhóm chính) |
| `kind` | mô tả ngắn loại hình |
| `address` | địa chỉ (phường mới sau sáp nhập 2025, có thể kèm địa chỉ cũ) |
| `coords` | `[kinh độ, vĩ độ]` |
| `geo` | `verified` (đã kiểm tra) hoặc `approx` (gần đúng) |
| `desc`, `desc_en` | giới thiệu / thuyết minh |
| `hours`, `hours_en` | mảng các dòng giờ mở cửa |
| `price`, `price_en` | mảng các dòng giá vé/giá món |
| `price_level` | 0 miễn phí · 1 < 50k · 2 50–150k · 3 > 150k · `null` chưa rõ |
| `visit_min` | thời gian tham quan gợi ý (phút) |
| `highlights`, `highlights_en` | điểm nổi bật / món nên thử |
| `warning` | lưu ý đặc biệt (hoặc `null`) |
| `source`, `source_name`, `maps_url`, `updated`, `phone`, `michelin` | nguồn, link Google Maps, ngày cập nhật, … |

### Thêm một địa điểm mới
1. Thêm một object vào `places` trong `src/data.js` với các trường ở trên (ít nhất `id`, `name`, `cats`, `kind`, `address`, `coords`, `desc`, `hours`, `price`, `price_level`, `visit_min`, `highlights`, `geo`, `updated`).
2. Có ảnh: thêm `"<id>": "data:image/jpeg;base64,…"` vào `src/imgs3.js`, rồi chạy `python3 src/gen_imgs.py` (cần Pillow) để tạo `img/<id>.webp` và ảnh nhỏ.
3. Có bản tiếng Anh: điền `name_en`, `desc_en`, `hours_en`, `price_en`.
4. Build lại và mở thẻ địa điểm trên bản đồ để kiểm tra.

## Máy chủ
- **Supabase** – đánh giá công khai và ảnh đánh giá. Xem `docs/setup.md`.
- **Chỉ đường:** OSRM miễn phí (`routing.openstreetmap.de`). **Thời tiết:** Open-Meteo. **Nền bản đồ:** Esri, OSM Humanitarian, CARTO.
