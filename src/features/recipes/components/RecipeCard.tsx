"use client";
import { Clock, Heart, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CUISINE_LABELS } from "../schemas/recipeSchema";
import { useFavorites } from "@/features/auth/useFavorites";
import type { Recipe } from "../types/recipe";
import type { ViewMode } from "@/stores/recipePreferencesStore";
import { RecipePhoto } from "./RecipePhoto";
import { Card } from "@/components/ui/primitives/card";
interface RecipeCardProps { recipe: Recipe; viewMode: ViewMode; onOpen: (id: string) => void }
export function RecipeCard({ recipe, viewMode, onOpen }: RecipeCardProps) {
  const favorites = useFavorites(); const favorite = favorites.ids.includes(recipe.id);
  return <Card className={cn("relative gap-0 overflow-hidden border bg-card py-0 shadow-none", viewMode === "list" && "sm:flex-row")}>
    <RecipePhoto recipe={recipe} className={viewMode === "grid" ? "h-52" : "h-40 sm:h-auto sm:w-52 sm:shrink-0"}/>
    <button type="button" aria-label="Yêu thích" aria-pressed={favorite} disabled={favorites.disabled} onClick={() => favorites.toggle(recipe.id)} className={cn("absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border bg-card", favorite ? "text-destructive" : "text-muted-foreground")}><Heart size={19} fill={favorite ? "currentColor" : "none"}/></button>
    <div className="flex min-w-0 flex-1 flex-col p-5"><div className="mb-3 flex items-center gap-3 text-xs"><span className="rounded-full bg-accent px-3 py-1 text-primary">{CUISINE_LABELS[recipe.cuisine]}</span><span className="flex items-center gap-1 text-muted-foreground"><Clock size={13} aria-hidden="true"/>{recipe.cookTimeMinutes} phút</span></div><h3 className="display-heading break-words text-2xl">{recipe.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{recipe.description}</p><div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-xs text-muted-foreground">{recipe.ingredients.length} nguyên liệu</span><button type="button" aria-label={`Xem ${recipe.name}`} onClick={() => onOpen(recipe.id)} className="flex items-center gap-2 text-sm font-medium text-primary">Xem công thức<ArrowUpRight size={17} aria-hidden="true"/></button></div></div>
  </Card>;
}
