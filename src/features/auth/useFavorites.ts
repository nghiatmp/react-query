"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import { useAuth } from "./AuthProvider";
import { cloudFavorites, cloudToggleFavorite } from "@/lib/firebase/repository";
export function useFavorites() {
  const { user, ready } = useAuth(); const client = useQueryClient();
  const localIds = useRecipePreferences(s => s.favoriteIds);
  const localToggle = useRecipePreferences(s => s.toggleFavorite);
  const key = ["personal", user?.uid, "favorites"];
  const query = useQuery({ queryKey: key, queryFn: () => cloudFavorites(user!.uid), enabled: ready && !!user, refetchInterval: user ? 30000 : false, refetchOnWindowFocus: !!user });
  const mutation = useMutation({ mutationFn: (id: string) => cloudToggleFavorite(user!.uid, id), onSuccess: () => client.invalidateQueries({ queryKey: key }) });
  return { ids: user ? query.data ?? [] : localIds, toggle: (id: string) => user ? mutation.mutate(id) : localToggle(id), pending: !!user && (query.isPending || mutation.isPending), error: user ? query.error ?? mutation.error : null, retry: () => query.refetch() };
}
