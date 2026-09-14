"use client";

import { cn } from "@/lib/utils/cn";
import { CUISINE_LABELS } from "../schemas/recipeSchema";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import type { Recipe } from "../types/recipe";
import type { ViewMode } from "@/stores/recipePreferencesStore";

interface RecipeCardProps {
  recipe: Recipe;
  viewMode: ViewMode;
  onOpen: (id: string) => void;
}

// Thẻ hiển thị 1 recipe. Đọc/ghi trạng thái "yêu thích" trực tiếp từ Zustand.
export function RecipeCard({ recipe, viewMode, onOpen }: RecipeCardProps) {
  // Lấy đúng slice cần dùng từ store (tránh re-render thừa).
  const isFavorite = useRecipePreferences((s) =>
    s.favoriteIds.includes(recipe.id),
  );
  const toggleFavorite = useRecipePreferences((s) => s.toggleFavorite);

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-orange-200",
        viewMode === "grid" ? "p-5" : "flex items-center justify-between gap-4 p-4",
      )}
      onClick={() => onOpen(recipe.id)}
    >
      {/* dải màu accent bên trái */}
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-400 to-rose-400 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
            {CUISINE_LABELS[recipe.cuisine]}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            ⏱ {recipe.cookTimeMinutes} phút
          </span>
        </div>
        <h3 className="truncate text-base font-semibold text-slate-900">
          {recipe.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {recipe.description}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400">
          🥕 {recipe.ingredients.length} nguyên liệu
        </p>
      </div>

      <button
        type="button"
        aria-label="Yêu thích"
        onClick={(e) => {
          e.stopPropagation(); // đừng mở chi tiết khi bấm tim
          toggleFavorite(recipe.id);
        }}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl transition-colors",
          isFavorite
            ? "bg-rose-50 text-rose-500"
            : "text-slate-300 hover:bg-slate-50 hover:text-rose-400",
        )}
      >
        {isFavorite ? "♥" : "♡"}
      </button>
    </div>
  );
}
