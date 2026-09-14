# 11. Tips & lưu ý quan trọng khi dùng React Query

Tổng hợp kinh nghiệm thực chiến, lỗi hay gặp và best practice. Đọc sau khi đã nắm file 03–06.

---

## 🎯 Nhóm 1: Query key & queryFn

### Tip 1.1 — Query key giống "dependency array" của `useEffect`

Bất cứ biến nào `queryFn` dùng để fetch thì **phải** nằm trong query key. Thiếu → data không
cập nhật khi biến đổi; thừa → fetch lại vô ích.

```ts
// ✅ đúng: id nằm trong key
useQuery({ queryKey: ["recipe", id], queryFn: () => fetchRecipe(id) });

// ❌ sai: đổi id nhưng key không đổi → vẫn trả cache cũ của id trước
useQuery({ queryKey: ["recipe"], queryFn: () => fetchRecipe(id) });
```

### Tip 1.2 — Luôn dùng query key factory, đừng gõ tay

Gõ tay `["recipes"]` rải rác → sai chính tả → invalidate trượt mà không báo lỗi. Gom về
`recipeKeys` (xem [04-query-keys.md](04-query-keys.md)).

### Tip 1.3 — Nhận `signal` để hủy request

`queryFn` được truyền `signal` (AbortSignal). Chuyển vào `fetch` để React Query tự hủy request
khi query bị cancel (đổi filter nhanh, rời trang) → đỡ race condition.

```ts
queryFn: ({ signal }) => fetch(url, { signal }).then((r) => r.json());
```

---

## 🎯 Nhóm 2: `staleTime` & refetch

### Tip 2.1 — Mặc định `staleTime = 0`, hãy đặt có chủ đích

Mặc định mọi data **stale ngay lập tức** → React Query refetch rất "hăng" (mỗi lần mount, focus
lại tab, reconnect mạng). Nếu thấy app gọi API liên tục, **tăng `staleTime`**.

```ts
// data ít đổi → để tươi lâu, đỡ gọi API
useQuery({ queryKey, queryFn, staleTime: 5 * 60 * 1000 });
```

Dự án đặt mặc định `60s` trong `queryClient.ts`.

### Tip 2.2 — Các "trigger" khiến query tự refetch

Một query **stale** sẽ tự fetch lại khi: component mount lại, cửa sổ được focus lại, mạng
reconnect, hoặc bị `invalidateQueries`. Tắt bớt nếu không cần:

```ts
refetchOnWindowFocus: false,   // dự án đã tắt cái này
refetchOnReconnect: false,
refetchOnMount: false,
```

### Tip 2.3 — `staleTime` ≠ `gcTime`

`staleTime` = khi nào coi data là cũ (vẫn hiển thị). `gcTime` = khi nào **xóa** khỏi RAM sau khi
hết ai dùng. Đừng nhầm. Chi tiết: [06-quan-ly-cache.md](06-quan-ly-cache.md).

---

## 🎯 Nhóm 3: Trạng thái & render

### Tip 3.1 — `isPending` vs `isFetching` vs `isLoading`

- `isPending`: **chưa có data** (lần đầu, cache trống) → hiện spinner toàn màn.
- `isFetching`: **đang fetch** bất kỳ lúc nào, kể cả refetch nền (vẫn có data cũ) → hiện chỉ báo nhỏ.
- `isLoading` = `isPending && isFetching` (tiện dụng). *(v5 đổi tên `isLoading` cũ → `isPending`.)*

### Tip 3.2 — Đừng copy `data` vào `useState`

Sai lầm kinh điển: `const [items, setItems] = useState(data)`. Làm vậy tạo **bản sao lỗi thời**,
không đồng bộ với cache. Hãy **dùng thẳng `data`**, hoặc **derive** (tính ra) từ nó:

```ts
const { data: recipes } = useRecipes(filters);
// ✅ tính trực tiếp mỗi lần render, luôn khớp cache
const favoriteRecipes = recipes?.filter((r) => favoriteIds.includes(r.id));
```

### Tip 3.3 — Dùng `select` để biến đổi/lọc data

`select` chạy sau khi fetch, chỉ re-render khi **kết quả select** đổi → tối ưu.

```ts
useQuery({
  queryKey, queryFn,
  select: (recipes) => recipes.length,   // component chỉ cần "số lượng"
});
```

---

## 🎯 Nhóm 4: Mutations

### Tip 4.1 — `await` invalidate để giữ trạng thái "đang lưu"

`invalidateQueries` trả về **Promise**. `return` nó trong `onSuccess` để mutation ở trạng thái
`isPending` cho tới khi refetch xong → tránh nút bấm "nhảy" về bình thường trước khi data mới hiện.

```ts
onSuccess: () => {
  return queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
},
```

### Tip 4.2 — `onSuccess` trong hook vs trong `.mutate()` đều chạy

Đặt logic **cache** (invalidate) trong hook (chạy mọi nơi), logic **UI** (đóng modal) trong
`.mutate()` (riêng chỗ gọi). Xem [05-mutations-va-cache.md](05-mutations-va-cache.md).

### Tip 4.3 — Optimistic update: `cancelQueries` → `setQueryData` → rollback

Cập nhật UI **trước** khi server trả lời, lỗi thì hoàn tác. Mẫu chuẩn:

```ts
useMutation({
  mutationFn: updateRecipe,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey });     // hủy refetch đang chạy
    const prev = queryClient.getQueryData(queryKey);   // lưu lại để rollback
    queryClient.setQueryData(queryKey, newData);       // cập nhật lạc quan
    return { prev };
  },
  onError: (_e, _v, ctx) => queryClient.setQueryData(queryKey, ctx.prev),  // lỗi → hoàn tác
  onSettled: () => queryClient.invalidateQueries({ queryKey }),            // xong → đồng bộ lại
});
```

Hợp cho hành động nhẹ, cần phản hồi tức thì (như nút tim ♥).

### Tip 4.3b — `setQueryData` phải cập nhật **bất biến** (immutable)

Đừng sửa trực tiếp object cũ. Tạo object/mảng mới:

```ts
queryClient.setQueryData(key, (old) =>
  old.map((r) => (r.id === id ? { ...r, name } : r)),  // ✅ tạo mới
);
```

### Tip 4.4 — Đã xóa thì `removeQueries`, đừng `invalidateQueries`

Invalidate một item đã xóa → fetch → 404 vô ích. Xem [05](05-mutations-va-cache.md).

---

## 🎯 Nhóm 5: Query phụ thuộc & nhiều query

### Tip 5.1 — `enabled` cho query phụ thuộc

Query cần data của query khác → dùng `enabled` để chờ:

```ts
const { data: user } = useQuery({ queryKey: ["user"], queryFn: fetchUser });
const { data: orders } = useQuery({
  queryKey: ["orders", user?.id],
  queryFn: () => fetchOrders(user.id),
  enabled: !!user?.id,   // chỉ chạy khi đã có user.id
});
```

Dự án dùng cách này trong `useRecipe` (`enabled: !!id`).

### Tip 5.2 — Nhiều query cùng lúc: `useQueries`, không phải `.map(useQuery)`

Không được gọi hook trong vòng lặp. Số query động → dùng `useQueries`:

```ts
const results = useQueries({
  queries: ids.map((id) => ({ queryKey: ["recipe", id], queryFn: () => fetchRecipe(id) })),
});
```

---

## 🎯 Nhóm 6: Xử lý lỗi

### Tip 6.1 — Lỗi cục bộ vs lỗi toàn cục

- Cục bộ: đọc `isError` / `error` ngay tại component (dự án đang làm vậy).
- Toàn cục: cấu hình `QueryCache({ onError })` để toast lỗi một chỗ, hoặc `throwOnError: true`
  để đẩy lên **Error Boundary**.

### Tip 6.2 — `queryFn` phải **ném lỗi** khi thất bại

React Query chỉ biết lỗi nếu Promise **reject**. `fetch` **không** tự throw khi HTTP 4xx/5xx →
phải tự kiểm tra `res.ok` và `throw` (dự án làm trong hàm `assertOk` ở `recipeApi.ts`).

```ts
if (!res.ok) throw new Error("...");   // bắt buộc, nếu không React Query tưởng thành công
```

---

## 🎯 Nhóm 7: Hiệu năng & UX

### Tip 7.1 — `placeholderData: keepPreviousData` khi phân trang/lọc

Giữ data cũ trong lúc fetch bộ mới → danh sách không nhấp nháy về trạng thái trống. Dự án dùng
trong `useRecipes`.

### Tip 7.2 — Prefetch khi hover để mở trang tức thì

```ts
onMouseEnter={() => queryClient.prefetchQuery({ queryKey: recipeKeys.detail(id), queryFn: ... })}
```

Người dùng rê chuột vào → data đã sẵn khi họ click.

### Tip 7.3 — `initialData` vs `placeholderData`

- `initialData`: data **thật**, được coi như đã fetch → lưu vào cache, tính theo `staleTime`.
- `placeholderData`: data **giả tạm** để hiển thị, **không** lưu cache, luôn refetch nền.

---

## 🎯 Nhóm 8: Nguyên tắc kiến trúc

### Tip 8.1 — Đừng nhét server state vào Zustand/useState

Dữ liệu từ API → để React Query lo (cache, refetch, dedupe). Chỉ để tùy chọn UI ở Zustand.
Xem [02-server-vs-client-state.md](02-server-vs-client-state.md).

### Tip 8.2 — Colocate: gom key + queryFn + hook cùng chỗ

Mỗi loại data có một hook riêng (`useRecipes`, `useRecipe`...) đặt cạnh key factory và api layer.
Component chỉ gọi hook, không tự `fetch` — dễ test, dễ đổi endpoint.

### Tip 8.3 — Luôn bật DevTools khi dev

`<ReactQueryDevtools />` cho thấy trực tiếp: key nào đang có, fresh/stale/inactive, số lần fetch,
data trong cache. Học và debug nhanh hơn nhiều so với `console.log`.

---

## ✅ Checklist nhanh khi thêm một query mới

1. [ ] Key có đủ mọi biến `queryFn` dùng? (Tip 1.1)
2. [ ] Lấy key từ **factory**, không gõ tay? (Tip 1.2)
3. [ ] `queryFn` có **throw** khi HTTP lỗi? (Tip 6.2)
4. [ ] `staleTime` hợp lý cho loại data này? (Tip 2.1)
5. [ ] Đã xử lý đủ `isPending` / `isError` / empty? (file 03)
6. [ ] Query phụ thuộc → có `enabled`? (Tip 5.1)

## ✅ Checklist khi thêm một mutation

1. [ ] `onSuccess` có cập nhật cache đúng cách? (invalidate / setQueryData / removeQueries)
2. [ ] `return` promise invalidate nếu muốn giữ `isPending`? (Tip 4.1)
3. [ ] Xóa item → dùng `removeQueries`, không `invalidateQueries`? (Tip 4.4)
4. [ ] Cần phản hồi tức thì → cân nhắc optimistic update? (Tip 4.3)
