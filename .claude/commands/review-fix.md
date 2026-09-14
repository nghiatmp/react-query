---
description: Review thay đổi hiện tại, chốt phạm vi với tôi, sửa và tự kiểm chứng bằng điều kiện đóng
argument-hint: "[phạm vi, để trống = toàn bộ thay đổi chưa commit]"
---

Chạy vòng review → sửa → kiểm chứng cho: $ARGUMENTS

1. Gọi agent `review-code`. Nó sẽ tự dùng skill `review-react-query` và ghi báo cáo ra
   `doc/reviews/`.
2. **Mốc dừng:** trình bày bảng finding rút gọn, hỏi tôi chốt sửa cái nào. Finding tôi
   không chọn thì đánh dấu `bỏ qua (user quyết)` kèm lý do.
3. Gọi skill `fix-review-findings` và sửa **ở session chính**, không giao cho subagent —
   vòng sửa cần đo → điều chỉnh → đo lại, mà subagent không quay lại hỏi giữa đường được.
4. Với mỗi finding: chạy điều kiện đóng, dán output thật, cập nhật trạng thái trong file
   review. Fail thì sửa tiếp, không đi sang finding khác.
5. Rà `references/regression.md` theo loại thay đổi vừa làm, tự báo vi phạm mới nếu có.
6. Chỉ khi mọi finding đã `đã đóng` hoặc `bỏ qua` mới gọi lại `review-code` để re-review
   (nó sẽ đọc file cũ và chỉ báo `còn mở` / `mới phát sinh`). Không tự commit.
