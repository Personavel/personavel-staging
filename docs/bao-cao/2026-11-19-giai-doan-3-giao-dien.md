# Báo cáo Giai đoạn 3 – phần giao diện (19/11/2026)

**Nhánh:** `v3-ui` (tách từ `main` ở `fc73743`, đã gộp `origin/v3-data`) · **Trạng thái:** đã đẩy lên GitHub, **chưa gộp vào `main`** · Trang chính `https://personavel.github.io` vẫn chạy bản cũ.

## 1. Tóm tắt

| Mục | Nội dung | Trạng thái |
|---|---|---|
| 1.1 | Huy hiệu: lưới đều, popup chi tiết | ✅ Xong |
| 1.2 | Chatbot: phạm vi từng trợ lý, phiên chat riêng | ✅ Xong |
| 1.3 | Đăng nhập và trang quản lý tài khoản | ✅ Xong – ⚠️ chưa thử khi đã đăng nhập |
| 1.4 | Nội dung của tôi, bài viết | ✅ Xong – ⚠️ chưa thử khi đã đăng nhập |
| 1.5 | Báo cáo và trang admin | ✅ Xong – ⚠️ chưa thử bằng tài khoản admin |
| 1.6 | Bộ lọc khu vực | ✅ Xong |
| 1.7 | Tuyến đường theo đường phố thật | ✅ Xong – ⚠️ chưa thử với máy chủ chỉ đường thật |
| Thêm | Biểu tượng ứng dụng từ logo của nhóm | ✅ Xong |
| Thêm | Sửa lỗi cũ: `tips.js` làm vỡ trang Lịch trình | ✅ Xong |

“Chưa thử” nghĩa là code đã viết xong và đã thử các trường hợp làm được trên máy (chưa đăng nhập, mất mạng, dữ liệu mẫu), nhưng chưa chạy với tài khoản thật trên database thật – xem mục 4.

## 2. Đã hoàn thành

### 1.1 Huy hiệu – commit `1d3c4a1`
- Lưới huy hiệu các ô đều nhau, căn giữa cả hàng cuối, đúng ở 360–430 px, máy tính bảng và máy tính.
- Bấm vào huy hiệu (Bộ sưu tập và Trang cá nhân) mở popup: biểu tượng, tên, mô tả, điều kiện đạt, ngày đạt hoặc thanh tiến độ (ví dụ 3/5). Huy hiệu chưa đạt hiện mờ kèm cách mở khóa.
- Web bắt đầu ghi ngày đạt huy hiệu. Huy hiệu đạt từ trước hiện “Đã đạt (trước khi web ghi ngày)”.
- Mọi popup trong web: đóng bằng Esc hoặc bấm ra ngoài, giữ focus bên trong, trả focus về chỗ cũ khi đóng.
- File: `src/badges.js`.

### 1.2 Chatbot – commit `0988cc1`
- Phạm vi đã được duyệt: **An** lịch sử – di tích – tên đường · **Uyên** ăn uống · **Hà** lịch trình – đi lại – giờ mở cửa – thời tiết – an toàn · **Kiệt** chụp ảnh – mua sắm · **Phương** văn hóa – kiến trúc – phong tục.
- Chỉ trợ lý đang chọn trả lời. Câu ngoài phạm vi: từ chối lịch sự + nút “Hỏi &lt;tên&gt;” (bấm là chuyển sang trợ lý đó và gửi lại câu hỏi). Câu không liên quan du lịch TP.HCM: từ chối.
- Mỗi trợ lý một phiên chat riêng, giữ khi chuyển qua lại; nút “Cuộc trò chuyện mới” chỉ xóa phiên đang mở. Lịch sử chat cũ được giữ lại.
- Gợi ý câu hỏi riêng theo từng trợ lý.
- Test: `node tests/chat-routing.test.js` – mỗi trợ lý ≥ 5 câu đúng phạm vi và ≥ 5 câu ngoài phạm vi, chạy cả Việt và Anh: **262 đạt, 0 lỗi**.
- File: `src/guides.js`, `tests/chat-routing.test.js`.

### 1.3 Đăng nhập và tài khoản – commit `fd345ca`
- Thư viện `supabase-js 2.119.1` (ghim phiên bản, đã kiểm tra mã integrity của npm), **chỉ tải khi cần** nên người chưa đăng nhập không tải thêm.
- Hộp đăng nhập: “Tiếp tục với Google”, đăng nhập/đăng ký bằng email + mật khẩu, “Quên mật khẩu”.
- Trang `#reset-password`: đặt mật khẩu mới.
- Trang `#account`: đổi tên hiển thị và ngôn ngữ, đổi avatar (thu nhỏ ≤ 512 px WebP, tải lên `avatars/{uid}/avatar.webp`, thêm `?v=` chống ảnh cũ), đổi email, đổi/đặt mật khẩu (tài khoản Google có ghi chú không có mật khẩu), xuất dữ liệu ra `personavel-du-lieu.json`, xóa tài khoản (gõ “XÓA”, gọi Edge Function `delete-account`), đăng xuất.
- Avatar và tên lấy từ `pv_me()`, hiện ở thanh bên (máy tính), thanh dưới (điện thoại) và Trang cá nhân. Màn chào có nút “Đã có tài khoản? Đăng nhập”.
- Lần đăng nhập: nhận đánh giá cũ (`pv_claim_reviews`), gộp dữ liệu trên máy với tài khoản (hợp hai danh sách theo id, mục trùng giữ bản mới hơn), lưu lên tài khoản; sau đó tự đồng bộ 3 giây sau mỗi thay đổi.
- Chưa đăng nhập vẫn dùng đầy đủ. Chỉ đăng ảnh, viết bài và báo cáo mới yêu cầu đăng nhập.
- Mọi lỗi hiển thị bằng câu dễ hiểu, cả Việt và Anh: sai mật khẩu, email chưa xác nhận, gửi quá nhiều lần, hết phiên, các mã `PV_*`, HTTP 401/42501 (= cần đăng nhập). Hàm chưa có trên máy chủ (404/PGRST202) → ẩn tính năng, ghi `console.info` một lần.
- File: `src/cloud.js`, `src/account.js`, `src/vendor/supabase-js-2.119.1.js`.

### 1.4 Nội dung của tôi – commit `05fbc49`
- Mục “Nội dung của tôi” trong Trang cá nhân (`pv_my_content`), lọc Tất cả / Đánh giá / Bài viết, nhãn trạng thái Công khai / Chờ duyệt / Bị ẩn kèm lý do.
- Nút Sửa (`pv_review_save`, `pv_post_save`) và Xóa có hộp xác nhận (`pv_review_delete`, `pv_post_delete`).
- Form viết bài và danh sách bài viết ở trang địa điểm (`pv_list_posts`, “Xem thêm bài viết”) và trong Trang cá nhân.
- Đã đăng nhập: gửi đánh giá bằng `pv_review_save`. Chưa đăng nhập: giữ luồng cũ `pv_upsert_review`.
- File: `src/content.js`.

### 1.5 Báo cáo và admin – commit `aca13f4`
- Nút “⚑ Báo cáo” (đánh giá và bài viết) mở hộp chọn lý do: xúc phạm, spam, sai sự thật, ảnh không phù hợp, khác + ô ghi chú → `pv_report`.
- Trang `#admin` chỉ hiện khi `pv_me().role = 'admin'` (quyền thật do database kiểm tra), 4 tab:
  - **Báo cáo** – xem nội dung gốc, Ẩn (có lý do) / Xóa / Khôi phục / Bỏ qua.
  - **Duyệt ảnh** – lưới ảnh chờ duyệt (có cả ảnh bài viết), Duyệt / Từ chối.
  - **Người dùng** – tìm theo tên hoặc email, khóa / mở khóa quyền đăng bài.
  - **Nhật ký** – 50 thao tác gần nhất.
- Dùng được trên điện thoại.
- File: `src/admin.js`.

### 1.6 Bộ lọc khu vực – commit `925568d`
- Đọc `data/areas.json` (phần dữ liệu cung cấp); không có file thì ẩn bộ lọc.
- Hộp chọn có ô tìm kiếm (gõ có dấu hay không dấu đều được), nhóm theo quận cũ, mỗi phường mới hiện số địa điểm.
- Áp dụng cho Bản đồ (kết hợp được với loại hình, ngân sách, gợi ý) và Bộ sưu tập (lọc dấu mộc, cập nhật số đếm).
- Lựa chọn lưu trong địa chỉ: `#map?area=xuan-hoa`. Bản offline có sẵn dữ liệu khu vực.
- Đã kiểm tra số đếm khớp dữ liệu: Xuân Hòa 13 địa điểm, Bến Thành 27.
- File: `src/areas.js`.

### 1.7 Tuyến đường thật – commit `9f3a2df`
- Đi xe: `router.project-osrm.org`; đi bộ: `routing.openstreetmap.de/routed-foot`.
- Nút Đi bộ / Xe; quãng đường và thời gian từng chặng + tổng; bấm chặng → bản đồ phóng tới chặng đó.
- Lưu đệm IndexedDB theo (tọa độ, cách đi), giữ 30 ngày – mở lại không gọi máy chủ.
- Khi lỗi: đường thẳng nét đứt + thông báo + nút “Mở trong Google Maps”. Có ghi công OSRM và OpenStreetMap.
- Bản đồ chính cũng vẽ tuyến lịch trình theo đường phố.
- File: `src/routes.js`.

### Thêm
- **Biểu tượng ứng dụng** từ logo (commit `d5fc43e`): icon PWA 192/512, bản maskable (Android cắt tròn vẫn đủ chữ), icon iPhone 180, favicon 48. Đổi logo: thay `src/static/logo.png` rồi chạy `python3 src/make_icons.py`.
- **Sửa lỗi cũ có trên `main`**: `tips.js` dùng hàm `esc` chưa khai báo → trang Lịch trình bị lỗi giữa chừng và không hiện bản đồ khi lịch trình có những điểm như Dinh Độc Lập. Đã sửa trên `v3-ui` (commit `9f3a2df`).

## 3. Đã kiểm thử

| Kiểm thử | Kết quả |
|---|---|
| Khung 375 px, tiếng Việt và tiếng Anh, mọi mục trên | Hiển thị đúng, không có lỗi trang |
| Bộ kiểm thử cũ (bản offline, máy tính + điện thoại) | Không lỗi |
| Test định tuyến chatbot | 262 đạt, 0 lỗi |
| Database thật (gọi từ `https://personavel.github.io`, chỉ đọc) | Hàm 🔒 khi chưa đăng nhập → 401/42501; hàm chưa có → 404/PGRST202; sai mật khẩu → `invalid_credentials`; `pv_list_posts` chạy được – web xử lý đúng cả 4 trường hợp |
| Chưa đăng nhập: hộp đăng nhập, `#account`, `#reset-password`, `#admin`, báo cáo, viết bài | Hiện đúng lời nhắc đăng nhập; mất mạng thì báo “Không kết nối được máy chủ” |
| Tuyến đường (dữ liệu OSRM mẫu) | Từng chặng, tổng, phóng chặng, lưu đệm, đổi Đi bộ/Xe, lỗi → đường thẳng + Google Maps |
| Bộ lọc khu vực | Số đếm khớp `data/areas.json`, lưu sau khi tải lại trang |

## 4. Chưa hoàn thành / còn chờ

### Chờ kiểm thử với tài khoản thật
Máy làm việc không vào được Supabase, nên các luồng **khi đã đăng nhập** chưa chạy thật: đăng nhập Google và email, đặt lại mật khẩu qua email, đổi avatar/email/mật khẩu, đồng bộ dữ liệu giữa 2 máy, nhận đánh giá cũ, xuất và xóa tài khoản, Nội dung của tôi, viết/sửa/xóa bài, báo cáo, cả trang admin.
Cần nhóm quyết định:
1. Tạo trang thử nghiệm `Personavel/personavel-staging` (GitHub Pages, `https://personavel.github.io/personavel-staging/`) – địa chỉ này nằm trong Redirect URLs nên đăng nhập Google chạy được. Cách làm ở `docs/staging.md`.
2. Một tài khoản thử, và một tài khoản có `role = 'admin'` (phần dữ liệu bật – phần giao diện không chạy SQL).

### Chờ phần dữ liệu (`docs/data-requests.md`)
- `pv_my_content()` trả thêm `love` và `tags`. Chưa có thì khi sửa đánh giá trên máy khác sẽ mất tim và nhãn đã chọn (giao diện tạm lấy từ dữ liệu trên máy).

### Chưa gộp vào `main`
- Chỉ gộp sau khi trang thử nghiệm chạy ổn (danh sách thử ở `docs/staging.md`). Nhánh `legacy` vẫn giữ bản cũ để quay lại khi cần.
- Icon mới, sửa lỗi `tips.js` và mọi tính năng trên chỉ lên trang chính sau khi gộp.

### Việc nên làm thêm (đề xuất)
- Favicon riêng cho tab trình duyệt: ở 16–32 px logo poster chỉ còn một vệt chữ hồng – nên làm từ một chi tiết của logo (chữ “P” hoặc ghim bản đồ).
- `router.project-osrm.org` là máy chủ dùng thử miễn phí, có giới hạn lượt dùng; nếu nhiều người dùng cùng lúc có thể lỗi (web tự quay về đường thẳng). Khi web đông người nên chuyển sang máy chủ chỉ đường riêng hoặc dịch vụ có hạn mức rõ ràng.
- Xóa tài khoản hiện xóa luôn dữ liệu trên máy (khác với đăng xuất là giữ lại) – nhóm xác nhận cách này.
- Địa chỉ quay về sau khi đăng nhập dùng `location.origin + location.pathname` (trên trang chính giống hệt `https://personavel.github.io/`) để chạy được cả ở trang thử nghiệm trong thư mục con.

## 5. File mới / thay đổi chính

| File | Vai trò |
|---|---|
| `src/badges.js` | lưới + popup huy hiệu, popup giữ focus |
| `src/guides.js`, `tests/chat-routing.test.js` | phạm vi trợ lý, phiên chat, test |
| `src/routes.js` | tuyến đường thật |
| `src/cloud.js`, `src/account.js` | tài khoản, đồng bộ, trang tài khoản |
| `src/content.js` | nội dung của tôi, bài viết |
| `src/admin.js` | báo cáo, trang admin |
| `src/areas.js` | bộ lọc khu vực |
| `src/make_icons.py`, `src/static/` | icon từ logo |
| `src/vendor/supabase-js-2.119.1.js` | thư viện Supabase (ghim) |
| `docs/data-requests.md` | yêu cầu gửi phần dữ liệu |
