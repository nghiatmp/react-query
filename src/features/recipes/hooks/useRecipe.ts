import { useAuth } from "@/features/auth/AuthProvider";
import { cloudRecipe } from "@/lib/firebase/repository";
import { useQuery } from "@tanstack/react-query";
import { fetchRecipe } from "../api/recipeApi";
import { recipeKeys, scopedRecipeKey } from "./recipeKeys";

/**
 * Query CHI TIẾT một recipe theo id.
 *
 * Query key = ["recipes", "detail", id].
 *
 * `enabled: ready && !!id` -> query chỉ chạy khi có id (ví dụ: khi mở modal chi tiết).
 * Khi chưa chọn recipe nào (id rỗng/null) query nằm im, không gọi API thừa.
 */
export function useRecipe(id: string | null) {
  const { user, ready } = useAuth();
  return useQuery({
    queryKey: scopedRecipeKey(user?.uid, recipeKeys.detail(id ?? "")),
    queryFn: () => user ? cloudRecipe(user.uid, id as string) : fetchRecipe(id as string),
    enabled: ready && !!id,
    refetchOnWindowFocus: !!user,
  });
}
