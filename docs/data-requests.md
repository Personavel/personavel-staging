# Yêu cầu thêm cho phần dữ liệu

Phần giao diện ghi vào đây những gì cần thêm ở database (chưa có trong `docs/data-contract.md`). Phần dữ liệu làm xong thì đánh dấu ✅.

## 1. ✅ `pv_my_content()` trả thêm `love` và `tags` (cho mục 1.4) – xong ở migration 007
- **Vì sao:** nút “Sửa” ở *Nội dung của tôi* gọi `pv_review_save`, hàm này cần `p_love` và `p_tags`. Hiện `pv_my_content` không trả hai trường này, nên khi sửa trên máy khác (chưa có bản lưu trên máy) giao diện phải gửi `p_love = false`, `p_tags = []` → mất tim và nhãn đã chọn.
- **Mong muốn:** thêm cột `love boolean` và `tags text[]` vào kết quả `pv_my_content()` (bài viết: `null`). Không đổi các cột cũ.
- Giao diện dùng `love`/`tags` từ `pv_my_content()`; nếu thiếu (máy chủ cũ) thì lấy từ dữ liệu trên máy.

