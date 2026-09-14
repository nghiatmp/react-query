---
description: Chạy pipeline làm 1 tính năng: phân tích yêu cầu → thiết kế UI → code → test → review
argument-hint: <mô tả tính năng>
---

Làm tính năng sau theo pipeline, dừng lại xin xác nhận ở các mốc đã ghi:

**Tính năng:** $ARGUMENTS

1. Gọi agent `phan-tich-yeu-cau` để viết spec vào `doc/specs/`.
2. **Mốc dừng:** trình bày tóm tắt spec + câu hỏi mở, chờ tôi chốt trước khi code.
3. Nếu tính năng có UI mới: gọi `thiet-ke-ui` (có thể chạy song song với bước phân tích nếu UI đã rõ).
4. Implement — tự làm trong session chính nếu chỉ sửa vài file; chỉ giao cho `code-tinh-nang` khi có nhiều phần độc lập chạy song song được.
5. Chạy song song `viet-test` và `review-code` trong cùng một lượt.
6. Tổng hợp: sửa các finding nghiêm trọng, liệt kê phần cố ý bỏ qua kèm lý do. Không tự commit.
