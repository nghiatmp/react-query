# 09. SSR Prefetch & Hydration

> Đây là phần nâng cao. Trang chủ của app **không** dùng SSR (fetch hoàn toàn ở client).
> Trang `/ssr-demo` được tạo riêng để minh họa và so sánh.

## Vấn đề: cache trên server và chuyện "rò rỉ dữ liệu"

Trên **browser**, mỗi người dùng một máy, một bộ nhớ riêng → cache không thể lẫn. Nên ở client
ta tạo **1 QueryClient dùng chung** (trong `providers.tsx`).

Trên **server** thì khác: một tiến trình Next.js phục vụ **nhiều người cùng lúc, chung một vùng
nhớ**. Hình dung server như **bếp nhà hàng**, mỗi người vào web là một khách gọi món:

```
Khách A mở trang → Bếp lấy 1 KHAY MỚI, nấu, bày HTML, bưng cho A → DỌN KHAY (xóa bộ nhớ request)
Khách B mở trang → Bếp lấy 1 KHAY MỚI khác, nấu lại từ đầu...   → DỌN KHAY
```

Server **không nhớ gì giữa các request**: mỗi lần có người mở trang là một request, chạy code →
dựng HTML → gửi đi → **giải phóng bộ nhớ tạm của lần đó**. Đó là ý *"tạo xong rồi vứt"*.

**Nếu dùng chung 1 QueryClient global trên server:**
1. User A (đã đăng nhập) vào → server fetch data riêng của A → lưu cache chung.
2. Ngay sau, User B vào → server thấy cache đã có → **trả nhầm data của A cho B**.

→ **Rò rỉ dữ liệu giữa các user** (lỗi bảo mật nghiêm trọng). Cách tránh: **mỗi request một
QueryClient mới**. Đó là lý do ta viết `makeQueryClient()` dạng factory thay vì biến global.

## QueryClient riêng cho server

File `src/lib/react-query/getQueryClient.ts`:

```ts
import { cache } from "react";
import { makeQueryClient } from "./queryClient";

export const getQueryClient = cache(() => makeQueryClient());
```

`cache()` của React đảm bảo: trong **cùng một request**, gọi `getQueryClient()` nhiều lần chỉ
nhận **đúng 1 instance** (tránh tạo trùng). Sang request khác (người khác) → **instance mới**.
Chính là "mỗi khách một khay riêng, xong thì bỏ".

## SSR prefetch: fetch trên server, gửi kèm HTML

File `src/app/ssr-demo/page.tsx` (Server Component — không có `"use client"`):

```tsx
export default async function SsrDemoPage() {
  const queryClient = getQueryClient();          // (1) client riêng cho request này

  await queryClient.prefetchQuery({              // (2) fetch NGAY trên server
    queryKey: recipeKeys.list(filters),
    queryFn: () => listRecipes(filters),         //     gọi thẳng data layer (không qua HTTP)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>  {/* (3) đóng gói cache vào HTML */}
      <SsrRecipeList />
    </HydrationBoundary>
  );
}
```

Luồng đầy đủ:

```
   SERVER (chạy khi mở /ssr-demo)                    BROWSER
   ─────────────────────────────────                 ─────────────────────────
   1. getQueryClient()  ← "khay mới"
   2. prefetchQuery → fetch data, nhét vào cache
   3. dehydrate(client) → cache thành JSON
      nhúng vào HTML  ──────────────────────────▶    4. Nhận HTML đã có sẵn tên món + JSON
   (request xong → khay bị DỌN,                       5. <HydrationBoundary> nạp JSON vào
    cache server biến mất)                               QueryClient phía client
                                                      6. useRecipes() thấy data NGAY
                                                         → không fetch lại, không loading
```

- **`prefetchQuery`**: fetch và nhét vào cache, **không trả data** (khác `fetchQuery` có trả).
- **`dehydrate(queryClient)`**: serialize cache thành JSON để nhúng vào HTML.
- **`<HydrationBoundary state={...}>`**: phía client nạp (hydrate) JSON đó vào QueryClient →
  `useQuery` cùng key thấy data có sẵn.

Điều kiện để client "nhận" được data: **query key phải khớp**. `SsrRecipeList` phải dùng đúng
`useRecipes(filters)` với cùng `filters` đã prefetch. Sai key = coi như chưa có, phải fetch lại.

## Bằng chứng: so sánh HTML thô

```bash
# Trang chủ (client-fetch): tên món KHÔNG có trong HTML server gửi
curl -s http://localhost:3000/ | grep -c "Spaghetti Carbonara"          # → 0

# /ssr-demo (SSR prefetch): tên món ĐÃ nằm sẵn trong HTML
curl -s http://localhost:3000/ssr-demo | grep -c "Spaghetti Carbonara"  # → 1
```

Hoặc bấm **Ctrl/Cmd + U** (View Source) trên mỗi trang để thấy tận mắt. Trên `/ssr-demo`,
banner còn hiện `isPending = false` ngay lần render đầu → không có spinner.

## Đánh đổi — khi nào nên dùng

| | Client-fetch (trang chủ) | SSR prefetch (/ssr-demo) |
|---|---|---|
| HTML trả về | Nhanh, nhưng chưa có data | Chậm hơn (server chờ fetch xong) nhưng có sẵn data |
| Màn loading | Có (một nhịp) | Không |
| SEO | Kém hơn (data đến sau) | Tốt (data có trong HTML) |
| Độ phức tạp | Thấp | Cao hơn |

→ App học/nội bộ: client-fetch thường **đủ**. SSR prefetch dành cho trang cần SEO hoặc muốn
hiện data tức thì. Route `/ssr-demo` có delay 600ms trong mock nên bạn sẽ thấy nó "khựng" một
chút trước khi hiện — đó chính là cái giá của việc server chờ fetch xong mới trả HTML.

## Liên hệ lại câu hỏi thường gặp

- *"Cache lưu ở server à? Tôi tưởng ở client?"* → Trang chủ: cache 100% ở client. `/ssr-demo`
  chỉ **dựng sẵn** cache ở server trong 1 request rồi **chuyển giao** (hydrate) sang client;
  sau đó cache sống tiếp ở client như thường.
- *"Tạo xong trên server lại xóa là sao?"* → Bản chất server chạy theo request rồi thu hồi bộ
  nhớ. Cache server chỉ sống đúng 1 request, vừa đủ dựng HTML rồi biến mất.
