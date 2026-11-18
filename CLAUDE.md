# Personavel – hướng dẫn cho người (và Claude) cùng làm dự án

Bản đồ du lịch tự túc TP.HCM của nhóm 11A13, THPT Lê Quý Đôn. Web chạy trên GitHub Pages: https://personavel.github.io

## Quy tắc chung
- Trả lời và viết giao diện bằng **tiếng Việt** (có bản tiếng Anh qua `PV.L('vi','en')` / `i18n.js`).
- Gam màu của nhóm: **các sắc xanh dương**. Nền mặc định cho người mới: trắng – xanh.
- Giữ dữ liệu người dùng cũ khi đăng xuất (tài khoản lưu trên máy, khóa `pv_*` trong localStorage).
- Ưu tiên trải nghiệm điện thoại (≤ 820px), không làm vỡ giao diện máy tính.

## Sửa code ở đâu
**Chỉ sửa trong `src/`.** Không sửa thẳng `index.html` – file này được tạo ra từ `src/` và sẽ bị ghi đè.

| File | Nội dung |
|---|---|
| `src/data.js` | 104 địa điểm, tên đường (nguồn dữ liệu) |
| `src/app1.js` | hàm chung, lịch trình thông minh (`PV.buildTrip`), thuyết minh |
| `src/app2.js` | khung trang, Trang chủ, Bản đồ, Lịch trình, Bộ sưu tập |
| `src/app3.js` | Chatbot (`PV.localAnswer`), Trang cá nhân, Cài đặt, Giới thiệu |
| `src/app4.js` | màn mở đầu, chọn ngôn ngữ, giới thiệu, khởi động (luôn nạp cuối) |
| `src/nlu.js` | chatbot hiểu lời chào, câu hỏi nối tiếp |
| `src/tripplus.js` | chi tiết từng điểm, chi phí ngày, đánh giá lịch trình, tuyến thật |
| `src/nav.js` | dẫn đường từng ngã rẽ, giọng đọc, báo tới nơi, đi lệch |
| `src/traffic.js` | giờ cao điểm, phố cấm xe, thi công, điểm hay chèo kéo (**cập nhật khi có thông báo phân luồng mới**) |
| `src/community.js`, `reviews.js`, `appreview.js` | đánh giá có ảnh, công khai qua Supabase |
| `src/visited.js` | danh sách địa điểm đã đi |
| `src/ux.js` | robot tự ẩn khi cuộn, thẻ 3 bước cho người mới |
| `src/badges.js` | lưới huy hiệu + popup chi tiết; mọi `PV.modal` đóng bằng Esc và giữ focus |
| `src/routes.js` | tuyến đường thật OSRM (xe: router.project-osrm.org, đi bộ: routing.openstreetmap.de), từng chặng, lưu đệm IndexedDB 30 ngày |
| `src/guides.js` | phạm vi từng trợ lý (`PV.routeChat`), phiên chat riêng mỗi trợ lý – test: `node tests/chat-routing.test.js` |
| `src/theme.js`, `style.css` | nền, màu chữ, giao diện |
| `src/imgs*.js` | ảnh gốc (base64) – `gen_imgs.py` tạo `imgs_desk.js`, `imgs_web.js` và thư mục `img/` |

## Build
```bash
python3 src/build.py web   # index.html + assets/ (JS/CSS nén, có mã băm) + sw.js + manifest.json + sitemap.xml
python3 src/build.py       # dist/personavel.html – 1 file chạy offline, ảnh nhúng sẵn
python3 src/gen_imgs.py    # chỉ chạy khi thêm/đổi ảnh (cần Pillow)
python3 src/build.py web --kill-sw   # CHỈ khi bản mới lỗi nặng: sw.js tự gỡ trên máy mọi người (xem docs/setup.md)
```
Nén code dùng `npx esbuild` (cần Node). Sau mỗi thay đổi: build cả hai, mở thử trên khung điện thoại (375px) cả Việt lẫn Anh, rồi commit `src/` **và** các file sinh ra (`index.html`, `assets/`, `sw.js`) cùng lúc. Checklist: `docs/checklist.md`. Trang thử nghiệm trước khi gộp vào `main`: `docs/staging.md`.
`index.html` có sẵn màn đầu tiên tĩnh (`#boot`, ảnh `img/g0-480.webp`) – app4.js làm mờ nó khi app vẽ xong.
Thêm module JS mới: khai báo trong danh sách `APP` của `src/build.py` (trước `app4.js`). Không đặt tên biến `L` trong module – trùng với thư viện bản đồ Leaflet.

## Máy chủ
- Supabase project **Personavel** (`bwtmunpzdxtutspdpphb`) – bảng `reviews` + kho ảnh `review-photos`. Cấu trúc ở `supabase/migrations/` 001→004 (xem `docs/setup.md`: duyệt ảnh, giới hạn gửi). Đổi hàm database phải giữ tên + tham số cũ để web trên `main` vẫn chạy.
  Khóa trong `src/community.js` là khóa công khai (anon) – không đưa khóa `service_role` vào code.
- Chỉ đường: OSRM miễn phí – xe `router.project-osrm.org`, đi bộ `routing.openstreetmap.de/routed-foot` (`src/routes.js`). Thời tiết: Open-Meteo.

## Làm chung không giẫm chân nhau
- Trước khi sửa: `git pull`. Mỗi người làm một nhánh hoặc báo nhau đang sửa file nào.
- Commit nhỏ, ghi rõ đã đổi gì (tiếng Việt).
