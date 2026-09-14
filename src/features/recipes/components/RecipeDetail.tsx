"use client";

import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CUISINE_LABELS } from "../schemas/recipeSchema";
import { useRecipe } from "../hooks/useRecipe";
import { useDeleteRecipe } from "../hooks/useDeleteRecipe";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

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
  // Query chi tiết: key ["recipes","detail", recipeId].
  const { data: recipe, isPending, isError, error, refetch } =
    useRecipe(recipeId);

  const deleteMutation = useDeleteRecipe();

  const isFavorite = useRecipePreferences((s) =>
    s.favoriteIds.includes(recipeId),
  );
  const toggleFavorite = useRecipePreferences((s) => s.toggleFavorite);

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
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {CUISINE_LABELS[recipe.cuisine]}
            </span>
            <span className="text-xs text-gray-400">
              ⏱ {recipe.cookTimeMinutes} phút
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{recipe.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={isFavorite ? "text-xl text-red-500" : "text-xl text-gray-300"}
          onClick={() => toggleFavorite(recipe.id)}
          aria-label="Yêu thích"
        >
          {isFavorite ? "♥" : "♡"}
        </Button>
      </div>

      <p className="text-sm text-gray-600">{recipe.description}</p>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-800">
          Nguyên liệu ({recipe.ingredients.length})
        </h4>
        <ul className="flex flex-col gap-1">
          {recipe.ingredients.map((ing, i) => (
            <li
              key={i}
              className="flex justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm"
            >
              <span className="text-gray-700">{ing.name}</span>
              <span className="text-gray-400">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Đang xoá..." : "Xoá"}
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          Sửa
        </Button>
      </div>
    </div>
  );
}
