# 03. React Query cơ bản

## QueryClient — bộ não chứa cache

`QueryClient` là object trung tâm giữ toàn bộ **cache** (mọi data đã fetch) và cấu hình.

File `src/lib/react-query/queryClient.ts`:

```ts
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // data "tươi" trong 60s (xem file 06)
        gcTime: 5 * 60 * 1000,       // giữ cache 5 phút sau khi hết dùng (xem file 06)
        retry: 1,                    // lỗi thì tự thử lại 1 lần
        refetchOnWindowFocus: false, // không refetch khi click lại tab
      },
      mutations: { retry: 0 },
    },
  });
}
```

Ta viết thành **hàm factory** (không phải biến global) để tái sử dụng cả cho client lẫn server.
Lý do sâu hơn: xem [09-ssr-prefetch.md](09-ssr-prefetch.md).

## Provider — cung cấp QueryClient cho toàn app

File `src/app/providers.tsx`:

```tsx
"use client";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Hai điểm quan trọng:

1. **`"use client"`**: bắt buộc, vì `QueryClientProvider` dùng React Context (chỉ chạy client).
2. **`useState(() => makeQueryClient())`**: hàm khởi tạo trong `useState` chỉ chạy **một lần**
   suốt vòng đời component. Nếu viết `useState(makeQueryClient())` (không có `() =>`) thì
   mỗi lần re-render sẽ tạo client mới → **mất sạch cache**. Đây là lỗi rất hay gặp.

`Providers` được bọc quanh app trong `layout.tsx`:

```tsx
<body>
  <Providers>{children}</Providers>
</body>
```

## `useQuery` — đọc/fetch dữ liệu

Cấu trúc tối thiểu: cần **queryKey** (định danh cache) và **queryFn** (hàm fetch trả về Promise).

File `src/features/recipes/hooks/useRecipes.ts`:

```ts
export function useRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: recipeKeys.list(filters),   // ["recipes","list",filters]
    queryFn: () => fetchRecipes(filters), // hàm gọi API
    placeholderData: keepPreviousData,    // giữ data cũ khi đổi filter (đỡ nhấp nháy)
  });
}
```

React Query tự động: gọi `queryFn`, lưu kết quả vào cache theo `queryKey`, chia sẻ cache đó
cho mọi component dùng cùng key, và refetch khi cần.

### `enabled` — bật/tắt query

File `src/features/recipes/hooks/useRecipe.ts`:

```ts
export function useRecipe(id: string | null) {
  return useQuery({
    queryKey: recipeKeys.detail(id ?? ""),
    queryFn: () => fetchRecipe(id as string),
    enabled: !!id,   // chỉ chạy khi có id
  });
}
```

Khi `id` rỗng/null → `enabled: false` → query **nằm im, không gọi API**. Hữu ích khi
chi tiết chỉ cần fetch lúc mở modal.

## Các trạng thái trả về từ `useQuery`

```ts
const { data, isPending, isError, error, isFetching, refetch } = useRecipes(filters);
```

| Thuộc tính | Ý nghĩa |
|---|---|
| `data` | Dữ liệu (undefined khi chưa có) |
| `isPending` | `true` ở **lần tải đầu** khi cache còn trống (chưa có data) |
| `isError` | Query bị lỗi |
| `error` | Object lỗi (dùng `(error as Error).message`) |
| `isFetching` | `true` **mỗi khi** đang gọi API — kể cả refetch nền (đã có data cũ) |
| `refetch()` | Gọi lại query thủ công (dùng cho nút "Thử lại") |

### Phân biệt `isPending` vs `isFetching`

- `isPending`: chưa có gì để hiển thị → nên hiện **spinner toàn màn**.
- `isFetching`: đang cập nhật nhưng vẫn có data cũ để xem → nên hiện **chỉ báo nhỏ** ("Đang cập nhật...").

## Xử lý loading / error / empty

Đây là 4 trạng thái cần xử lý tường minh. File `src/features/recipes/components/RecipeList.tsx`:

```tsx
const { data: recipes, isPending, isError, error, isFetching, refetch } =
  useRecipes({ search, cuisine });

// 1) LOADING — lần đầu, cache trống
if (isPending) return <LoadingState label="Đang tải công thức..." />;

// 2) ERROR — cho phép thử lại bằng refetch()
if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

// 3) EMPTY — thành công nhưng danh sách rỗng
if (recipes.length === 0) return <EmptyState ... />;

// 4) SUCCESS — có data; isFetching báo đang cập nhật nền
return (
  <div>
    {isFetching && <p>Đang cập nhật...</p>}
    {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
  </div>
);
```

Thứ tự `if` này (pending → error → empty → success) là mẫu chuẩn nên thuộc lòng.

## React Query Devtools

Trong `providers.tsx` đã gắn `<ReactQueryDevtools />`. Khi `npm run dev`, panel hiện ở góc
màn hình. Mở lên để **nhìn trực tiếp**: các query key đang có, trạng thái fresh/stale/inactive,
data trong cache, số lần fetch... Cực kỳ hữu ích khi học và debug.
