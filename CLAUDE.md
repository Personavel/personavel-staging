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
| `src/theme.js`, `style.css` | nền, màu chữ, giao diện |
| `src/imgs*.js` | ảnh gốc (base64) – `gen_imgs.py` tạo `imgs_desk.js`, `imgs_web.js` và thư mục `img/` |

## Build
```bash
python3 src/build.py web   # tạo index.html cho GitHub Pages (ảnh lấy từ img/)
python3 src/build.py       # tạo dist/personavel.html – 1 file chạy offline, ảnh nhúng sẵn
python3 src/gen_imgs.py    # chỉ chạy khi thêm/đổi ảnh (cần Pillow)
```
Sau mỗi thay đổi: build cả hai, mở thử trên khung điện thoại (390px), rồi commit `src/` **và** `index.html` cùng lúc.

## Máy chủ
- Supabase project **Personavel** (`bwtmunpzdxtutspdpphb`) – bảng `reviews` + kho ảnh `review-photos`. Cấu trúc ở `supabase/schema.sql`.
  Khóa trong `src/community.js` là khóa công khai (anon) – không đưa khóa `service_role` vào code.
- Chỉ đường: OSRM miễn phí `routing.openstreetmap.de`. Thời tiết: Open-Meteo.

## Làm chung không giẫm chân nhau
- Trước khi sửa: `git pull`. Mỗi người làm một nhánh hoặc báo nhau đang sửa file nào.
- Commit nhỏ, ghi rõ đã đổi gì (tiếng Việt).
