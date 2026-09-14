# 10. API tham khảo — React Query v5

Danh sách các hook & method thường gặp. Cột "Đã dùng" đánh dấu những cái xuất hiện trong dự án.

## A. Hooks — dùng trong component

| Hook | Công dụng | Đã dùng |
|---|---|---|
| `useQuery` | Đọc/fetch một query | ✅ |
| `useMutation` | Tạo/sửa/xóa (thay đổi dữ liệu) | ✅ |
| `useQueryClient` | Lấy instance queryClient để gọi method | ✅ |
| `useInfiniteQuery` | Phân trang / cuộn vô hạn | |
| `useQueries` | Chạy **nhiều** query song song (số lượng động) | |
| `useSuspenseQuery` | Như `useQuery` nhưng dùng React `<Suspense>` | |
| `useSuspenseInfiniteQuery` | Bản Suspense của infinite query | |
| `useSuspenseQueries` | Bản Suspense của `useQueries` | |
| `usePrefetchQuery` | Prefetch ngay khi render | |
| `useIsFetching` | Đếm số query đang fetch (spinner toàn cục) | |
| `useIsMutating` | Đếm số mutation đang chạy | |
| `useMutationState` | Đọc trạng thái các mutation trong cache | |

## B. Methods của `queryClient`

### Đọc/ghi cache trực tiếp

| Method | Công dụng | Đã dùng |
|---|---|---|
| `getQueryData(key)` | Đọc data trong cache theo key | |
| `setQueryData(key, data)` | Ghi thẳng data vào cache (không fetch) | ✅ |
| `getQueriesData(filter)` / `setQueriesData(...)` | Đọc/ghi nhiều query khớp filter | |
| `getQueryState(key)` | Đọc cả trạng thái (status, error, updatedAt...) | |

### Làm mới / dọn cache

| Method | Công dụng | Đã dùng |
|---|---|---|
| `invalidateQueries(filter)` | Đánh dấu stale + refetch cái active | ✅ |
| `removeQueries(filter)` | Xóa hẳn cache | ✅ |
| `refetchQueries(filter)` | Ép fetch lại (kể cả chưa stale) | |
| `resetQueries(filter)` | Đưa query về trạng thái ban đầu | |
| `cancelQueries(filter)` | Hủy request đang chạy (dùng cho optimistic update) | |
| `clear()` | Xóa **sạch** toàn bộ cache | |

### Fetch chủ động (thường ở server / ngoài component)

| Method | Công dụng | Đã dùng |
|---|---|---|
| `prefetchQuery(opts)` | Fetch trước, nhét vào cache, **không** trả data | ✅ (SSR) |
| `fetchQuery(opts)` | Fetch và **trả về** data (await được) | |
| `ensureQueryData(opts)` | Có cache thì trả luôn, chưa có thì fetch | |
| `prefetchInfiniteQuery` / `fetchInfiniteQuery` | Bản infinite của 2 cái trên | |

### Cấu hình / vòng đời

| Method | Công dụng |
|---|---|
| `setDefaultOptions()` / `getDefaultOptions()` | Option mặc định toàn cục |
| `setQueryDefaults(key, opts)` / `getQueryDefaults(key)` | Mặc định cho nhóm key |
| `setMutationDefaults()` / `getMutationDefaults()` | Tương tự cho mutation |
| `getQueryCache()` / `getMutationCache()` | Truy cập cache cấp thấp |
| `resumePausedMutations()` | Chạy lại mutation bị hoãn (offline) |

## C. Hàm tiện ích độc lập (import trực tiếp)

| Hàm | Công dụng | Đã dùng |
|---|---|---|
| `dehydrate` / `hydrate` | Đóng gói / khôi phục cache (SSR) | ✅ `dehydrate` |
| `keepPreviousData` | Giữ data cũ khi đổi key | ✅ |
| `QueryClient` | Class tạo client | ✅ |
| `QueryCache` / `MutationCache` | Class cache cấp thấp (nâng cao) | |
| `hashKey` | Băm query key thành chuỗi (như RQ làm nội bộ) | |

## D. Các "filter" dùng trong method

Nhiều method nhận một **filter object** để chọn query tác động, không chỉ mỗi `queryKey`:

```ts
queryClient.invalidateQueries({
  queryKey: ["recipes"],   // khớp theo prefix (xem file 04)
  exact: false,            // true = phải khớp CHÍNH XÁC key, không chỉ prefix
  type: "active",          // "active" | "inactive" | "all" — lọc theo trạng thái
  predicate: (query) => true,  // hàm tự lọc tùy ý
});
```

| Thuộc tính | Ý nghĩa |
|---|---|
| `queryKey` | Key để khớp (mặc định theo prefix) |
| `exact` | `true` → chỉ khớp key giống hệt, không tính con cháu |
| `type` | Lọc `active` (đang hiển thị) / `inactive` / `all` |
| `predicate` | Hàm `(query) => boolean` để lọc thủ công |

## Gợi ý API nên học tiếp (chưa dùng trong app)

- **`useInfiniteQuery`** — làm nút "Tải thêm" / cuộn vô hạn cho danh sách recipe.
- **`cancelQueries` + `setQueryData`** — làm **optimistic update** cho nút tim ♥
  (bấm đổi ngay, lỗi thì tự rollback).
- **`useIsFetching`** — thanh loading mảnh ở đầu trang khi có bất kỳ query nào đang chạy.
- **`fetchQuery` / `ensureQueryData`** — prefetch có điều kiện trước khi điều hướng.

> Danh sách theo **v5** (dự án dùng `5.102.4`). Tài liệu chính thức đầy đủ:
> https://tanstack.com/query/latest
