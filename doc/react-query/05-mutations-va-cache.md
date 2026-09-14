# 05. Mutations & cập nhật cache

## `useQuery` vs `useMutation`

- **`useQuery`**: ĐỌC dữ liệu (GET). Tự chạy khi component mount.
- **`useMutation`**: THAY ĐỔI dữ liệu (POST/PUT/DELETE). **Không** tự chạy — bạn gọi
  `.mutate()` khi có hành động (bấm nút Lưu/Xóa).

## Cấu trúc một mutation

File `src/features/recipes/hooks/useCreateRecipe.ts`:

```ts
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,          // hàm gọi API, trả Promise
    onSuccess: () => {
      // sau khi tạo xong → làm mới các danh sách
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
```

Dùng trong component:

```tsx
const createMutation = useCreateRecipe();

createMutation.mutate(values, {
  onSuccess: () => closeModal(),   // callback riêng cho lần gọi này
});

// Trạng thái:
createMutation.isPending  // đang gửi request
createMutation.isError    // thất bại
createMutation.error      // object lỗi
```

`onSuccess` khai báo trong hook (chạy mọi lần) và `onSuccess` truyền vào `.mutate()`
(chạy riêng lần đó) **đều chạy** — cả hai, không loại trừ nhau.

## Vì sao phải cập nhật cache sau mutation?

Sau khi thêm/sửa/xóa trên server, **cache của các query vẫn là data cũ**. Nếu không làm gì,
UI sẽ hiển thị dữ liệu lỗi thời (thêm món mới nhưng danh sách chưa có nó). Có 3 công cụ chính.

## Ba cách cập nhật cache

### 1. `invalidateQueries` — đánh dấu cũ + refetch

```ts
queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
```

Làm **2 việc**:
1. Đánh dấu mọi query khớp key là **stale** (cũ).
2. Query nào đang **active** (đang hiển thị trên màn) → **tự fetch lại** ngay.

→ Dùng khi data **vẫn còn tồn tại** nhưng đã cũ (danh sách cần lấy lại để có món mới).

> Query **stale nhưng inactive** (không component nào dùng) sẽ **không** fetch ngay — chỉ
> được đánh dấu cũ, và refetch **lần sau khi được dùng lại**. Chi tiết ở phần "1 hay 2 API" bên dưới.

### 2. `setQueryData` — ghi thẳng data vào cache (không fetch)

File `src/features/recipes/hooks/useUpdateRecipe.ts`:

```ts
onSuccess: (updated: Recipe) => {
  // (1) ghi ngay data mới vào cache chi tiết → UI đổi tức thì, KHÔNG cần gọi API
  queryClient.setQueryData(recipeKeys.detail(updated.id), updated);

  // (2) danh sách thì invalidate để refetch (tên/mô tả mới hiện đúng)
  queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
},
```

→ Dùng khi bạn **đã có sẵn data mới** (server trả về recipe sau khi update) → nhét thẳng vào
cache, nhanh hơn và không tốn request.

### 3. `removeQueries` — xóa hẳn cache

File `src/features/recipes/hooks/useDeleteRecipe.ts`:

```ts
onSuccess: ({ id }) => {
  queryClient.removeQueries({ queryKey: recipeKeys.detail(id) });   // xóa cache chi tiết món đã xóa
  queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });  // refetch danh sách
},
```

→ Dùng khi data đó **không còn tồn tại**. Món đã xóa khỏi server thì cache chi tiết của nó
vô nghĩa → xóa thẳng, **không** fetch.

## `removeQueries` vs `invalidateQueries` — bảng so sánh

| | `invalidateQueries` | `removeQueries` |
|---|---|---|
| Làm gì | Đánh dấu stale + refetch cái đang active | **Xóa hẳn** cache khỏi RAM |
| Có gọi lại API không | ✅ Có | ❌ Không |
| Dùng khi | Data vẫn còn, chỉ cũ | Data không còn tồn tại/không cần |

⚠️ **Lỗi thường gặp:** dùng `invalidateQueries` cho chi tiết một món **vừa xóa** → React Query
cố fetch `/api/recipes/{id}` → server trả **404** → query rơi vào error vô ích. Đã xóa thì
phải dùng `removeQueries`.

## Invalidate khớp 2 query — có gọi 2 API không?

Giả sử invalidate khớp cả A `["recipes","list",{all}]` và B `["recipes","list",{italian}]`.
Số request phụ thuộc query nào đang **active**:

```
A (all)     ← đang hiển thị trên màn → active
B (italian) ← đã xem trước đó, giờ không hiện → inactive
```

| Query | Đánh dấu stale? | Gọi API ngay? |
|---|---|---|
| A (đang hiện) | ✅ | ✅ có — vì active |
| B (không hiện) | ✅ | ❌ không — inactive, để dành |

→ **Chỉ 1 API call.** B sẽ refetch **lần sau khi bạn lọc lại sang "italian"** (lúc đó nó
active + đang stale → mới fetch). Chỉ khi cả A và B **cùng hiển thị một lúc** mới thành 2 call.

Đây là điểm "thông minh" của React Query: cứ invalidate rộng cho chắc, nó **không** dại dột
gọi lại mọi API — chỉ tốn request cho cái đang xem, phần còn lại refetch **lười** đúng lúc cần.

## Bảng tổng kết: mutation nào dùng gì

| Mutation | Cache chi tiết | Cache danh sách |
|---|---|---|
| Create | — (chưa có id) | `invalidateQueries(lists())` |
| Update | `setQueryData(detail(id), updated)` | `invalidateQueries(lists())` |
| Delete | `removeQueries(detail(id))` | `invalidateQueries(lists())` |
