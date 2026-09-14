# 10. Checklist & tip thực chiến

Tổng hợp để tra nhanh. Chi tiết ở các file 01–09.

## ⭐ 10 tip tác động lớn nhất (React/Next)

1. **Giảm JS về client**: giữ component tĩnh là Server Component, `"use client"` ở lá cây. → file 06
2. **Đo trước khi tối ưu**: React Profiler + Lighthouse, đừng memo theo cảm tính. → file 01
3. **Lấy đúng state slice** (Zustand selector) thay vì cả store → tránh re-render hàng loạt. → file 02
4. **Đặt state càng thấp càng tốt** (colocation) → thu hẹp phạm vi re-render. → file 04
5. **Virtualize danh sách lớn** (`@tanstack/react-virtual`) khi > vài trăm item. → file 05
6. **`staleTime` hợp lý** cho React Query → cắt refetch thừa. → file 08
7. **Debounce ô search** → mỗi phím không gọi 1 API. → file 08
8. **`next/image` + `priority` cho ảnh LCP** → LCP nhanh, không CLS. → file 09
9. **`next/dynamic`** cho component nặng/ít dùng (modal, chart). → file 06
10. **Streaming + `<Suspense>`/`loading.tsx`** → hiện dần, không chờ cả trang. → file 07

## Checklist theo Core Web Vitals

### Cải thiện LCP (≤ 2.5s)
- [ ] Ảnh LCP dùng `next/image` + `priority`.
- [ ] Giảm TTFB: static/ISR nếu được; streaming nếu SSR.
- [ ] Không để JS/CSS chặn render phần đầu trang.
- [ ] `next/font` với `display: swap`.

### Cải thiện INP (≤ 200ms) — quan trọng nhất với React
- [ ] Không có re-render thừa (Profiler + "Highlight updates").
- [ ] Memo hóa đúng chỗ / bật React Compiler.
- [ ] `useTransition`/`useDeferredValue` cho update nặng (filter danh sách lớn).
- [ ] Virtualize danh sách dài.
- [ ] Debounce/throttle input dày; đẩy tính toán nặng sang Web Worker.
- [ ] Giảm bundle JS (ít parse/execute hơn).

### Cải thiện CLS (≤ 0.1)
- [ ] Mọi ảnh có kích thước (`width`/`height` hoặc `fill`).
- [ ] `next/font` (chống nhảy font).
- [ ] Skeleton/`min-height`/`aspect-ratio` giữ chỗ cho nội dung tải sau.
- [ ] Không chèn nội dung đẩy layout (banner, ad) mà không chừa chỗ.

## Anti-patterns cần tránh

| ❌ Đừng làm | ✅ Nên làm |
|---|---|
| Rải `useMemo`/`useCallback` khắp nơi | Chỉ memo khi Profiler chứng minh cần (hoặc bật React Compiler) |
| `"use client"` ở gốc cây | Đặt ở lá, giữ thân là Server Component |
| Copy `data` (React Query) vào `useState` | Dùng thẳng `data`, derive khi cần |
| `key={index}` cho list thêm/xóa | `key={item.id}` ổn định |
| Render 1000 item cùng lúc | Virtualization + phân trang |
| Gọi API mỗi phím gõ | Debounce |
| Lấy cả store Zustand ở mọi component | Selector đúng slice |
| Tối ưu mù nhiều chỗ cùng lúc | Đo → sửa 1 chỗ → đo lại |

## Các cải tiến gợi ý cho Recipe Planner

Dự án đã làm tốt: Server/Client tách đúng, `next/font`, Zustand selector, `keepPreviousData`,
`key={recipe.id}`, tự viết `cn` (giảm dep). Có thể làm thêm khi app lớn lên:

1. **Debounce ô search** trước khi set vào Zustand (giảm request). → file 08
2. **`useInfiniteQuery` + "Tải thêm"** khi nhiều recipe. → file 05
3. **Virtualization** khi danh sách rất dài. → file 05
4. **`next/dynamic`** cho `RecipeForm` (chỉ tải khi mở modal). → file 06
5. **`next/image`** cho ảnh món ăn (nếu thêm ảnh) + `priority` cho ảnh đầu. → file 09
6. Cân nhắc **bật React Compiler** để khỏi memo tay. → file 03

## Quy trình tối ưu (nhắc lại)

```
Đo baseline → tìm 1 vấn đề lớn nhất → sửa đúng chỗ → đo lại → lặp
```

Đừng bao giờ bỏ qua bước đo. "Nhanh hơn" phải chứng minh bằng số, không phải cảm giác.
