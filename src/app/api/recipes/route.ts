import { NextRequest, NextResponse } from "next/server";
import { listRecipes, createRecipe } from "./_store";
import {
  cuisineSchema,
  recipeFormSchema,
} from "@/features/recipes/schemas/recipeSchema";
import type { RecipeFilters } from "@/features/recipes/types/recipe";

/**
 * Route handler cho tập hợp recipes: /api/recipes
 * - GET  : lấy danh sách (có lọc qua query string)
 * - POST : tạo recipe mới (validate body bằng Zod ngay tại server)
 */

// GET /api/recipes?search=...&cuisine=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse cuisine an toàn: nếu không hợp lệ thì coi như "all".
  const rawCuisine = searchParams.get("cuisine");
  const parsedCuisine = cuisineSchema.safeParse(rawCuisine);

  const filters: RecipeFilters = {
    search: searchParams.get("search") ?? "",
    cuisine: parsedCuisine.success ? parsedCuisine.data : "all",
  };

  const data = await listRecipes(filters);
  return NextResponse.json(data);
}

// POST /api/recipes
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Server cũng validate lại bằng Zod (không tin tưởng client).
  const parsed = recipeFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dữ liệu không hợp lệ", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await createRecipe(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
