# Cài đặt máy chủ cho Personavel

## 1. Supabase (đã cài cho project **Personavel** – `bwtmunpzdxtutspdpphb`)

Database đã chạy đủ 4 migration trong `supabase/migrations/`:

| File | Nội dung |
|---|---|
| `001_reviews.sql` | bảng `reviews`, kho ảnh `review-photos` (công khai, ≤ 1 MB, chỉ WebP/JPEG), các hàm `pv_list_reviews`, `pv_upsert_review`, `pv_delete_review`, `pv_report_review` |
| `002_moderation.sql` | lọc từ ngữ xúc phạm (`pv_is_bad`), giới hạn 5 đánh giá/giờ mỗi mạng và 20 giây giữa 2 lần gửi, bảng `review_reports` (mỗi người chỉ báo cáo 1 lần, 3 người báo cáo thì tự ẩn) |
| `003_review_pages.sql` | `pv_list_reviews_page` – tải đánh giá theo trang (10 mục), kèm tổng số và điểm trung bình |
| `004_rate_device_photo_review.sql` | giới hạn mới: **20 đánh giá/giờ mỗi mạng (IP)** + **5 đánh giá/giờ và cách nhau 20 giây mỗi thiết bị**; bảng `review_photos` – **ảnh mới bị ẩn cho tới khi được duyệt** (chỉ người đăng thấy, kèm nhãn "Chờ duyệt"); hàm `pv_approve_photo` chỉ chạy được trong SQL Editor |

**Quyền của khóa công khai (anon key) trong web:**
- Không đọc, ghi hay xóa trực tiếp được bảng nào (RLS bật, không có policy, đã `revoke`).
- Chỉ gọi được 5 hàm `pv_list_reviews`, `pv_list_reviews_page`, `pv_upsert_review`, `pv_delete_review`, `pv_report_review`. Các hàm tự kiểm tra: từ ngữ, giới hạn tần suất, ảnh phải nằm trong kho `review-photos`, và chỉ người giữ "mã bí mật" của máy mới sửa/xóa được đánh giá của mình.
- Được tải ảnh lên kho `review-photos` (không ghi đè, không xóa, không liệt kê được).
- Không có khóa `service_role` nào trong code.

**Cài lại cho một project mới:** Supabase Dashboard → SQL Editor → chạy lần lượt `001` → `004`. Sau đó lấy URL và anon key (Settings → API) dán vào `CLOUD` ở đầu `src/community.js`, rồi build lại.

### Kiểm duyệt (tạm thời, trước khi có trang admin)
Supabase Dashboard → SQL Editor:
```sql
-- xem đánh giá mới nhất và số lượt báo cáo
select id, created_at, kind, target, author, body, hidden, reports from public.reviews order by created_at desc limit 50;
-- ẩn / hiện lại một đánh giá
update public.reviews set hidden = true  where id = '<id>';
update public.reviews set hidden = false, reports = 0 where id = '<id>';
delete from public.review_reports where review_id = '<id>';   -- xóa lượt báo cáo sai
-- xóa hẳn
delete from public.reviews where id = '<id>';
```
Ảnh đánh giá: Dashboard → Storage → `review-photos` (xóa được từng ảnh).

### Duyệt ảnh mới
Ảnh tải lên sau ngày 18/11/2026 mặc định **ẩn với mọi người**, chỉ người đăng thấy (mờ, có nhãn "Chờ duyệt / Pending"). Ảnh cũ đã công khai trước đó được giữ nguyên là "đã duyệt". Mỗi ngày một bạn trong nhóm vào SQL Editor:
```sql
-- 1. danh sách ảnh đang chờ (bấm vào url để xem ảnh)
select rp.uploaded_at, r.author, r.kind, r.target, r.body, rp.url
from public.review_photos rp join public.reviews r on r.id = rp.review_id
where not rp.approved order by rp.uploaded_at;

-- 2. duyệt một ảnh (hiện công khai)
select public.pv_approve_photo('<url>');
-- duyệt hết ảnh đang chờ (chỉ khi đã xem từng ảnh)
update public.review_photos set approved = true, approved_at = now() where not approved;

-- 3. ảnh không phù hợp: giữ ẩn, hoặc bỏ duyệt một ảnh đã công khai
select public.pv_approve_photo('<url>', false);
```
Ảnh xấu muốn xóa hẳn file: Dashboard → Storage → `review-photos` → tìm theo tên file trong url → Delete (đánh giá vẫn còn, ảnh không hiện nữa).

### Giới hạn gửi đánh giá
| Theo | Giới hạn | Ghi chú |
|---|---|---|
| Mạng (IP, chỉ lưu mã băm) | 20 lần gửi/giờ | cả lớp dùng chung wifi vẫn gửi được |
| Thiết bị (mã ngẫu nhiên lưu trong trình duyệt, khóa `pv_deviceId`) | 5 lần gửi/giờ, cách nhau ≥ 20 giây | web bản cũ trên `main` chưa gửi mã thiết bị → tính theo từng tài khoản |

Muốn đổi con số: sửa trong hàm `pv_upsert_review` (migration 004) và `RATE` ở `src/community.js`. Nhật ký gửi (`pv_post_log`) tự xóa sau 2 ngày.

## 2. Service Worker (chạy offline, cài như ứng dụng)
- Trang HTML lấy **mạng trước**, chỉ dùng bản lưu khi mất mạng. JS/CSS có mã băm trong tên file nên lưu cache lâu được.
- Khi nhóm đẩy bản mới, bản mới được tải ngầm và **chờ**; web hiện thanh "Có phiên bản mới – Tải lại". Bấm "Tải lại" mới chuyển bản, không bao giờ tự đổi giữa lúc đang dùng.
- **Gỡ khẩn cấp trên 1 máy:** mở `https://personavel.github.io/?nosw` – xóa Service Worker và toàn bộ cache của web trên máy đó, tắt Service Worker trong tab đó.
- **Gỡ khẩn cấp cho mọi người** (bản mới bị lỗi nặng):
  ```bash
  python3 src/build.py web --kill-sw    # sw.js thành bản "tự hủy": xóa cache, gỡ đăng ký, tải lại trang từ mạng
  git add sw.js && git commit -m "Gỡ Service Worker khẩn cấp" && git push
  ```
  Sửa lỗi xong thì build lại bình thường (`python3 src/build.py web`) và push – Service Worker mới sẽ được cài lại.

## 3. Nền bản đồ – đề xuất
*Hạn mức miễn phí dưới đây theo thông tin công bố gần nhất mà nhóm biết – hãy kiểm tra lại điều khoản trên trang của từng nhà cung cấp trước khi chọn.*

`tile.openstreetmap.org` cấm dùng nhiều cho ứng dụng nên đã bỏ. Hiện web dùng **Esri World Street Map** (chính), **OSM Humanitarian** và **CARTO Voyager** (dự phòng).
- **CARTO Basemaps** – miễn phí cho dự án phi thương mại đến 75.000 lượt xem/tháng, chỉ cần ghi nguồn. Phù hợp nhất với Personavel (dự án học sinh). Không cần đăng ký.
- **MapTiler** (100.000 lượt tải/tháng miễn phí) hoặc **Stadia Maps** (200.000 lượt/tháng cho phi thương mại) – cần tạo tài khoản và một khóa *public* giới hạn theo tên miền `personavel.github.io`. Dùng khi web có nhiều người truy cập hơn.

## 4. Giai đoạn 3 – tài khoản (đã cài ngày 18/11/2026)
- **Đăng nhập Google:** đã xong. Google Cloud project `personavel`, OAuth client *Personavel Web* (origin `https://personavel.github.io`, redirect `https://bwtmunpzdxtutspdpphb.supabase.co/auth/v1/callback`). Supabase → Authentication → Providers → Google: **bật**. Site URL `https://personavel.github.io`, Redirect URLs `https://personavel.github.io/**`.
  - App Google đang ở chế độ **Testing**: chỉ tài khoản trong *Audience → Test users* đăng nhập được. Khi ra mắt: *Publish app*.
  - Trang thử nghiệm (staging) có tên miền khác → thêm vào Redirect URLs của Supabase và *Authorized JavaScript origins* của OAuth client, và vào `ORIGINS` trong `supabase/functions/delete-account/index.ts`.
- **Migration 005** (`supabase/migrations/005_accounts.sql`): đã chạy. Bảng `profiles`, `user_data`, `posts`, `reports`, `mod_log`; cột `reviews.user_id`, `reviews.hidden_reason`; kho ảnh `avatars`. Hàm và lỗi: `docs/data-contract.md`. Kiểm thử: `supabase/tests/005_accounts_test.sql` (chạy trong SQL Editor, tự rollback; 24/24 đạt ngày 18/11/2026).
- **Edge Function `delete-account`**: đã deploy (Dashboard → Edge Functions). Sửa code thì dán lại `supabase/functions/delete-account/index.ts` vào editor của Dashboard rồi *Deploy*.
- **Gán quyền admin** (người đó phải đăng nhập web ít nhất 1 lần):
  ```sql
  update public.profiles set role = 'admin' where id = (select id from auth.users where email = '<email>');
  ```
- **Khu vực địa điểm:** `python3 src/tools/assign_area.py` → `data/areas.json` + `docs/areas.csv`. Các dòng có cột `can_soat = x` được gán theo điểm gần nhất – nhóm mở CSV trong Google Sheets, sửa cột `ward`, tải về CSV rồi chạy `python3 src/tools/assign_area.py --import docs/areas.csv`. Thêm địa điểm mới ở phường chưa có trong danh sách: thêm vào `WARDS` trong script.

- **SMTP Gmail:** đã cài (Authentication → Emails → SMTP Settings): `smtp.gmail.com:465`, người gửi “Personavel” <khanhannguyen240710@gmail.com> (tạm thời – nên đổi sang Gmail riêng của dự án), mật khẩu = App Password của Gmail đó. Gmail cho ~500 thư/ngày. Đổi Gmail: tạo App Password mới (cần Xác minh 2 bước) → sửa Sender email + Username + Password → Save.
- **Mẫu email tiếng Việt:** đã cài 6 mẫu (xác nhận đăng ký, lời mời, liên kết đăng nhập, đổi email, đặt lại mật khẩu, mã xác minh). Nguồn: `supabase/templates/build_templates.py` → `*.html` + `subjects.json`. Sửa nội dung → chạy lại script → dán HTML vào Authentication → Emails → Templates → mẫu tương ứng, tiêu đề lấy từ `subjects.json`.

### Còn phải làm
- **Migration 006 (sau khi giao diện tài khoản lên `main`):** chỉ người đã đăng nhập mới tải ảnh lên `review-photos` (hiện vẫn cho khách để web cũ chạy).
- **Proxy AI cho chatbot:** cần khóa Anthropic API (có tính phí) đặt bằng `supabase secrets set ANTHROPIC_API_KEY=…`, không bao giờ đưa vào code.
