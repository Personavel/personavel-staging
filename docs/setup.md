# Cài đặt máy chủ cho Personavel

## 1. Supabase (đã cài cho project **Personavel** – `bwtmunpzdxtutspdpphb`)

Database đã chạy đủ 3 migration trong `supabase/migrations/`:

| File | Nội dung |
|---|---|
| `001_reviews.sql` | bảng `reviews`, kho ảnh `review-photos` (công khai, ≤ 1 MB, chỉ WebP/JPEG), các hàm `pv_list_reviews`, `pv_upsert_review`, `pv_delete_review`, `pv_report_review` |
| `002_moderation.sql` | lọc từ ngữ xúc phạm (`pv_is_bad`), giới hạn 5 đánh giá/giờ mỗi mạng và 20 giây giữa 2 lần gửi, bảng `review_reports` (mỗi người chỉ báo cáo 1 lần, 3 người báo cáo thì tự ẩn) |
| `003_review_pages.sql` | `pv_list_reviews_page` – tải đánh giá theo trang (10 mục), kèm tổng số và điểm trung bình |

**Quyền của khóa công khai (anon key) trong web:**
- Không đọc, ghi hay xóa trực tiếp được bảng nào (RLS bật, không có policy, đã `revoke`).
- Chỉ gọi được 5 hàm ở trên. Các hàm tự kiểm tra: từ ngữ, giới hạn tần suất, ảnh phải nằm trong kho `review-photos`, và chỉ người giữ "mã bí mật" của máy mới sửa/xóa được đánh giá của mình.
- Được tải ảnh lên kho `review-photos` (không ghi đè, không xóa, không liệt kê được).
- Không có khóa `service_role` nào trong code.

**Cài lại cho một project mới:** Supabase Dashboard → SQL Editor → chạy lần lượt `001`, `002`, `003`. Sau đó lấy URL và anon key (Settings → API) dán vào `CLOUD` ở đầu `src/community.js`, rồi build lại.

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

## 2. Nền bản đồ – đề xuất
*Hạn mức miễn phí dưới đây theo thông tin công bố gần nhất mà nhóm biết – hãy kiểm tra lại điều khoản trên trang của từng nhà cung cấp trước khi chọn.*

`tile.openstreetmap.org` cấm dùng nhiều cho ứng dụng nên đã bỏ. Hiện web dùng **Esri World Street Map** (chính), **OSM Humanitarian** và **CARTO Voyager** (dự phòng).
- **CARTO Basemaps** – miễn phí cho dự án phi thương mại đến 75.000 lượt xem/tháng, chỉ cần ghi nguồn. Phù hợp nhất với Personavel (dự án học sinh). Không cần đăng ký.
- **MapTiler** (100.000 lượt tải/tháng miễn phí) hoặc **Stadia Maps** (200.000 lượt/tháng cho phi thương mại) – cần tạo tài khoản và một khóa *public* giới hạn theo tên miền `personavel.github.io`. Dùng khi web có nhiều người truy cập hơn.

## 3. Những phần chưa làm (Giai đoạn 3) – cần nhóm tự cài
- **Đăng nhập Google:** Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* (Web) → thêm *Authorized redirect URI* `https://bwtmunpzdxtutspdpphb.supabase.co/auth/v1/callback` → dán Client ID/Secret vào Supabase → Authentication → Providers → Google.
- **SMTP riêng** (email đặt lại mật khẩu): Supabase → Authentication → Emails → SMTP Settings (ví dụ Resend, Brevo hoặc Gmail App Password).
- **Proxy AI cho chatbot:** cần khóa Anthropic API (có tính phí) đặt bằng `supabase secrets set ANTHROPIC_API_KEY=…`, không bao giờ đưa vào code.
