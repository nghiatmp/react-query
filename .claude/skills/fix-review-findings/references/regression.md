# Rule dễ bị chính bản sửa làm hỏng

Tra theo LOẠI thay đổi vừa làm. Chỉ rà những mục ứng với mình, không rà cả bảng.

## Vừa sửa Zustand / `persist` / hydration

- `ZU-03` — có effect nào ghi vào store khi user chưa thao tác? `persist` ghi
  `localStorage` sau MỌI lần `set`, kể cả set cùng giá trị → xoá mất dữ liệu đã lưu.
  **Kiểm bắt buộc:** ghi sẵn state vào `localStorage`, reload, đọc LẠI `localStorage`.
  Đây chính là bug do bản sửa `ZU-01` hôm 04/09 tạo ra.
- `ZU-02` — còn chỗ nào `useState(storeValue)` không? Bật `skipHydration` làm mọi chỗ
  copy store ra state cục bộ đọc được giá trị mặc định.
- `ZU-07` — thêm `draft` cục bộ thì action reset còn đồng bộ được không?
- Không chỉ kiểm trang `/`: kiểm cả `/ssr-demo` (đường render khác).

## Vừa sửa state phía server / route handler / `_store.ts`

- `NX-01` — dữ liệu còn dùng chung giữa layer `rsc` và `app-route` không? Kiểm bằng
  cách ghi qua một đường, đọc qua đường kia.
- `RQ-08` — SSR prefetch còn dùng đúng key client dùng không? Key lệch → client fetch lại.
- `ZOD-02` — server và client còn đi cùng một đường validate không?

## Vừa sửa mutation / cache

- `RQ-04` phạm vi invalidate, `RQ-05` cache của item vừa xoá/sửa, `RQ-06` rollback.
- **Kiểm bằng tay:** thực hiện mutation rồi xem Devtools — query nào refetch, entry nào
  bị xoá. Đúng số lượng mong đợi, không nhiều hơn.
- `RQ-09` — thêm nhánh trạng thái mới thì `isError` còn được xử lý không?

## Vừa sửa component / thêm state cục bộ

- `RQ-01`, `RQ-03` — giá trị mới có vào query key? Đã `trim()` chưa?
- `ZU-04` — selector mới có trả về object/array mới mỗi render?
- `A11Y-01` — `id` mới có trùng với `id` đang tồn tại trong DOM (modal không portal)?
- `A11Y-02` — phần tử tương tác mới có dùng được bằng bàn phím?

## Vừa sửa schema Zod

- `ZOD-04` — type còn suy từ schema, hay đã có `interface` khai song song?
- `ZOD-03` — lỗi mới có thể lọt ra UI dưới dạng khối JSON của `ZodError`?
- Cả server (`route.ts`) và client (`api/*.ts`) đều đã cập nhật theo schema mới?

## Luôn luôn

- `grep -rn "TRACE\|console.log" src/` — log tạm đã xoá hết?
- Dữ liệu test (`ZZ *` trong `_store`, key trong `localStorage`) đã dọn?
- `npx tsc --noEmit` và `npm run lint` — sạch, nhưng **không dùng làm bằng chứng
  hành vi đúng**.
