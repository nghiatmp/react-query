"use client";

import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CUISINE_LABELS } from "../schemas/recipeSchema";
import { useRecipe } from "../hooks/useRecipe";
import { useDeleteRecipe } from "../hooks/useDeleteRecipe";
import { useFavorites } from "@/features/auth/useFavorites";
import { useAuth } from "@/features/auth/AuthProvider";
import { Heart, Clock } from "lucide-react";

interface RecipeDetailProps {
  recipeId: string;
  onEdit: () => void;
  onDeleted: () => void; // đóng modal sau khi xoá xong
}

/**
 * Chi tiết một recipe = một query RIÊNG theo recipeId (không dùng lại query list).
 * Nhờ vậy detail có thể có cache/loading/error độc lập.
 */
export function RecipeDetail({ recipeId, onEdit, onDeleted }: RecipeDetailProps) {
  const { ready: authReady } = useAuth();
  // Query chi tiết: key ["recipes","detail", recipeId].
  const { data: recipe, isPending, isError, error, refetch } =
    useRecipe(recipeId);

  const deleteMutation = useDeleteRecipe();

  const favorites = useFavorites();
  const isFavorite = favorites.ids.includes(recipeId);

  if (isPending) return <LoadingState label="Đang tải chi tiết..." />;
  if (isError) {
    return (
      <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
    );
  }

  function handleDelete() {
    if (!confirm(`Xoá công thức "${recipe!.name}"?`)) return;
    // Gọi mutation xoá; onSuccess trong hook sẽ dọn cache, rồi ta đóng modal.
    deleteMutation.mutate(recipeId, { onSuccess: onDeleted });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">
              {CUISINE_LABELS[recipe.cuisine]}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={14} aria-hidden="true"/> {recipe.cookTimeMinutes} phút
            </span>
          </div>
          <h3 className="display-heading break-words text-2xl">{recipe.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={isFavorite ? "text-destructive" : "text-muted-foreground"}
          disabled={favorites.pending}
          onClick={() => favorites.toggle(recipe.id)}
          aria-label="Yêu thích"
          aria-pressed={isFavorite}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"}/>
        </Button>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{recipe.description}</p>

      <div>
        <h4 className="mb-2 text-sm font-semibold">
          Nguyên liệu ({recipe.ingredients.length})
        </h4>
        <ul className="flex flex-col gap-1">
          {recipe.ingredients.map((ing, i) => (
            <li
              key={i}
              className="flex justify-between gap-4 rounded-xl bg-muted px-3 py-2 text-sm"
            >
              <span className="break-words">{ing.name}</span>
              <span className="text-muted-foreground">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      {deleteMutation.error && <p role="alert" className="text-sm text-destructive">{deleteMutation.error.message}</p>}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleteMutation.isPending || !authReady}
        >
          {deleteMutation.isPending ? "Đang xoá..." : "Xoá"}
        </Button>
        <Button variant="secondary" disabled={!authReady} onClick={onEdit}>
          Sửa
        </Button>
      </div>
    </div>
  );
}
