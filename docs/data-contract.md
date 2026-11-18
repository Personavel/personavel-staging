# Hợp đồng dữ liệu – Giai đoạn 3

Giao diện (`src/`) chỉ nói chuyện với database qua các hàm dưới đây (`supabase.rpc(tên, tham số)`).
Đã chạy trên Supabase ngày 18/11/2026 (migration `005_accounts.sql`; `007_my_content_love_tags.sql` ngày 19/11/2026). Cần thêm hàm → ghi vào `docs/data-requests.md`.

🔒 = phải đăng nhập · 👑 = phải có `role = 'admin'`

## Lỗi
Lỗi do hàm trả ra nằm trong `error.message`, luôn bắt đầu bằng `PV_`:

| Mã | Nghĩa | Gợi ý câu hiển thị |
|---|---|---|
| `PV_AUTH` | chưa đăng nhập / hết phiên | “Bạn cần đăng nhập” |
| `PV_BANNED` | tài khoản bị khóa quyền đăng bài | “Tài khoản tạm bị khóa đăng bài” |
| `PV_RATE_LIMIT` | gửi quá nhanh (10 lần/giờ, cách nhau ≥ 20 giây mỗi tài khoản; 40 lần/giờ mỗi mạng) | “Bạn gửi hơi nhanh, thử lại sau ít phút” |
| `PV_BAD_WORDS` | có từ ngữ không phù hợp | “Nội dung có từ ngữ không phù hợp” |
| `PV_NOT_OWNER` | không phải nội dung của mình | |
| `PV_NOT_FOUND` | không còn tồn tại | |
| `PV_TOO_LONG` | quá dài / quá nhiều ảnh | |
| `PV_INVALID` | tham số sai (tên rỗng, ảnh ngoài kho, lý do báo cáo lạ…) | |
| `PV_FORBIDDEN` | không phải admin, hoặc admin khóa admin khác | |

**Chú ý:** gọi hàm 🔒 khi **chưa đăng nhập** (chỉ có khóa anon) → PostgREST trả HTTP 401, `code: "42501"` (“permission denied”), không phải `PV_AUTH`. Xử lý như `PV_AUTH`.

## Hồ sơ và dữ liệu cá nhân 🔒
| Hàm | Tham số | Trả về |
|---|---|---|
| `pv_me()` | — | `{id, display_name, avatar_url, lang, role, banned, created_at, updated_at}` – tự tạo hồ sơ nếu chưa có |
| `pv_update_profile` | `p_display_name, p_avatar_url, p_lang` (null = giữ nguyên; `p_avatar_url = ''` = xóa ảnh) | hồ sơ mới. Đổi tên thì tên trên các đánh giá cũ cũng đổi |
| `pv_claim_reviews` | `p_token` (= `pv_cloudToken`) | số đánh giá nhận về. Sau khi nhận, máy đó lúc đăng xuất không sửa/xóa được nữa |
| `pv_get_user_data()` | — | `{journal, trips, favorites, badges, points, …, updated_at}` hoặc `null` |
| `pv_save_user_data` | `p_data` (object, ≤ 1 MB) | `{updated_at}` |
| `pv_export_my_data()` | — | `{exported_at, account, profile, user_data, reviews, posts, reports}` |
| Edge Function `delete-account` | `POST /functions/v1/delete-account`, header `Authorization: Bearer <access_token của người dùng>` | `{ok:true}` / 401 `{error:"PV_AUTH"}` |

- `avatar_url` chỉ nhận ảnh trong kho `avatars` của project hoặc ảnh Google (`*.googleusercontent.com`).
- Kho `avatars`: công khai để xem; người dùng chỉ ghi/xóa trong `{uid}/…`; ≤ 512 KB; webp/png/jpeg. URL công khai: `https://bwtmunpzdxtutspdpphb.supabase.co/storage/v1/object/public/avatars/{uid}/avatar.webp`.
- Đăng ký mới → hồ sơ tự tạo, tên lấy từ Google (lọc từ ngữ xấu) hoặc “Du khách”.

## Nội dung
| Hàm | Tham số | Trả về |
|---|---|---|
| 🔒 `pv_review_save` | `p_kind ('place'\|'site'), p_target, p_stars (0–5), p_love, p_tags, p_body (≤ 800), p_photos (≤ 4)` | `{id, kind, target, author, stars, love, tags, body, photos, status, hidden_reason, created_at, updated_at}` – mỗi tài khoản 1 đánh giá / địa điểm (gửi lại = sửa) |
| 🔒 `pv_review_delete` | `p_id` | `true` |
| 🔒 `pv_post_save` | `p_id` (null = mới), `p_title (≤ 120), p_body (≤ 4000), p_photos (≤ 6), p_place` | `{id, place, title, body, photos, status, hidden_reason, author_name, author_avatar, created_at, updated_at}` |
| 🔒 `pv_post_delete` | `p_id` | `true` |
| `pv_list_posts` | `p_place` (null = tất cả), `p_limit = 10` (≤ 30), `p_before` | `[{id, author_name, author_avatar, place, title, body, photos, created_at, updated_at}]` – chỉ ảnh đã duyệt |
| 🔒 `pv_my_content()` | — | `[{type, id, kind, target, title, body, stars, love, tags, photos, status, hidden_reason, created_at, updated_at}]` – bài viết: `kind`, `stars`, `love`, `tags` = `null`, `target = place` (`love`/`tags` thêm ở migration 007) |
| 🔒 `pv_report` | `p_type ('review'\|'post'), p_id, p_reason ('abuse'\|'spam'\|'false_info'\|'bad_photo'\|'other'), p_note (≤ 300)` | `true` – 3 người báo cáo → tự ẩn |

- `status`: `public` · `pending` (còn ảnh chưa duyệt; nội dung chữ vẫn hiện) · `hidden`.
- Ảnh phải tải lên kho `review-photos` trước (như hiện nay), dạng `…/storage/v1/object/public/review-photos/<đường dẫn>`.
- Hàm cũ cho khách chưa đăng nhập vẫn chạy: `pv_list_reviews`, `pv_list_reviews_page`, `pv_upsert_review`, `pv_delete_review`, `pv_report_review`.

## Admin 👑
| Hàm | Tham số | Trả về |
|---|---|---|
| `pv_admin_reports` | `p_status ('open'\|'resolved'\|'dismissed')` | `[{id, type, target_id, reason, note, reporter_name, created_at, content, report_count}]` (≤ 200) |
| `pv_admin_moderate` | `p_type, p_id, p_action ('hide'\|'delete'\|'restore'\|'dismiss'), p_reason` | `true` – đóng mọi báo cáo đang mở của nội dung đó, ghi nhật ký |
| `pv_admin_pending_photos()` | — | `[{id, url, review_id, post_id, author_name, created_at}]` |
| `pv_admin_photo` | `p_id, p_approve` | `true` – từ chối = gỡ ảnh khỏi đánh giá/bài viết (file vẫn trong Storage) |
| `pv_admin_users` | `p_query` (tên hoặc email, null = mới nhất) | `[{id, display_name, email, avatar_url, role, banned, created_at, review_count}]` (≤ 50) |
| `pv_admin_set_ban` | `p_user, p_banned` | `true` (không khóa được admin) |
| `pv_admin_log` | `p_limit = 50` | `[{id, admin_name, action, target_type, target_id, reason, created_at}]` |

`content` của báo cáo: đánh giá `{kind, target, author, stars, body, photos, hidden, hidden_reason, user_id}`; bài viết `{place, title, body, photos, hidden, hidden_reason, author, user_id}`; `null` nếu đã bị xóa.

## Khu vực – `data/areas.json`
```json
{
  "version": "2025-07",
  "areas": [{"slug": "xuan-hoa", "ward": "Phường Xuân Hòa", "district_old": "Quận 3", "count": 13}],
  "places": {"h8": "xuan-hoa"}
}
```
Tạo bằng `python3 src/tools/assign_area.py` (xem `docs/setup.md` mục 4).

## Khác với bản trong prompt giao diện
- Thêm mã lỗi `PV_AUTH`, `PV_NOT_FOUND`, `PV_INVALID`, `PV_FORBIDDEN` và trường hợp 401/42501 ở trên.
- `pv_admin_pending_photos` có thêm `post_id`; `pv_list_posts`/`pv_post_save` có `author_avatar`; `areas[]` có `count`; `pv_me` có `updated_at`.
