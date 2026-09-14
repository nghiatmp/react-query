# 05. Danh sách lớn: key, virtualization, phân trang

Danh sách dài là "hố đen" hiệu năng: render hàng nghìn DOM node làm chậm cả tải lẫn tương tác.

## Key ổn định — nền tảng

`key` giúp React biết item nào là item nào giữa các lần render. **Luôn dùng id ổn định**, đừng
dùng index khi danh sách có thể thêm/xóa/sắp xếp.

```tsx
{recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}   // ✅ id
{recipes.map((r, i) => <RecipeCard key={i} recipe={r} />)}   // ❌ index → sai state, render lỗi
```

Dùng `key={index}`: khi xóa/chèn giữa danh sách, React ghép nhầm state/DOM → vừa lỗi vừa render
thừa. Recipe Planner dùng `key={recipe.id}` là đúng.

## Vấn đề: render TẤT CẢ item cùng lúc

Danh sách 1000 recipe = 1000 card trong DOM, dù màn hình chỉ thấy ~10. Tốn RAM, chậm render,
scroll giật. Người dùng **không nhìn thấy** 990 cái còn lại.

## Giải pháp 1: Virtualization (windowing) ⭐

Chỉ render những item **đang lọt trong viewport** (+ đệm vài cái), tái sử dụng DOM khi cuộn. 1000
item → chỉ ~15 node trong DOM tại một thời điểm.

Thư viện khuyến nghị: **`@tanstack/react-virtual`** (cùng nhà React Query, nhẹ, headless).

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualRecipeList({ recipes }: { recipes: Recipe[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: recipes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,   // chiều cao ước lượng mỗi card (px)
    overscan: 5,               // render thêm 5 item ngoài viewport cho mượt
  });

  return (
    <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const recipe = recipes[virtualRow.index];
          return (
            <div
              key={recipe.id}
              style={{
                position: "absolute", top: 0, left: 0, width: "100%",
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <RecipeCard recipe={recipe} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Khi nào cần: danh sách **> vài trăm item** hiển thị cùng lúc. Vài chục item thì không cần
(virtualization thêm phức tạp). Alternative: `react-window`, `react-virtuoso` (grid dễ hơn).

## Giải pháp 2: Phân trang / Infinite scroll (kết hợp React Query)

Thay vì tải hết, tải **từng trang**. `useInfiniteQuery` của React Query lo việc gộp trang + trạng thái:

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["recipes", "infinite", filters],
  queryFn: ({ pageParam }) => fetchRecipesPage(filters, pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.nextPage,  // undefined = hết trang
});

const recipes = data?.pages.flatMap((p) => p.items) ?? [];
// nút "Tải thêm":
<button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
  {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
</button>
```

Tự động "tải thêm" khi cuộn tới cuối: dùng `IntersectionObserver` để gọi `fetchNextPage()` khi
phần tử "sentinel" ở cuối danh sách lọt viewport.

## Kết hợp cả hai (danh sách rất lớn)

Infinite query (tải dần từ server) **+** virtualization (chỉ render phần thấy) = xử lý được
danh sách khổng lồ mà vẫn mượt. `@tanstack/react-virtual` có ví dụ tích hợp sẵn với `useInfiniteQuery`.

## Mẹo phụ cho danh sách

- `React.memo` cho item card → khi 1 item đổi, các item khác không render lại (kết hợp key ổn định).
- Tránh tạo hàm/`onClick` inline mới cho mỗi item nếu card đã memo (dùng `useCallback` hoặc truyền id).
- Ảnh trong card: `loading="lazy"` hoặc `next/image` (xem [09-hinh-anh-font.md](09-hinh-anh-font.md)).

## Áp dụng cho Recipe Planner

Hiện danh sách nhỏ (3 món) nên **chưa cần** virtualization. Khi thêm nhiều recipe:
1. Trước tiên chuyển sang `useInfiniteQuery` + nút "Tải thêm".
2. Khi số item hiển thị lớn (> vài trăm) → thêm `@tanstack/react-virtual`.
