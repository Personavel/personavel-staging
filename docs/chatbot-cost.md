# Ước tính chi phí chatbot AI qua proxy (mục 3.8)

Giá Anthropic API (bảng giá cập nhật 03/11/2026, USD cho 1 triệu token):

| Model | Vào (input) | Ra (output) | Ghi chú |
|---|---|---|---|
| Claude Haiku 5.5 (`claude-haiku-5-5`) | $0,10 | $0,50 | cho câu hỏi ≤ 100K token; suy nghĩ (thinking) bật mặc định, tính như token ra |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`) | $2 | $10 | đọc cache $0,10 |
| Claude Opus 5.5 (`claude-opus-5-5`) | $4 | $20 | đọc cache $0,20 |

## Giả định cho 1 câu hỏi
- Đầu vào ≈ **4.000 token**: lời dặn của trợ lý (~1.500) + dữ liệu địa điểm liên quan (~1.500) + lịch sử chat đã cắt ngắn (~1.000).
- Đầu ra ≈ **800 token**: câu trả lời ~300 + phần suy nghĩ ~500.
- Chưa tính giảm giá nhờ prompt caching (lời dặn + dữ liệu cố định có thể cache → rẻ hơn nữa với Sonnet/Opus).

## Chi phí
| | 1 câu | 100 câu | 1.000 câu | 10.000 câu |
|---|---|---|---|---|
| **Haiku 5.5** | ~$0,0008 | ~$0,08 | **~$0,80** | ~$8 |
| Sonnet 5.5 | ~$0,016 | ~$1,6 | ~$16 | ~$160 |
| Opus 5.5 | ~$0,032 | ~$3,2 | ~$32 | ~$320 |

(1 USD ≈ 25.000–26.000 đ → Haiku: 1.000 câu ≈ 20.000 đ.)

## Đề xuất
- Dùng **Haiku 5.5**, effort `low` (chat ngắn, không cần suy nghĩ sâu) – rẻ hơn Sonnet khoảng 20 lần; đủ cho hỏi đáp du lịch khi có dữ liệu địa điểm đưa kèm.
- Giới hạn trong Edge Function: khách ~10 câu/ngày/IP, đã đăng nhập ~30 câu/ngày; cắt câu hỏi ≤ 500 ký tự, lịch sử ≤ 6 lượt.
- Đặt **giới hạn chi tiêu (spend limit)** hằng tháng trong Anthropic Console (ví dụ $5) để không bao giờ vượt ngân sách; hết hạn mức thì chatbot tự quay về trả lời bằng kho dữ liệu trên máy.
- Ví dụ: 200 người dùng × 5 câu/ngày × 30 ngày = 30.000 câu/tháng ≈ **$24/tháng** với Haiku 5.5 (≈ 600.000 đ). Lớp học thử nghiệm vài chục người: dưới $1/tháng.
