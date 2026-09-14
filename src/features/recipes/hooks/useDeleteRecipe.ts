import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRecipe } from "../api/recipeApi";
import { recipeKeys } from "./recipeKeys";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

/**
 * Mutation XOÁ recipe.
 *
 * Sau khi xoá:
 *  - removeQueries: bỏ luôn cache chi tiết của recipe đã xoá (không còn dùng).
 *  - invalidateQueries: refetch danh sách để item biến mất khỏi list.
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  const removeFavorite = useRecipePreferences((s) => s.removeFavorite);

  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),

    onSuccess: ({ id }) => {
      removeFavorite(id);
      queryClient.removeQueries({ queryKey: recipeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
