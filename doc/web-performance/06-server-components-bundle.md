# 06. Server Components & giảm bundle JavaScript

Đây là **tối ưu tác động lớn nhất** trong Next.js App Router: giảm lượng JS gửi về browser. JS
là thứ đắt nhất — phải tải, parse, execute; càng nhiều JS, INP/LCP càng tệ.

## Server Components (RSC) — không gửi JS về client

Trong App Router, component mặc định là **Server Component**: render trên server thành HTML,
**KHÔNG** gửi code JS của nó về browser. Component chỉ hiển thị dữ liệu (không tương tác) nên là
Server Component thì "miễn phí" về mặt JS.

```
Server Component  → chỉ gửi HTML          → 0 KB JS về client
Client Component  → gửi HTML + JS của nó  → tốn bundle
```

### Nguyên tắc: `"use client"` càng ÍT và càng SÂU càng tốt

Mỗi `"use client"` biến component **và toàn bộ import của nó** thành bundle client. Đặt nó ở lá
cây, giữ phần thân là server.

```
layout.tsx      → Server  (0 JS)
  page.tsx      → Server  (0 JS)
    RecipesPage → "use client"  ← chỉ từ đây trở xuống mới vào bundle
```

> Xem thêm ranh giới server/client: [../react-query/02-server-vs-client-state.md](../react-query/02-server-vs-client-state.md).

### Mẹo: đẩy `"use client"` xuống, giữ phần tĩnh ở server

```tsx
// ❌ cả trang là client vì cần 1 nút tương tác
"use client";
function Page() {
  return <><HeavyStaticContent /><InteractiveButton /></>;  // HeavyStaticContent cũng vào bundle
}

// ✅ page là server, chỉ nút là client
function Page() {                     // Server Component
  return <><HeavyStaticContent /><InteractiveButton /></>;  // chỉ InteractiveButton "use client"
}
```

### Truyền Server Component vào Client Component qua `children`

Client Component có thể **bọc** Server Component nếu nhận qua props/`children` (không import trực tiếp):

```tsx
// ClientWrapper.tsx ("use client") nhận children
<ClientWrapper>
  <ServerHeavyContent />   {/* vẫn render ở server, không vào bundle client */}
</ClientWrapper>
```

## Code splitting — chỉ tải JS khi cần

### `next/dynamic` — lazy load component nặng
Component ít dùng / nặng (modal, chart, editor, map) → chỉ tải khi thật sự render.

```tsx
import dynamic from "next/dynamic";

// RecipeForm nặng (validation, nhiều field) → chỉ tải khi mở modal thêm/sửa
const RecipeForm = dynamic(() => import("./RecipeForm").then((m) => m.RecipeForm), {
  loading: () => <LoadingState />,
});
```

Tùy chọn `ssr: false` để **không** render ở server (cho component chỉ chạy browser, vd dùng
`window`, thư viện chart nặng).

### `React.lazy` + `<Suspense>` (React thuần)
Tương tự cho component không dùng tính năng Next:
```tsx
const Chart = lazy(() => import("./Chart"));
<Suspense fallback={<Spinner />}><Chart /></Suspense>
```

## Giảm kích thước thư viện

- **Import đúng thứ cần**, tránh kéo cả thư viện:
  ```ts
  import debounce from "lodash/debounce";   // ✅ chỉ 1 hàm
  import { debounce } from "lodash";         // ❌ có thể kéo cả lodash
  ```
- **Thay thư viện nặng**: `moment` (rất nặng) → `date-fns` / `dayjs`.
- **`optimizePackageImports`** trong `next.config` giúp tree-shake tốt hơn cho một số package
  (icon libraries, lodash-es...). Kiểm tra doc Next version của bạn.
- **Bỏ dependency thừa**: dự án tự viết `cn` thay vì kéo `clsx` + `tailwind-merge` — chính là
  giảm bundle.

## Đo bundle

- `next build` → xem cột **First Load JS** mỗi route.
- `@next/bundle-analyzer` → treemap thấy package nào chiếm KB (xem [01-do-luong.md](01-do-luong.md)).
- Mục tiêu thực tế: First Load JS mỗi route nên ở mức thấp nhất có thể; để ý khi một import mới
  làm nó phình bất thường.

## Checklist giảm bundle

1. [ ] Component tĩnh (chỉ hiển thị) có đang là Server Component không?
2. [ ] `"use client"` đặt ở lá cây, không ở gốc?
3. [ ] Component nặng/ít dùng có `next/dynamic` chưa?
4. [ ] Có thư viện nặng nào thay được bằng cái nhẹ hơn?
5. [ ] Import theo path con thay vì cả package?
