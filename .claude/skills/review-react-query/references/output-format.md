# Định dạng báo cáo

Đúng thứ tự dưới đây. Không thêm mục, không bỏ mục.

## 1. Dòng mở đầu

Phạm vi (bao nhiêu file, thuộc phần nào) + kết quả `tsc` và `lint`. Một đến hai câu.

## 2. Bảng tổng hợp

| Mức | Mã | File:line | Vấn đề (≤12 từ) | Kiểm chứng |
|---|---|---|---|---|
| P0 | NX-01 | `src/app/api/recipes/_store.ts:20` | Store bị nạp 2 bản giữa các bundle layer | đã chạy |
| P1 | ZU-01 | `src/stores/recipePreferencesStore.ts:41` | Thiếu `skipHydration`, mismatch sau reload | đã chạy |
| P2 | ZOD-01 | `src/features/recipes/api/recipeApi.ts:91` | `deleteRecipe` không parse response | chỉ đọc code |

Cột `Kiểm chứng` chỉ nhận hai giá trị: `đã chạy` hoặc `chỉ đọc code`. Không có giá trị
thứ ba, không để trống.

## 3. Chi tiết từng finding

Sắp xếp P0 → P1 → P2. Mỗi finding đúng bốn phần, không dài dòng:

```
### P0 · NX-01 · src/app/api/recipes/_store.ts:20

**Kịch bản lỗi:** user thêm công thức ở `/` (qua route handler) → mở `/ssr-demo`
→ trang SSR vẫn chỉ hiện 3 món seed, vĩnh viễn không thấy thay đổi.

**Nguyên nhân:** `ssr-demo/page.tsx:5` import `listRecipes` ở layer `rsc`, route
handler import cùng module ở layer `app-route`; Next bundle riêng → hai bản `recipes`.

**Kiểm chứng:** đã chạy — POST tạo "ZZ Probe" qua API: `/api/recipes` thấy (1),
`/ssr-demo?cb=…` không thấy (0), kể cả khi bust cache. Đã DELETE dọn dẹp.

**Cách sửa:** gắn dữ liệu vào `globalThis` qua object bọc ngoài, giữ nguyên mọi chỗ import.

**Điều kiện đóng:** POST một món qua `/api/recipes`, rồi `curl "/ssr-demo?cb=$RANDOM"`
phải thấy món đó (`grep -c` trả về `1`, hiện tại là `0`). Xoá món test sau khi kiểm.
```

**"Điều kiện đóng" là phần quan trọng nhất của finding.** Nó phải:

- **Chạy được**: một lệnh, hoặc một chuỗi thao tác browser cụ thể. Không được viết
  "kiểm tra lại xem còn mismatch không".
- **Có giá trị mong đợi rõ ràng**: `1` chứ không phải "thấy dữ liệu"; "console không có
  lỗi nào" chứ không phải "ít lỗi hơn".
- **Nêu giá trị HIỆN TẠI (khi còn bug)**: để người sửa biết mình đang đo đúng thứ. Điều
  kiện đóng mà pass ngay từ trước khi sửa là điều kiện sai.
- **Độc lập với cách sửa**: đo hành vi, không đo việc "đã thêm dòng `skipHydration` chưa".
  Nếu điều kiện đóng chỉ kiểm tra sự tồn tại của một dòng code thì nó vô dụng — bản sửa
  hôm 04/09 có đúng dòng đó mà app vẫn hỏng.

Finding `P0`/`P1` KHÔNG có điều kiện đóng chạy được thì chưa xong việc review.

## 4. Đã kiểm tra và ĐÚNG

Liệt kê các mã rule đã rà và không có vấn đề, mỗi mã một dòng ngắn kèm bằng chứng.
Mục này bắt buộc — nó cho người đọc biết review đã phủ tới đâu, và ngăn việc lần sau
review lại từ đầu.

Ví dụ: `RQ-07 ✓ — getQueryClient.ts:14 dùng cache(), providers.tsx:20 dùng useState(() => …)`.

## 5. Ghi ra file bàn giao

Ngoài phần trả lời, ghi TOÀN BỘ báo cáo vào `doc/reviews/<YYYY-MM-DD>-<slug>.md`.
Đây là thứ người sửa và lần re-review sau đọc lại. Mỗi finding thêm một dòng trạng thái
ngay dưới tiêu đề, khởi tạo là `mở`:

```
### P0 · NX-01 · src/app/api/recipes/_store.ts:20
**Trạng thái:** mở
```

Giá trị hợp lệ: `mở` · `đã đóng` · `bỏ qua (user quyết)`. Chỉ người sửa được đổi trạng
thái, và chỉ khi đã chạy điều kiện đóng — xem skill `fix-review-findings`.

## 6. Dấu vết để lại

Bắt buộc có, kể cả khi trống. Ghi rõ: dữ liệu test đã tạo/xoá, log tạm đã thêm/xoá,
dev server còn chạy hay không, `localStorage` đã dọn chưa.

Nếu không sạch được, nói thẳng còn sót gì ở đâu.

## Chế độ re-review

Khi được gọi lại sau một bản sửa, ĐỌC file `doc/reviews/` gần nhất TRƯỚC KHI review.
Không review lại từ đầu như chưa có gì. Phân loại từng finding vào đúng một trong ba:

| Trạng thái | Nghĩa | Việc phải làm |
|---|---|---|
| `đã đóng` | Điều kiện đóng chạy lại vẫn pass | Chạy lại chính điều kiện đó, dán output. Pass → không nhắc lại nữa. |
| `còn mở` | Điều kiện đóng vẫn fail | Nói rõ bản sửa làm gì mà chưa đủ, KHÔNG lặp lại nguyên văn finding cũ. |
| `mới phát sinh` | Rule mới bị vi phạm bởi chính bản sửa | Ghi rõ "do bản sửa finding nào gây ra". |

Báo cáo re-review mở đầu bằng đúng một dòng đếm: `đã đóng: n · còn mở: n · mới phát sinh: n`.

Finding `bỏ qua (user quyết)` thì **không báo cáo lại**, chỉ liệt kê ở cuối dưới dạng
một dòng nhắc. User đã quyết rồi, không phán lại.

## Cấm

- Kết luận "có thể có vấn đề", "nên xem lại" mà không có kịch bản lỗi cụ thể.
- Finding không có mã rule (trừ `NEW`, kèm đề xuất bổ sung vào checklist).
- Tự ý sửa file. Skill này chỉ đọc và báo cáo.
