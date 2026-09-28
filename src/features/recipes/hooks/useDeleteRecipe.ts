import { useAuth } from "@/features/auth/AuthProvider";
import { cloudDeleteRecipe } from "@/lib/firebase/repository";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRecipe } from "../api/recipeApi";
import { recipeKeys, scopedRecipeKey } from "./recipeKeys";
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
  const { user } = useAuth();
  const removeFavorite = useRecipePreferences((s) => s.removeFavorite);

  return useMutation({
    mutationFn: (id: string) => user ? cloudDeleteRecipe(user.uid, id) : deleteRecipe(id),

    onSuccess: ({ id }) => {
      if (!user) removeFavorite(id);
      if (user) void queryClient.invalidateQueries({ queryKey: ["personal", user.uid, "favorites"] });
      queryClient.removeQueries({ queryKey: scopedRecipeKey(user?.uid, recipeKeys.detail(id)) });
      queryClient.invalidateQueries({ queryKey: scopedRecipeKey(user?.uid, recipeKeys.lists()) });
    },
  });
}
