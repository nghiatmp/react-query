import { useAuth } from "@/features/auth/AuthProvider";
import { cloudUpdateRecipe } from "@/lib/firebase/repository";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecipe } from "../api/recipeApi";
import { recipeKeys, scopedRecipeKey } from "./recipeKeys";
import type { Recipe, RecipeFormValues } from "../types/recipe";

/**
 * Mutation CẬP NHẬT recipe (đổi tên, mô tả, thời gian nấu, nguyên liệu...).
 *
 * Minh hoạ 2 cách cập nhật cache sau mutation:
 *  1) setQueryData    -> ghi thẳng dữ liệu mới vào cache chi tiết (tức thì, không cần refetch).
 *  2) invalidateQueries -> đánh dấu list là stale để refetch (dữ liệu list luôn khớp server).
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  const { user, ready } = useAuth();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RecipeFormValues }) => {
      if (!ready) throw new Error("Đang xác định tài khoản. Hãy thử lại.");
      return user ? cloudUpdateRecipe(user.uid, id, values) : updateRecipe(id, values);
    },

    onSuccess: (updated: Recipe) => {
      // (1) Cập nhật ngay cache chi tiết của đúng recipe này.
      queryClient.setQueryData(scopedRecipeKey(user?.uid, recipeKeys.detail(updated.id)), updated);

      // (2) Làm mới danh sách để tên/mô tả mới hiển thị đúng.
      queryClient.invalidateQueries({ queryKey: scopedRecipeKey(user?.uid, recipeKeys.lists()) });
    },
  });
}
