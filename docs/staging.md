# Trang thử nghiệm cho nhánh `v2`

Mục đích: chạy bản `v2` trên một địa chỉ **https** riêng để thử những thứ không thử được trên máy (gửi đánh giá thật, nền bản đồ, font, cài PWA, offline). Trang chính `https://personavel.github.io` (nhánh `main`) **không bị ảnh hưởng**. Chỉ gộp `v2` vào `main` sau khi cả nhóm đã thử xong danh sách ở cuối trang.

## Cách 1 (khuyên dùng): Cloudflare Pages – tên miền riêng, tự cập nhật khi push `v2`
Địa chỉ riêng (ví dụ `personavel-v2.pages.dev`) nên dữ liệu trên máy (localStorage), Service Worker và cache **không lẫn** với trang chính.

1. Vào https://dash.cloudflare.com → đăng ký miễn phí bằng email.
2. **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git** → **GitHub** → cho phép truy cập tổ chức **Personavel** → chọn repo `personavel.github.io`.
3. Cài đặt build:
   | Mục | Điền |
   |---|---|
   | Project name | `personavel-v2` (thành `https://personavel-v2.pages.dev`) |
   | Production branch | **`v2`** (không chọn `main`) |
   | Framework preset | None |
   | Build command | *(để trống – file đã build sẵn trong repo)* |
   | Build output directory | `/` |
4. **Save and Deploy**. Khoảng 1 phút là có link. Mỗi lần push lên `v2`, trang tự cập nhật.
5. (Nên làm) Settings → **Builds & deployments** → *Branch deployments* → chỉ `v2`, để các nhánh khác không tự đưa lên.

## Cách 2: GitHub Pages ở một repo riêng
Không cần tài khoản mới, nhưng địa chỉ dạng `https://personavel.github.io/personavel-staging/` **chung tên miền** với trang chính → dữ liệu trên máy dùng chung với trang chính. Khi thử bằng cách này nên dùng **cửa sổ ẩn danh** hoặc một trình duyệt khác.

```bash
# một lần: tạo repo trống Personavel/personavel-staging trên GitHub (Public), rồi:
cd personavel.github.io
git remote add staging https://github.com/Personavel/personavel-staging.git
# mỗi lần muốn cập nhật trang thử:
git push staging v2:main --force
```
Trên GitHub: repo `personavel-staging` → Settings → Pages → *Deploy from a branch* → `main` / `(root)` → Save. Web chạy tốt ở thư mục con vì mọi đường dẫn trong `index.html`, `sw.js`, `manifest.json` đều là đường dẫn tương đối.

## Lưu ý khi thử
- Trang thử nghiệm dùng **chung database Supabase thật** với trang chính: đánh giá gửi lên sẽ hiện cho mọi người. Đặt tên hồ sơ bắt đầu bằng `TEST` để dễ xóa, và thử ở địa điểm ít người xem. Dọn sau khi thử (SQL Editor):
  ```sql
  select id, author, target, body from public.reviews where author ilike 'test%';
  delete from public.reviews where author ilike 'test%';   -- ảnh đi kèm cũng bị gỡ khỏi danh sách duyệt
  ```
- Ảnh tải lên sẽ ở trạng thái "Chờ duyệt" – kiểm tra bằng SQL ở `docs/setup.md` → *Duyệt ảnh mới*.
- Nếu trang thử bị kẹt bản cũ: mở `<địa chỉ>/?nosw` (xóa Service Worker + cache trên máy đó).
- Thẻ `canonical` vẫn trỏ về `https://personavel.github.io/` nên Google không coi trang thử là trang chính.

## Danh sách cần thử (điện thoại thật, 4G và wifi, cả Tiếng Việt lẫn English)
| # | Việc | Đạt khi |
|---|---|---|
| 1 | Mở trang lần đầu | Thấy ngay ảnh Chợ Bến Thành + "Xin chào"; sau đó vào màn chọn ngôn ngữ / trang chủ, không nháy trắng |
| 2 | Font | Chữ tiêu đề Nunito, chữ thư pháp ở màn mở đầu đúng nét, tiếng Việt đủ dấu |
| 3 | Nền bản đồ | Bản đồ hiện nền đường phố (Esri); thử đổi lớp nền; marker gom cụm khi thu nhỏ |
| 4 | Chỉ đường | Chọn 2 điểm → có tuyến đường thật (OSRM), dẫn đường bằng giọng đọc |
| 5 | Gửi đánh giá có ảnh | Đánh giá hiện cho máy khác ngay; ảnh hiện mờ "Chờ duyệt" với người đăng, máy khác chưa thấy ảnh; duyệt bằng SQL xong thì máy khác thấy |
| 6 | Sửa / xóa đánh giá của mình | Sửa xong nội dung đổi; xóa xong máy khác không còn thấy |
| 7 | Báo cáo | Nút "⚑ Báo cáo" đổi thành "Đã báo cáo"; báo 2 lần từ cùng máy chỉ tính 1 |
| 8 | Giới hạn | Gửi liên tục 6 đánh giá trên 1 máy → lần thứ 6 báo "đợi"; 3–4 máy cùng wifi đều gửi được |
| 9 | Cài PWA | Android Chrome: menu ⋮ → *Cài đặt ứng dụng*; iPhone Safari: Chia sẻ → *Thêm vào MH chính*. Icon đúng, mở lên không có thanh địa chỉ |
| 10 | Offline | Mở app 1 lần, bật chế độ máy bay, mở lại → trang chủ, danh sách địa điểm, ảnh đã xem vẫn hiện; bản đồ nền và chỉ đường báo cần mạng |
| 11 | Cập nhật | Push 1 thay đổi nhỏ, để app mở (không gõ chữ) → trong vài phút hiện “Đang cập nhật phiên bản mới…” và tự tải lại sang bản mới; đang gõ chữ thì không bị tải lại giữa chừng |
| 12 | Đăng xuất / đăng nhập lại | Dữ liệu và nền đã chọn của tài khoản cũ còn nguyên |

Khi cả 12 mục đạt: báo nhóm → gộp `v2` vào `main` (`git checkout main && git merge v2 && git push`). Nhánh `legacy` vẫn giữ bản cũ để quay lại nếu cần.
