import { useAuth } from "@/features/auth/AuthProvider";
import { cloudCreateRecipe } from "@/lib/firebase/repository";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecipe } from "../api/recipeApi";
import { recipeKeys, scopedRecipeKey } from "./recipeKeys";

/**
 * Mutation THÊM recipe.
 *
 * Sau khi tạo thành công -> invalidate mọi query "list" để chúng refetch,
 * đảm bảo danh sách hiển thị bao gồm cả recipe vừa thêm.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (values: import("../types/recipe").RecipeFormValues) => user ? cloudCreateRecipe(user.uid, values) : createRecipe(values),
    onSuccess: () => {
      // Đánh dấu tất cả query danh sách là "stale" -> React Query tự fetch lại.
      queryClient.invalidateQueries({ queryKey: scopedRecipeKey(user?.uid, recipeKeys.lists()) });
    },
  });
}
