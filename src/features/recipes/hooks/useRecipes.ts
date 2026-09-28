import { useAuth } from "@/features/auth/AuthProvider";
import { cloudRecipes } from "@/lib/firebase/repository";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchRecipes } from "../api/recipeApi";
import { recipeKeys, scopedRecipeKey } from "./recipeKeys";
import type { RecipeFilters } from "../types/recipe";

/**
 * Query DANH SÁCH recipes theo filter.
 *
 * Query key = ["recipes", "list", filters].
 * => Khi `filters` đổi (search/cuisine khác), key đổi theo, React Query tự
 *    fetch lại và cache riêng cho từng bộ filter.
 */
export function useRecipes(filters: RecipeFilters, demoOnly = false) {
  const auth = useAuth();
  const user = demoOnly ? null : auth.user;
  return useQuery({
    queryKey: scopedRecipeKey(user?.uid, recipeKeys.list(filters)),
    queryFn: () => user ? cloudRecipes(user.uid, filters) : fetchRecipes(filters),

    // Khi đổi filter, giữ lại data cũ trong lúc fetch data mới
    // -> danh sách không "nhấp nháy" về trạng thái loading rỗng.
    enabled: demoOnly || auth.ready,
    refetchInterval: user ? 30000 : false,
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[0] === (user ? "personal" : "recipes") && (!user || previousQuery?.queryKey[1] === user.uid) ? keepPreviousData(previous) : undefined,
  });
}
