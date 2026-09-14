# 07. Rendering strategies & Streaming trong Next.js

Chọn **cách render** đúng cho từng trang ảnh hưởng trực tiếp tới LCP/TTFB.

## 4 chiến lược render

| Chiến lược | Khi nào dựng HTML | Hợp với | Đánh đổi |
|---|---|---|---|
| **Static (SSG)** | Lúc `build` | Nội dung ít đổi (landing, blog, docs) | Nhanh nhất, nhưng data "đóng băng" tới lần build sau |
| **ISR** | Build + tái tạo nền theo chu kỳ | Data đổi chậm (danh mục sản phẩm) | Gần nhanh như SSG mà vẫn tươi định kỳ |
| **Dynamic (SSR)** | Mỗi request | Data cá nhân hóa / luôn mới | Chậm hơn (TTFB phụ thuộc server + data) |
| **Client fetch** | HTML rỗng, fetch ở browser | Dashboard sau đăng nhập, data riêng | HTML ra nhanh nhưng có màn loading |

Trong App Router, một trang **mặc định** cố gắng static; sẽ thành dynamic khi bạn dùng dữ liệu
động (cookies, headers, searchParams, hoặc fetch không cache). Bạn cũng có thể ép:

```ts
export const dynamic = "force-dynamic";   // luôn render mỗi request
export const revalidate = 60;             // ISR: tái tạo mỗi 60s
```

> ⚠️ Cơ chế caching/`revalidate` mặc định thay đổi giữa các bản Next. Với dự án này, đối chiếu
> `node_modules/next/dist/docs/` để lấy hành vi chính xác theo version.

## Recipe Planner đang dùng gì

- Trang chủ `/`: **client fetch** (React Query gọi `/api/recipes` ở browser) → HTML ra ngay,
  có spinner một nhịp. Hợp app học/nội bộ.
- `/ssr-demo`: **prefetch trên server** rồi hydrate → HTML có sẵn data (tốt cho LCP/SEO), đổi
  lại server phải chờ fetch. Chi tiết: [../react-query/09-ssr-prefetch.md](../react-query/09-ssr-prefetch.md).

## Streaming + `<Suspense>` — hiện dần, không chờ tất cả

Thay vì chờ **toàn bộ** trang xong mới gửi, Next có thể **stream** HTML theo từng mảnh: phần
nhanh hiện trước, phần chậm (chờ data) hiện sau khi xong. Cải thiện cảm nhận tốc độ + LCP.

### `loading.tsx` — skeleton tự động cho cả route
Đặt file `loading.tsx` cạnh `page.tsx` → Next tự bọc `<Suspense>`, hiện nó **ngay lập tức**
trong khi Server Component (đang `await` data) chưa xong.

```tsx
// app/recipes/loading.tsx
export default function Loading() {
  return <RecipeListSkeleton />;   // hiện ngay, không chờ data
}
```

### `<Suspense>` thủ công — stream từng phần
Bọc riêng phần chậm để phần còn lại hiện trước:

```tsx
export default function Page() {
  return (
    <>
      <Header />                        {/* nhanh, hiện ngay */}
      <Suspense fallback={<Skeleton />}>
        <SlowRecipeList />              {/* Server Component await data → stream vào sau */}
      </Suspense>
    </>
  );
}
```

→ Người dùng thấy Header + skeleton **tức thì**, danh sách "điền vào" khi server fetch xong.
Không còn màn trắng chờ cả trang.

## Partial Prerendering (PPR) — kết hợp static + dynamic

Tính năng mới của Next: một trang có **vỏ tĩnh** (prerender, ra ngay) + các "lỗ" động
(`<Suspense>`) được stream vào. Lấy tốc độ của static + độ tươi của dynamic trong **cùng một
trang**. Còn thử nghiệm ở nhiều version — kiểm tra doc trước khi bật.

## Prefetch điều hướng với `<Link>`

`next/link` **tự prefetch** trang đích khi link lọt viewport (production) → click là chuyển gần
như tức thì. Không cần làm gì thêm; chỉ cần dùng `<Link>` thay cho `<a>`:

```tsx
import Link from "next/link";
<Link href="/ssr-demo">SSR demo</Link>   // dự án đã dùng ở header
```

Muốn tắt cho link ít quan trọng: `<Link prefetch={false}>`.

## Chọn nhanh

- Nội dung công khai, ít đổi, cần SEO → **Static/ISR**.
- Trang cá nhân hóa cần data mới mỗi lần → **SSR (dynamic)** + streaming để đỡ chờ.
- App sau đăng nhập, tương tác nhiều, SEO không quan trọng → **client fetch + React Query**.
- Muốn "best of both" → **streaming/PPR**: vỏ tĩnh + phần động stream sau.
