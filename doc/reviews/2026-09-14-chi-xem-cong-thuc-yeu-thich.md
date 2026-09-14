# Review: Chỉ xem công thức yêu thích

## 1. Dòng mở đầu

Đã review 12 file code/config/test thuộc store, filter, recipe list, delete mutation và test infrastructure; không review `doc/`, `.claude/`, `AGENTS.md`, `CLAUDE.md`, `package-lock.json`, `.next/` hoặc `node_modules/` theo policy. `npx tsc --noEmit` và `npm run lint` đều pass.

## 2. Bảng tổng hợp

| Mức | Mã | File:line | Vấn đề (≤12 từ) | Kiểm chứng |
|---|---|---|---|---|
| — | — | — | Không tìm thấy vấn đề cần sửa | đã chạy |

## 3. Chi tiết từng finding

Không tìm thấy finding P0/P1/P2.

## 4. Đã kiểm tra và ĐÚNG

RQ-01 ✓ — `useRecipes.ts` chỉ đọc `search/cuisine`, cả hai nằm trong `recipeKeys.list`.

RQ-02 ✓ — mutation/list query dùng `recipeKeys` factory tập trung.

RQ-03 ✓ — thay đổi này không thêm input mới vào query key; debounce/search hiện hữu không bị đổi.

RQ-04 ✓ — DELETE chỉ invalidate `recipeKeys.lists()` và remove detail đã xoá.

RQ-05 ✓ — DELETE thành công remove detail cache và cleanup favorite ID; lỗi không đi qua `onSuccess`.

RQ-06 ✓ — thay đổi không thêm optimistic update.

RQ-07 ✓ — `Providers` tạo QueryClient bằng `useState`, server factory không dùng instance global.

RQ-08 ✓ — thay đổi không đụng SSR prefetch hoặc hydration boundary.

RQ-09 ✓ — `RecipeList` giữ loading/error/server-empty/success và thêm favorite-empty riêng.

RQ-10 ✓ — không thay đổi cơ chế `keepPreviousData` hoặc query error/retry.

ZU-01 ✓ — store giữ `skipHydration: true`, `Providers` rehydrate trong `useEffect`.

ZU-02 ✓ — filter input vẫn dẫn xuất từ `draft ?? storeSearch`; favorites không copy sang state cục bộ.

ZU-03 ✓ — thay đổi không thêm effect ghi store lúc mount.

ZU-04 ✓ — component dùng selector từng field cần thiết.

ZU-05 ✓ — render dùng selector `favoriteIds`; getter `isFavorite` không dùng để subscribe trong component mới.

ZU-06 ✓ — store chỉ giữ filter/view/favorite IDs, recipe objects vẫn ở React Query.

ZU-07 ✓ — `resetFilters` không được wire thêm vào UI trong thay đổi này.

ZOD-01 ✓ — thay đổi không thêm đường dữ liệu API chưa parse.

ZOD-02 ✓ — không thay đổi đường SSR/client validate.

ZOD-03 ✓ — không thêm lỗi API mới hiển thị trực tiếp.

ZOD-04 ✓ — không thêm type recipe song song schema.

NX-01 ✓ — không import state module mới vào server route; SSR demo không thay đổi.

NX-02 ✓ — component tương tác giữ `use client`; test/config không vào app bundle.

NX-03 ✓ — đã đọc guide Next 16 về server/client components, project structure và accessibility.

A11Y-01 ✓ — toggle là control mới không dùng `id`; các label hiện hữu giữ nguyên.

A11Y-02 ✓ — toggle và action empty state đều là native `button`, dùng được bằng keyboard.

A11Y-03 ✓ — toggle có accessible name hiển thị và `aria-pressed`; loading/error vẫn có text.

PERF-01 ✓ — không có component nhận props mới được memo hoá.

PERF-02 ✓ — phép lọc là thao tác tuyến tính trên danh sách demo nhỏ; không cần memo hoá.

PERF-03 ✓ — cách giữ recipe objects trong React Query phù hợp tài liệu performance của repo.

CONV-01 ✓ — code nằm đúng feature folders, primitive dùng lại `Button`/`EmptyState`.

CONV-02 ✓ — không tạo thêm query/mutation hook; cleanup nằm trong `useDeleteRecipe` hiện hữu.

CONV-03 ✓ — class mới chỉ là utility layout, ghép class qua primitive hiện hữu.

## 5. Ghi ra file bàn giao

Báo cáo này được ghi tại `doc/reviews/2026-09-14-chi-xem-cong-thuc-yeu-thich.md`; không có finding nên không có trạng thái finding cần theo dõi.

## 6. Dấu vết để lại

Đã chạy dev server để kiểm tra `/` và `/ssr-demo` trả HTTP 200, toggle hiển thị empty state và lọc còn đúng recipe yêu thích; đã kiểm tra console không có error. Đã tạo state cũ trong `localStorage` không có `favoritesOnly`, reload `/` không có console error và state favorite còn nguyên; đã xoá key `recipe-preferences` sau kiểm tra. Không tạo dữ liệu API, không thêm log tạm, dev server đã dừng.
