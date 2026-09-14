# Kiểm chứng finding

`tsc` sạch + `lint` sạch KHÔNG chứng minh được gì về hành vi lúc chạy. Hai bug P0/P1
nặng nhất từng gặp trong repo này đều lọt qua cả hai.

## Dev server

Kiểm tra trước, đừng tự khởi động cái mới:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Không chạy thì ghi `Kiểm chứng: chưa (dev server không chạy)` và hạ finding runtime
xuống `P2`. Đừng đoán rồi để nguyên P0.

## Kiểm chứng luồng dữ liệu server

Mẫu đã dùng để chứng minh bug NX-01 — tạo dữ liệu qua một đường, đọc qua đường khác:

```bash
NEW=$(curl -s -X POST http://localhost:3000/api/recipes \
  -H 'Content-Type: application/json' -d '{...}')
ID=$(echo "$NEW" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s http://localhost:3000/api/recipes        | grep -c "ZZ Probe"   # layer app-route
curl -s "http://localhost:3000/ssr-demo?cb=$RANDOM" | grep -c "ZZ Probe"   # layer rsc
curl -s -X DELETE "http://localhost:3000/api/recipes/$ID"                   # DỌN DẸP
```

Bắt buộc: đặt tên dữ liệu test có tiền tố `ZZ` để dễ nhận ra, xoá ngay sau khi xong, và
ghi trong báo cáo là đã tạo/xoá những gì. `?cb=$RANDOM` để loại trừ nguyên nhân cache.

## Kiểm chứng hydration / persist

Dùng browser tool, không suy luận:

1. Ghi sẵn state vào `localStorage` (`localStorage.setItem('recipe-preferences', ...)`).
2. Reload trang.
3. `read_console_messages` với `onlyErrors: true` → có mismatch hay không.
4. Đọc LẠI `localStorage` → **state còn nguyên hay đã bị ghi rỗng**. Bước này hay bị bỏ
   và chính nó phát hiện bug ZU-03.
5. Kiểm tra cả `/` (static) và `/ssr-demo` (SSR prefetch) — hai đường render khác nhau.
6. Dọn: `localStorage.removeItem('recipe-preferences')`.

## Khi suy luận không khớp thực tế

Đã đo sai hai lần trong repo này, ghi lại để không lặp:

- **Thứ tự effect không suy ra được từ cây component.** Đã giả định effect của Providers
  chạy sau effect của component con (quy tắc "cha sau con"). Đo thật thì `rehydrate` của
  Providers chạy TRƯỚC effect của `RecipeFilters`.
- **StrictMode chạy effect hai lượt khi mount.** Lượt hai có thể rơi vào sau `rehydrate`,
  nên guard kiểu "so sánh với `getState()` rồi mới ghi" vẫn ghi đè. Phải guard bằng
  "user đã thao tác chưa".

Cách đo khi bí: chèn log tạm ngay trong action của store và quanh `rehydrate`, kèm
`new Error().stack` để biết ai gọi, reload, đọc console, rồi **xoá log** (`grep -rn TRACE src/`
để chắc chắn không sót).

Kết luận rút ra: khi finding liên quan tới thứ tự effect, vòng đời hydration, hay thời
điểm ghi storage — **đo, đừng lập luận**.
