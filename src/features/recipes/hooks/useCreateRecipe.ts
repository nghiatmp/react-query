import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecipe } from "../api/recipeApi";
import { recipeKeys } from "./recipeKeys";

/**
 * Mutation THÊM recipe.
 *
 * Sau khi tạo thành công -> invalidate mọi query "list" để chúng refetch,
 * đảm bảo danh sách hiển thị bao gồm cả recipe vừa thêm.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      // Đánh dấu tất cả query danh sách là "stale" -> React Query tự fetch lại.
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
