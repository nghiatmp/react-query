import Image from "next/image";
import type { Recipe } from "../types/recipe";
const photos: Record<string, string> = { italian: "/images/pasta.jpg", japanese: "/images/sushi.jpg", mexican: "/images/tacos.jpg" };
export function RecipePhoto({ recipe, className = "" }: { recipe: Recipe; className?: string }) {
  return <div className={`relative overflow-hidden bg-muted ${className}`}><Image src={photos[recipe.cuisine] || "/images/pasta.jpg"} alt={`Ảnh minh họa món ${recipe.name}`} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw" className="object-cover"/></div>;
}
