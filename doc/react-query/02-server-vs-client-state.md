# 02. Server state vs Client state & `"use client"`

Đây là khái niệm nền tảng nhất. Hiểu sai chỗ này sẽ dùng nhầm công cụ.

## Hai loại "state" trong app

| | Server state | Client state |
|---|---|---|
| Là gì | Dữ liệu **thuộc về server**, ta chỉ mượn tạm | Trạng thái **thuần giao diện**, do người dùng tạo |
| Ví dụ | Danh sách recipe, chi tiết recipe | Filter đang chọn, grid/list, danh sách yêu thích |
| Đặc điểm | Có thể cũ, cần đồng bộ, nhiều người dùng chung | Chỉ của riêng phiên/trình duyệt này |
| Ai quản lý | **React Query** | **Zustand** (hoặc useState) |

**Câu hỏi để phân loại:** "Dữ liệu này có nằm trên server và người khác cũng thấy không?"
- Có → server state → React Query.
- Không (chỉ là tùy chọn hiển thị của tôi) → client state → Zustand.

### Vì sao không nhét server state vào Zustand/useState?

Vì server state có hàng loạt vấn đề mà React Query giải sẵn:
caching, dedupe request trùng, refetch nền, đánh dấu cũ (stale), retry khi lỗi,
đồng bộ nhiều component... Nếu tự quản bằng `useState` bạn phải viết lại tất cả.

### Vì sao không nhét client state (favorites) vào React Query?

Vì favorites **không đến từ server** — không có API nào để fetch. Nó là lựa chọn cục bộ,
muốn sống sót qua reload thì lưu localStorage (Zustand persist). Xem [07-zustand.md](07-zustand.md).

## "Server" và "Client" là hai nơi CHẠY CODE khác nhau

Trong Next.js, cùng một đoạn React có thể chạy ở 2 nơi:

- **Server** = máy chạy Next.js (máy dev khi `npm run dev`, hoặc máy chủ khi deploy).
  Nhiệm vụ: dựng ra HTML rồi gửi về. Chạy **theo từng request rồi vứt đi**.
- **Client** = trình duyệt trên **máy người dùng**. App sống liên tục trong tab
  cho tới khi đóng/F5.

> Chi tiết vòng đời "tạo rồi vứt" của server và vì sao mỗi request cần state riêng:
> xem [09-ssr-prefetch.md](09-ssr-prefetch.md).

## Server Component vs Client Component

Next.js App Router mặc định **mọi component là Server Component**. Chỉ khi thêm dòng
`"use client"` ở đầu file thì nó mới thành Client Component.

| | Server Component (mặc định) | Client Component (`"use client"`) |
|---|---|---|
| Chạy ở đâu | Chỉ trên server | Server (render HTML lần đầu) **và** browser |
| Dùng được `useState`, `useEffect`, hook? | ❌ Không | ✅ Có |
| Bắt sự kiện `onClick`, `onChange`? | ❌ Không | ✅ Có |
| Dùng React Context (vd QueryClientProvider)? | ❌ Không | ✅ Có |

### Nguyên tắc: đặt `"use client"` càng SÂU càng tốt

Chỉ đánh dấu client những component **thực sự cần** tương tác/hook. Giữ phần trên
là server để tận dụng SSR và giảm JS gửi về browser.

Trong dự án:

```
layout.tsx        → Server  (chỉ bọc <Providers>)
  page.tsx        → Server  (chỉ render <RecipesPage/>)
    RecipesPage   → "use client"  (có useState mở modal, dùng hook React Query)
      RecipeList  → "use client"  (dùng useRecipes)
      RecipeForm  → "use client"  (có state form, onChange)
```

- `layout.tsx` và `page.tsx` **không** cần `"use client"` → giữ là server.
- `providers.tsx` **bắt buộc** `"use client"` vì `QueryClientProvider` dùng Context.

### Vì sao Providers phải "use client" mà lại đặt trong layout (server)?

Được phép: một Server Component có thể render một Client Component bên trong.
Layout (server) render `<Providers>` (client), và Providers cung cấp QueryClient cho
toàn bộ cây con. Xem [03-react-query-co-ban.md](03-react-query-co-ban.md).

## Trong app này, code fetch chạy ở đâu?

Trang chủ: **toàn bộ fetch ở client**. Các hook `useRecipes`, `useRecipe`... đều nằm trong
component `"use client"`. Nên:

```
Server:  gửi HTML khung trang (chưa có data) + code JS
Browser: chạy useRecipes() → gọi /api/recipes → nhận data → lưu cache Ở ĐÂY
```

→ Với trang chủ, **cache 100% ở browser**. Trang `/ssr-demo` là ngoại lệ có chủ đích
(fetch trên server), xem [09-ssr-prefetch.md](09-ssr-prefetch.md).
