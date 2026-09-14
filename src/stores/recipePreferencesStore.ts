import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cuisine } from "@/features/recipes/types/recipe";

/**
 * ZUSTAND STORE cho CLIENT STATE (không phải server state).
 * ---------------------------------------------------------
 * Phân biệt quan trọng khi học:
 *   - SERVER STATE (danh sách recipe, chi tiết...) -> React Query quản lý.
 *   - CLIENT STATE (tuỳ chọn hiển thị của user)    -> Zustand quản lý.
 *
 * Ở đây lưu:
 *   - search / cuisine : bộ lọc, sẽ được đưa vào query key ["recipes","list",filters].
 *   - viewMode         : chế độ hiển thị grid/list.
 *   - favoriteIds      : danh sách recipe yêu thích (chỉ ở phía client).
 *
 * Dùng middleware `persist` để lưu vào localStorage -> reload trang vẫn giữ.
 *
 * CẨN THẬN VỚI SSR: mặc định `persist` đọc localStorage NGAY khi tạo store
 * (đồng bộ). Trên trang render sẵn ở server, HTML server dựng bằng giá trị
 * MẶC ĐỊNH (server không có localStorage), còn lần render đầu ở client đã có
 * giá trị đã lưu -> hai bên khác nhau -> React báo hydration mismatch và bỏ
 * HTML của server để dựng lại toàn bộ cây từ client (mất công SSR).
 *
 * Cách xử lý: `skipHydration: true` để store KHÔNG tự đọc localStorage, rồi
 * tự gọi `persist.rehydrate()` trong useEffect (xem `src/app/providers.tsx`)
 * -> lúc đó đã ở client, hydrate xong, đổi state là re-render bình thường.
 *
 * Kèm theo đó: component KHÔNG được copy giá trị của store ra state cục bộ
 * bằng `useState(storeValue)`, vì lúc mount store vẫn còn là giá trị mặc định.
 * Xem cách RecipeFilters dẫn xuất giá trị ô input thay vì copy.
 */

export type ViewMode = "grid" | "list";
export type CuisineFilter = Cuisine | "all";

interface RecipePreferencesState {
  // --- filter / search ---
  search: string;
  cuisine: CuisineFilter;
  setSearch: (search: string) => void;
  setCuisine: (cuisine: CuisineFilter) => void;
  resetFilters: () => void;

  // --- chế độ hiển thị ---
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // --- yêu thích ---
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // --- chỉ xem yêu thích ---
  favoritesOnly: boolean;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
}

export const useRecipePreferences = create<RecipePreferencesState>()(
  persist(
    (set, get) => ({
      search: "",
      cuisine: "all",
      setSearch: (search) => set({ search }),
      setCuisine: (cuisine) => set({ cuisine }),
      resetFilters: () => set({ search: "", cuisine: "all" }),

      viewMode: "grid",
      setViewMode: (viewMode) => set({ viewMode }),

      favoriteIds: [],
      toggleFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds.filter((favId) => favId !== id)
            : [...state.favoriteIds, id],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((favId) => favId !== id),
        })),
      isFavorite: (id) => get().favoriteIds.includes(id),

      favoritesOnly: false,
      setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
    }),
    {
      name: "recipe-preferences", // key trong localStorage

      // Không tự đọc localStorage lúc tạo store (xem giải thích ở đầu file).
      // Việc rehydrate do `Providers` chủ động gọi sau khi lên client.
      skipHydration: true,
    },
  ),
);
