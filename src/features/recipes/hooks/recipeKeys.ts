import type { RecipeFilters } from "../types/recipe";

/**
 * QUERY KEY FACTORY
 * -----------------
 * Gom toàn bộ query key về một nơi để tránh gõ tay ["recipes"] rải rác
 * (dễ sai chính tả -> invalidate không trúng cache).
 *
 * Cấu trúc key phân cấp cho demo:
 *   ["recipes"]                     -> gốc của mọi recipe demo
 *   ["recipes", "list", filters]    -> danh sách demo theo filter cụ thể
 *   ["recipes", "detail", id]       -> chi tiết demo theo id
 *
 * Dữ liệu tài khoản thêm prefix ["personal", uid] vào cùng cấu trúc để cache
 * của từng người dùng không trộn với demo hoặc với tài khoản khác.
 */
export const recipeKeys = {
  all: ["recipes"] as const,

  lists: () => [...recipeKeys.all, "list"] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.lists(), filters] as const,

  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
};

export const scopedRecipeKey = (uid: string | undefined, key: readonly unknown[]) => uid ? ["personal", uid, ...key] : key;
