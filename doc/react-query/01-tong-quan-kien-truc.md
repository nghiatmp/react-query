# 01. Tổng quan & kiến trúc

## Mục tiêu dự án

App **Recipe Planner** (quản lý công thức nấu ăn) dùng để học cách 3 thư viện phối hợp:
React Query (server state), Zustand (client state), Zod (validation).

Tính năng: danh sách recipe, xem chi tiết, thêm/sửa/xóa (CRUD), lọc theo ẩm thực, tìm kiếm,
chế độ grid/list, danh sách yêu thích, và một trang demo SSR prefetch.

## Cấu trúc thư mục

```
src/
  app/
    api/recipes/
      _store.ts            # "DB" in-memory chạy trên server + giả lập độ trễ mạng
      route.ts             # GET danh sách + POST tạo mới
      [id]/route.ts        # GET / PUT / DELETE theo id
    layout.tsx             # Server Component, bọc <Providers>
    page.tsx               # Server Component, render <RecipesPage>
    providers.tsx          # "use client" — QueryClientProvider + Devtools
    ssr-demo/page.tsx      # Server Component demo SSR prefetch + hydrate

  components/ui/           # Component UI thuần (không biết gì về data)
    Button, Input, Select, Modal, LoadingState, ErrorState, EmptyState

  features/recipes/        # Tính năng recipe, gom theo "feature"
    api/recipeApi.ts       # API layer client: fetch + Zod .parse
    schemas/recipeSchema.ts# Zod schema — nguồn chân lý dữ liệu
    types/recipe.ts        # Type suy ra từ schema (z.infer)
    hooks/
      recipeKeys.ts        # Query key factory
      useRecipes.ts        # Query danh sách
      useRecipe.ts         # Query chi tiết theo id
      useCreateRecipe.ts   # Mutation thêm
      useUpdateRecipe.ts   # Mutation sửa
      useDeleteRecipe.ts   # Mutation xóa
    components/
      RecipesPage.tsx      # Container điều phối (header + modal)
      RecipeList.tsx       # Danh sách + xử lý loading/error/empty
      RecipeCard.tsx       # Thẻ 1 recipe
      RecipeDetail.tsx     # Chi tiết (query riêng theo id)
      RecipeForm.tsx       # Form thêm/sửa validate bằng Zod
      RecipeFilters.tsx    # Thanh filter (đọc/ghi Zustand)
      SsrRecipeList.tsx    # Danh sách cho trang SSR demo

  lib/
    react-query/
      queryClient.ts       # Factory tạo QueryClient (cấu hình chung)
      getQueryClient.ts    # QueryClient riêng cho server (cache() của React)
    utils/cn.ts            # Gộp className

  stores/
    recipePreferencesStore.ts  # Zustand + persist (filter, viewMode, favorites)
```

## Nguyên tắc tổ chức

1. **Feature-based**: mọi thứ liên quan recipe (api, hook, schema, component) nằm chung
   trong `features/recipes/` → dễ tìm, dễ tách khi app lớn lên.
2. **Tách tầng rõ ràng**: UI (`components/ui`) không biết gì về data; hook React Query
   không tự fetch mà gọi qua `api/recipeApi.ts`; validation tập trung ở `schemas/`.
3. **Một chiều phụ thuộc**: `components → hooks → api → schema/types`. Không đi ngược.

## Ba thư viện phối hợp thế nào

```
                       ┌────────────────────────────┐
        Người dùng ───▶│  RecipeFilters (component)  │
        gõ tìm kiếm    └──────────────┬─────────────┘
                                      │ setSearch()
                                      ▼
                       ┌────────────────────────────┐
                       │  Zustand store             │  ← CLIENT STATE
                       │  { search, cuisine, ... }  │
                       └──────────────┬─────────────┘
                                      │ đọc filter
                                      ▼
                       ┌────────────────────────────┐
                       │  useRecipes(filters)       │  ← REACT QUERY
                       │  queryKey: ["recipes",     │     (SERVER STATE)
                       │    "list", filters]        │
                       └──────────────┬─────────────┘
                                      │ gọi
                                      ▼
                       ┌────────────────────────────┐
                       │  recipeApi.fetchRecipes()  │
                       │  → fetch /api/recipes      │
                       │  → recipeListSchema.parse()│  ← ZOD validate response
                       └────────────────────────────┘
```

- **Zustand** giữ filter/search → khi đổi, nó nằm trong **query key** của React Query.
- **React Query** thấy key đổi → tự fetch lại, cache theo từng bộ filter.
- **Zod** đứng ở "cửa ngõ" dữ liệu: validate response trước khi vào cache, validate form trước khi gửi.

Chi tiết từng phần ở các file sau.
