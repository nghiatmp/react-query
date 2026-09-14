---
name: fix-review-findings
description: Sửa các finding từ một bản review sao cho ăn ngay lần đầu — chốt phạm vi với user, sửa từng finding, chạy điều kiện đóng và dán bằng chứng, rà các rule dễ bị bản sửa làm hỏng. Dùng sau khi có báo cáo review trong doc/reviews/, hoặc khi một vòng sửa trước đó vẫn bị review báo lỗi.
---

# Sửa finding cho ăn ngay lần đầu

Vòng lặp "sửa rồi review vẫn báo lỗi" có ba nguyên nhân, và ba nguyên nhân đó cần ba
cách chặn khác nhau. Đừng gộp chúng lại.

| Nguyên nhân | Dấu hiệu | Chặn bằng |
|---|---|---|
| Sửa theo **mô tả** thay vì theo **nguyên nhân** | Đã làm đúng "Cách sửa" trong báo cáo mà hành vi vẫn sai | Bước 3 + 4: chạy điều kiện đóng, không tin `tsc`/`lint` |
| Bản sửa **tạo ra vi phạm mới** | Review báo finding khác hẳn cái vừa sửa | Bước 5: rà danh sách rule dễ phát sinh |
| Finding **không đúng ý user** | Review cứ báo, user không muốn sửa | Bước 1: chốt trước, đánh dấu `bỏ qua (user quyết)` |

## Bước 1 — Chốt phạm vi VỚI USER trước khi sửa

Đọc file review mới nhất trong `doc/reviews/`. Trình bày lại danh sách rút gọn: mã rule,
mức độ, một câu vấn đề. Rồi hỏi user chốt sửa cái nào.

Mặc định đề xuất: sửa hết `P0` + `P1`, `P2` để user chọn.

Finding user không muốn sửa → ghi ngay `**Trạng thái:** bỏ qua (user quyết)` kèm lý do
vào file review. Từ đó review sau không báo lại nữa. **Đây là cách duy nhất để một
finding ngừng xuất hiện mà không cần sửa** — đừng im lặng bỏ qua, nó sẽ quay lại.

Nếu user đã nói rõ "sửa hết" thì bỏ qua bước hỏi.

## Bước 2 — Sửa từng finding một, không gộp

Làm tuần tự theo thứ tự `P0` → `P1` → `P2`. Với mỗi finding:

1. Đọc lại **Kịch bản lỗi** và **Nguyên nhân**, không chỉ đọc **Cách sửa**. Phần "Cách
   sửa" trong báo cáo là *giả thuyết của người review*, không phải sự thật đã kiểm chứng.
2. Nếu nguyên nhân trong báo cáo không khớp với code thực tế → dừng, nói ra, đừng sửa
   theo mô tả sai.
3. Sửa. Giữ đúng convention repo (comment tiếng Việt giải thích "vì sao", không chỉ "làm gì").

Gộp nhiều finding vào một lần sửa rồi mới kiểm là nguồn của vòng lặp: fail thì không
biết finding nào chưa xong.

## Bước 3 — Chạy điều kiện đóng NGAY, từng finding

Ngay sau khi sửa xong một finding, chạy đúng **Điều kiện đóng** ghi trong báo cáo.

- Pass → đổi `**Trạng thái:** đã đóng` trong file review, kèm output thật (dán vào,
  không diễn giải).
- Fail → **chưa xong**. Quay lại bước 2 cho chính finding đó. Không đi sang finding tiếp
  theo, không báo cáo hoàn thành.
- Điều kiện đóng pass ngay TRƯỚC khi sửa → điều kiện đóng sai hoặc bug không tồn tại.
  Nói ra, đừng lặng lẽ đánh dấu đã đóng.

Báo cáo không có điều kiện đóng chạy được cho một finding `P0`/`P1` → tự dựng lấy một
cái theo `references/verify.md` của skill `review-react-query`, và ghi bổ sung vào file
review.

## Bước 4 — Đo, đừng lập luận

Với bug liên quan tới thứ tự effect, vòng đời hydration, thời điểm ghi storage, hay
luồng dữ liệu server: **suy luận sai là chuyện bình thường**. Đọc
`.claude/skills/review-react-query/references/verify.md` — mục "Khi suy luận không khớp
thực tế" ghi lại hai lần đã sai trong repo này.

Bí thì chèn log tạm kèm `new Error().stack` để biết ai gọi, reload, đọc console, rồi xoá
log (`grep -rn TRACE src/`). Nhanh hơn đoán ba lần.

## Bước 5 — Rà rule dễ bị bản sửa làm hỏng

Đây là bước hay bị bỏ, và là lý do review sau báo finding hoàn toàn mới.

Đọc `references/regression.md`, rà đúng những rule ứng với loại thay đổi mình vừa làm.

## Bước 6 — Chạy hai lệnh nền, rồi báo cáo

```bash
npx tsc --noEmit
npm run lint
```

Báo cáo gồm đúng:

1. Bảng: mã rule · trạng thái mới · điều kiện đóng đã chạy · pass/fail.
2. File nào đã sửa, quyết định thiết kế đáng chú ý (nhất là chỗ làm KHÁC "Cách sửa"
   trong báo cáo, kèm lý do đo được).
3. Vi phạm mới do bản sửa gây ra, nếu có — tự báo, đừng chờ review phát hiện.
4. Finding `bỏ qua (user quyết)`, mỗi cái một dòng.
5. Dấu vết: dữ liệu test đã dọn, log tạm đã xoá, dev server còn chạy hay không.

Không tự commit.
