import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchRecipes } from "../api/recipeApi";
import { recipeKeys } from "./recipeKeys";
import type { RecipeFilters } from "../types/recipe";

/**
 * Query DANH SÁCH recipes theo filter.
 *
 * Query key = ["recipes", "list", filters].
 * => Khi `filters` đổi (search/cuisine khác), key đổi theo, React Query tự
 *    fetch lại và cache riêng cho từng bộ filter.
 */
export function useRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: recipeKeys.list(filters),
    queryFn: () => fetchRecipes(filters),

    // Khi đổi filter, giữ lại data cũ trong lúc fetch data mới
    // -> danh sách không "nhấp nháy" về trạng thái loading rỗng.
    placeholderData: keepPreviousData,
  });
}
