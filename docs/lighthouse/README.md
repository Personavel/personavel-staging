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

**Chưa đạt mục tiêu:** Performance điện thoại ≥ 95, LCP < 1,5 s, lần tải đầu < 150 KB.
- LCP là ảnh thành phố ở đầu trang chủ. Ảnh này chỉ được vẽ sau khi tải và chạy xong `app.js` (≈ 122 KB nén), vì toàn bộ giao diện do JavaScript tạo ra.
- Lần tải đầu (HTML + JS + CSS + dữ liệu, chưa kể ảnh) ≈ 180 KB nén.
- Muốn đạt mục tiêu cần render sẵn trang chủ trong HTML hoặc tách code theo từng trang (hướng chuyển sang Vite ở Giai đoạn 1).
