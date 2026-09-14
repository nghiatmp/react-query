# 02. Hiểu cơ chế re-render của React

Muốn tối ưu render, phải hiểu **khi nào** React re-render. Hầu hết vấn đề hiệu năng React là
**re-render thừa**.

## Re-render là gì?

Re-render = React **gọi lại hàm component** để tính ra JSX mới, rồi so sánh (diff) với lần trước
để cập nhật DOM. Re-render **không** đồng nghĩa với "cập nhật DOM" — nếu kết quả giống hệt, DOM
không đổi, nhưng **việc chạy lại hàm + diff vẫn tốn CPU**. Nhiều component re-render liên tục →
main thread bận → tương tác giật (INP kém).

## 3 nguyên nhân khiến component re-render

1. **State của chính nó đổi** (`useState`, `useReducer`).
2. **Component cha re-render** → mặc định **mọi con cũng re-render** (dù props không đổi!).
3. **Context nó đang dùng đổi giá trị**.

> Điểm gây bất ngờ nhất là (2): **cha render là con render theo**, kể cả props y hệt. Đây là
> nguồn gốc phần lớn re-render thừa.

## Ví dụ re-render lan truyền

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <ExpensiveList />   {/* KHÔNG dùng count, nhưng vẫn re-render mỗi lần bấm nút */}
    </div>
  );
}
```

Bấm nút → `Parent` re-render → `ExpensiveList` re-render dù chẳng liên quan gì `count`.

## 4 cách chặn re-render lan truyền

### Cách 1 — Đẩy state xuống thấp nhất (state colocation)
Nếu chỉ `button` cần `count`, tách nó ra component riêng giữ state → `ExpensiveList` không bị ảnh
hưởng. **Đây là cách tốt nhất, không cần memo.** Xem [04-state-context.md](04-state-context.md).

### Cách 2 — Truyền qua `children` (component composition)
```tsx
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <div><button onClick={...}>{count}</button>{children}</div>;
}
// <Parent><ExpensiveList /></Parent>
```
`children` được tạo ở component **bên ngoài** Parent → Parent re-render **không** tạo lại
`children` → `ExpensiveList` không re-render. Mẹo rất mạnh, ít người biết.

### Cách 3 — `React.memo`
Bọc component để nó **bỏ qua** re-render khi props không đổi. Xem [03-memo-hoa.md](03-memo-hoa.md).

### Cách 4 — React Compiler (React 19)
Tự động memo hóa, giải quyết phần lớn re-render thừa **không cần bạn làm gì**. Xem file 03.

## Chọn state slice để giảm re-render (áp dụng trong dự án)

Với store toàn cục (Zustand), **lấy đúng phần cần dùng** thay vì cả object. Trong
`RecipeCard.tsx` dự án đã làm đúng:

```tsx
// ✅ chỉ re-render khi favorite của ĐÚNG card này đổi
const isFavorite = useRecipePreferences((s) => s.favoriteIds.includes(recipe.id));

// ❌ nếu lấy cả store → mọi card re-render khi bất kỳ field nào đổi
const store = useRecipePreferences();
```

Với danh sách nhiều card, khác biệt này rất lớn: bấm tim 1 món mà **mọi** card re-render là lãng phí.

## Hiểu lầm phổ biến

- ❌ "Re-render là xấu, phải chặn hết." → Sai. Re-render là bình thường và thường **rất nhanh**.
  Chỉ chặn khi Profiler cho thấy nó **thực sự** tốn thời gian.
- ❌ "Component nhận props mới thì mới re-render." → Sai. Cha render là con render, bất kể props.
- ❌ "`useMemo`/`useCallback` làm app nhanh hơn." → Chỉ đúng khi dùng đúng chỗ; lạm dụng còn
  chậm hơn (tốn bộ nhớ + so sánh). Xem file 03.

## Cách kiểm chứng

Bật **"Highlight updates"** trong React DevTools (file 01). Gõ vào ô search của Recipe Planner
và xem: lý tưởng chỉ `RecipeList` + các card nháy, không phải cả trang. Nếu header, filter bar
cũng nháy theo → có re-render thừa cần xử lý.
