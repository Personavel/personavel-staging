# Báo cáo Lighthouse (18/11/2026)

Đo bằng Lighthouse 13 trên máy local, máy chủ có nén gzip giống GitHub Pages. Giới hạn: máy đo không tải được font Google và nền bản đồ, nên tổng dung lượng thực tế trên web sẽ cao hơn một chút.

| | Trước (nhánh `legacy`) | Sau (nhánh `v2`) |
|---|---|---|
| **Điện thoại** – Performance | 90 | **92** (91–93 qua các lần đo) |
| Accessibility | 94 | **100** |
| Best Practices | 96 | **100** |
| SEO | 100 | 100 |
| First Contentful Paint | 2,9 s | **1,4 s** |
| Largest Contentful Paint | 2,9 s | 3,2 s |
| Total Blocking Time | 0 ms | 90 ms |
| Tổng tải trang chủ | 497 KB | **344 KB** |
| **Máy tính** – Performance | 99 | 99 |
| Accessibility / BP / SEO | 94 / 96 / 100 | **100 / 100 / 100** |
| FCP / LCP | 0,6 s / 0,6 s | 0,4 s / 0,8 s |

Chi tiết: `before-mobile.html`, `after-mobile.html`, `before-desktop.html`, `after-desktop.html`.

## Lần đo 2 – trang chủ vẽ sẵn bằng HTML tĩnh
Thay đổi: màn đầu tiên (ảnh Chợ Bến Thành + "Xin chào, <tên>!") viết sẵn trong `index.html`, ảnh nằm ngay trong HTML (trình duyệt thấy và tải sớm, bản nhỏ 480 px ≈ 25 KB cho điện thoại), CSS/JS chính đặt sau màn này nên không chặn việc vẽ, font Google tải không chặn. Khi app chạy xong thì màn này mờ dần đi.

| | v2 lần 1 | **v2 lần 2** |
|---|---|---|
| **Điện thoại** – Performance | 92 | **98** |
| FCP | 1,4 s | **0,6 s** |
| LCP | 3,2 s | **2,3 s** |
| TBT / CLS | 90 ms / 0 | 60 ms / 0 |
| Speed Index | – | 2,0 s |
| Tổng tải | 344 KB | **319 KB** |
| **Máy tính** – Performance | 99 | **100** (FCP 0,2 s, LCP 0,6 s) |
| A11y / BP / SEO | 100 / 100 / 100 | 100 / 100 / 100 |

Chi tiết: `v2-hero-mobile.html`, `v2-hero-desktop.html`. Trên máy thật (không giả lập 4G chậm) ảnh đầu tiên hiện sau ≈ 0,1 s.
LCP 2,3 s là con số Lighthouse **giả lập** mạng 4G chậm: ảnh phải chia băng thông với `app.js` (121 KB nén) tải cùng lúc. Muốn xuống dưới 1,5 s cần tách `app.js` theo từng trang (Giai đoạn sau).

**Lần 1 – chưa đạt mục tiêu:** Performance điện thoại ≥ 95, LCP < 1,5 s, lần tải đầu < 150 KB.
- LCP là ảnh thành phố ở đầu trang chủ. Ảnh này chỉ được vẽ sau khi tải và chạy xong `app.js` (≈ 122 KB nén), vì toàn bộ giao diện do JavaScript tạo ra.
- Lần tải đầu (HTML + JS + CSS + dữ liệu, chưa kể ảnh) ≈ 180 KB nén.
- Muốn đạt mục tiêu cần render sẵn trang chủ trong HTML hoặc tách code theo từng trang (hướng chuyển sang Vite ở Giai đoạn 1).
