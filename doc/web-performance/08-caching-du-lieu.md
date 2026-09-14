# 08. Caching & tối ưu tầng dữ liệu

Data lấy đúng cách = ít request, phản hồi nhanh. Có **2 tầng cache** cần phân biệt: cache của
Next.js (phía server) và cache của React Query (phía client).

## Hai tầng cache — đừng nhầm

| | Next.js caching | React Query cache |
|---|---|---|
| Ở đâu | Trên **server** (giữa các request/người dùng) | Trên **client** (RAM của browser) |
| Cache gì | Kết quả `fetch`, render trang, route | Kết quả query đã fetch ở browser |
| Áp dụng cho | Server Component, route handler | Component `"use client"` dùng `useQuery` |

Recipe Planner fetch ở client → chủ yếu dùng **React Query cache**. Nếu chuyển sang fetch trong
Server Component thì Next caching mới vào cuộc.

## Tối ưu bằng React Query (đã có tài liệu riêng)

Các kỹ thuật giảm request/tăng tốc — xem chi tiết trong bộ react-query:

- **`staleTime`** hợp lý → tránh refetch thừa mỗi lần mount/focus.
  → [../react-query/06-quan-ly-cache.md](../react-query/06-quan-ly-cache.md)
- **Dedupe tự động**: nhiều component gọi cùng `queryKey` → chỉ **1** request, chia sẻ cache.
- **`keepPreviousData`** → đổi filter không nhấp nháy về loading.
- **Prefetch khi hover** → mở chi tiết tức thì:
  ```tsx
  onMouseEnter={() => queryClient.prefetchQuery({
    queryKey: recipeKeys.detail(id), queryFn: () => fetchRecipe(id),
  })}
  ```
- **Optimistic update** → UI phản hồi ngay, không chờ server.
  → [../react-query/11-tips-va-luu-y.md](../react-query/11-tips-va-luu-y.md)

## Next.js caching (khi fetch trên server)

Khi dùng `fetch` trong Server Component, Next có thể cache kết quả để không gọi lại API mỗi request:

```ts
// tùy version Next — kiểm tra doc để biết mặc định
fetch(url, { cache: "force-cache" });                  // cache lâu dài
fetch(url, { next: { revalidate: 60 } });              // ISR: làm mới mỗi 60s
fetch(url, { cache: "no-store" });                     // luôn lấy mới (dynamic)
fetch(url, { next: { tags: ["recipes"] } });           // gắn tag để revalidate có chủ đích
```

Làm mới theo chủ đích sau mutation (trong Server Action / route):
```ts
import { revalidateTag, revalidatePath } from "next/cache";
revalidateTag("recipes");     // làm mới mọi fetch gắn tag "recipes"
revalidatePath("/recipes");   // làm mới một đường dẫn
```

> ⚠️ **Mặc định cache của `fetch` và Route Handler thay đổi nhiều giữa các bản Next** (14 → 15 →
> 16). Đừng đoán — mở `node_modules/next/dist/docs/` của dự án để xác nhận hành vi thực tế.

## Chống gọi API thừa từ tương tác người dùng

### Debounce ô search
Gõ mỗi phím gọi API là lãng phí. Chỉ gọi khi người dùng **ngừng gõ** ~300ms:

```tsx
const [input, setInput] = useState("");
const debounced = useDeferredValue(input);   // cách React 19, không cần lib
// hoặc dùng debounce cổ điển:
useEffect(() => {
  const t = setTimeout(() => setSearchInStore(input), 300);
  return () => clearTimeout(t);
}, [input]);
```

> Recipe Planner hiện set search vào Zustand ngay mỗi phím → mỗi phím đổi query key → gọi API.
> Với data thật nên **debounce** để giảm request. Đây là một cải tiến đáng làm.

### Throttle sự kiện dày (scroll, resize, mousemove)
Giới hạn tần suất chạy handler (vd tối đa 1 lần/100ms) để không nghẽn main thread.

## Việc tính toán nặng: Web Worker

Tính toán CPU nặng (parse file lớn, xử lý ảnh, thuật toán) chạy trên main thread sẽ **đơ UI**.
Đẩy sang **Web Worker** (luồng khác) để main thread rảnh lo tương tác. Cân nhắc khi có tác vụ
tính toán > vài chục ms lặp lại.

## Tóm tắt tầng dữ liệu

1. Client fetch → tối ưu bằng React Query (`staleTime`, dedupe, prefetch, optimistic).
2. Server fetch → tối ưu bằng Next caching (`revalidate`, tags).
3. Chặn request/handler thừa → debounce/throttle.
4. Tính toán nặng → Web Worker.
