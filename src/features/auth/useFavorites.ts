"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import { useAuth } from "./AuthProvider";
import { cloudFavorites, cloudToggleFavorite } from "@/lib/firebase/repository";
export function useFavorites() {
  const { user, ready, busy } = useAuth(); const client = useQueryClient();
  const localIds = useRecipePreferences(s => s.favoriteIds);
  const localToggle = useRecipePreferences(s => s.toggleFavorite);
  const key = ["personal", user?.uid, "favorites"];
  const query = useQuery({ queryKey: key, queryFn: () => cloudFavorites(user!.uid), enabled: ready && !!user, refetchInterval: user ? 30000 : false, refetchOnWindowFocus: !!user });
  const mutation = useMutation({
    mutationFn: (id: string) => {
      if (!ready || busy || !user) throw new Error("Đang xác định tài khoản. Hãy thử lại.");
      return cloudToggleFavorite(user.uid, id);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  const disabled = !ready || busy || (!!user && (query.isPending || mutation.isPending));
  return {
    ids: user ? query.data ?? [] : localIds,
    toggle: (id: string) => {
      if (!ready || busy) return;
      if (user) mutation.mutate(id);
      else localToggle(id);
    },
    disabled,
    pending: !!user && (query.isPending || mutation.isPending),
    error: user ? query.error ?? mutation.error : null,
    retry: () => query.refetch(),
  };
}
