# 07. Zustand — global client state

## Zustand để làm gì trong app này

Quản lý **client state** — tùy chọn hiển thị của người dùng, không đến từ server:

- `search` / `cuisine`: bộ lọc (sẽ được đưa vào query key của React Query).
- `viewMode`: chế độ hiển thị `grid` / `list`.
- `favoriteIds`: danh sách recipe yêu thích (chỉ ở phía client).
- `favoritesOnly`: bật chế độ chỉ hiển thị recipe có ID nằm trong `favoriteIds` (chỉ ở phía client).

> Nhắc lại ranh giới: server state (recipe) → React Query; client state (tùy chọn) → Zustand.
> Xem [02-server-vs-client-state.md](02-server-vs-client-state.md).

## Tạo store

File `src/stores/recipePreferencesStore.ts`:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRecipePreferences = create<RecipePreferencesState>()(
  persist(
    (set, get) => ({
      // --- state ---
      search: "",
      cuisine: "all",
      viewMode: "grid",
      favoriteIds: [],
      favoritesOnly: false,

      // --- actions (hàm sửa state) ---
      setSearch: (search) => set({ search }),
      setCuisine: (cuisine) => set({ cuisine }),
      setViewMode: (viewMode) => set({ viewMode }),
      resetFilters: () => set({ search: "", cuisine: "all" }),

      toggleFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds.filter((f) => f !== id)  // đang có → bỏ ra
            : [...state.favoriteIds, id],                // chưa có → thêm vào
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((f) => f !== id),
        })),
      isFavorite: (id) => get().favoriteIds.includes(id),
      setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
    }),
    { name: "recipe-preferences" },  // key trong localStorage
  ),
);
```

Các điểm chính:

- **`create<T>()(...)`**: tạo một hook. Chú ý cú pháp `create<T>()(...)` (có `()` rỗng ở giữa)
  là để TypeScript suy kiểu đúng khi dùng middleware.
- **`set`**: cập nhật state. `set({ search })` merge nông (chỉ đổi field đó).
  `set((state) => ...)` khi cần đọc state cũ để tính state mới (như `toggleFavorite`).
- **`get`**: đọc state hiện tại bên trong store (như `isFavorite`).

## Middleware `persist`

Bọc store trong `persist(...)` để **tự lưu vào localStorage** và khôi phục khi mở lại trang.
`name: "recipe-preferences"` là key trong localStorage.

→ Đây là lý do favorites/filter **sống sót qua F5**, khác với cache React Query (mất khi reload).
Xem [06-quan-ly-cache.md](06-quan-ly-cache.md).

## Dùng store trong component

### Lấy nhiều field cùng lúc

File `RecipeFilters.tsx`:

```tsx
const { search, cuisine, viewMode, setSearch, setCuisine, setViewMode } =
  useRecipePreferences();
```

### Lấy đúng slice cần dùng (tối ưu re-render)

File `RecipeCard.tsx`:

```tsx
// Chỉ lấy đúng thứ cần → component chỉ re-render khi phần đó đổi
const isFavorite = useRecipePreferences((s) => s.favoriteIds.includes(recipe.id));
const toggleFavorite = useRecipePreferences((s) => s.toggleFavorite);
```

Truyền một **selector** `(s) => ...` để chỉ "đăng ký" phần state mình quan tâm. Nếu lấy cả object
(`useRecipePreferences()`) thì component re-render mỗi khi **bất kỳ** field nào đổi — lãng phí.
Với danh sách nhiều card, dùng selector là quan trọng.

## Zustand phối hợp với React Query thế nào

```
RecipeFilters ──setSearch()──▶ Zustand ──đọc filter──▶ useRecipes(filters) ──▶ React Query
                               (client state)          (đưa vào query key)      (server state)
```

- Filter đổi trong Zustand → `RecipeList` đọc ra, truyền vào `useRecipes({search,cuisine})`.
- Filter nằm trong **query key** → React Query tự refetch cho bộ filter mới.
- Còn `viewMode`, `favoritesOnly` và `favoriteIds` là thuần client → đổi **không** gọi lại API.
  Khi bật `favoritesOnly`, `RecipeList` lọc kết quả server theo `favoriteIds`; search/cuisine vẫn
  là bộ lọc server nên kết quả là giao của hai lớp lọc.

Đây là sự phân công đẹp: Zustand giữ "người dùng muốn xem gì", React Query lo "lấy đúng data đó".

## Vì sao không dùng luôn `useState`?

`useState` chỉ sống trong **một component**. Filter/favorites cần chia sẻ giữa nhiều component
(`RecipeFilters`, `RecipeList`, `RecipeCard`, `RecipeDetail`, header đếm favorites...) và cần
`persist`. Nếu dùng `useState` phải "kéo state lên cha" rồi truyền props chằng chịt (prop
drilling). Zustand cho một store toàn cục gọn gàng, component nào cần thì tự lấy.
