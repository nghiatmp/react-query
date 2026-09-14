import { useQuery } from "@tanstack/react-query";
import { fetchRecipe } from "../api/recipeApi";
import { recipeKeys } from "./recipeKeys";

/**
 * Query CHI TIẾT một recipe theo id.
 *
 * Query key = ["recipes", "detail", id].
 *
 * `enabled: !!id` -> query chỉ chạy khi có id (ví dụ: khi mở modal chi tiết).
 * Khi chưa chọn recipe nào (id rỗng/null) query nằm im, không gọi API thừa.
 */
export function useRecipe(id: string | null) {
  return useQuery({
    queryKey: recipeKeys.detail(id ?? ""),
    queryFn: () => fetchRecipe(id as string),
    enabled: !!id,
  });
}
