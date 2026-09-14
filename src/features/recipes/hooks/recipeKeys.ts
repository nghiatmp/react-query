import type { RecipeFilters } from "../types/recipe";

/**
 * QUERY KEY FACTORY
 * -----------------
 * Gom toàn bộ query key về một nơi để tránh gõ tay ["recipes"] rải rác
 * (dễ sai chính tả -> invalidate không trúng cache).
 *
 * Cấu trúc key phân cấp:
 *   ["recipes"]                     -> gốc của mọi thứ liên quan recipe
 *   ["recipes", "list", filters]    -> danh sách theo filter cụ thể
 *   ["recipes", "detail", id]       -> chi tiết theo id
 *
 * Nhờ phân cấp, gọi invalidateQueries({ queryKey: ["recipes"] }) sẽ
 * làm mới CẢ list lẫn detail cùng lúc.
 */
export const recipeKeys = {
  all: ["recipes"] as const,

  lists: () => [...recipeKeys.all, "list"] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.lists(), filters] as const,

  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
};
