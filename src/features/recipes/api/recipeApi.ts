import {
  recipeSchema,
  recipeListSchema,
} from "../schemas/recipeSchema";
import type {
  Recipe,
  RecipeFormValues,
  RecipeFilters,
} from "../types/recipe";

/**
 * API LAYER (client side)
 * -----------------------
 * Tập trung mọi lời gọi HTTP tới backend ở một nơi. Hooks React Query sẽ
 * gọi các hàm này, KHÔNG tự fetch lung tung -> dễ test, dễ đổi endpoint.
 *
 * Mỗi response đều được Zod `.parse()` để đảm bảo dữ liệu đúng hình dạng
 * TRƯỚC KHI đi vào cache. Nếu server trả sai, ta biết ngay tại đây.
 */

const BASE_URL = "/api/recipes";

// Helper: ném lỗi có message đọc được (React Query bắt được ở `error`).
async function assertOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  let message = fallback;
  try {
    const body = await res.json();
    if (body?.message) message = body.message as string;
  } catch {
    // response không phải JSON -> giữ message mặc định
  }
  throw new Error(message);
}

// GET danh sách theo filter.
export async function fetchRecipes(filters: RecipeFilters): Promise<Recipe[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.cuisine !== "all") params.set("cuisine", filters.cuisine);

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  await assertOk(res, "Không tải được danh sách công thức");

  const json = await res.json();
  // Validate mảng trả về -> chắc chắn đúng type Recipe[].
  return recipeListSchema.parse(json);
}

// GET chi tiết theo id.
export async function fetchRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${BASE_URL}/${id}`);
  await assertOk(res, "Không tải được chi tiết công thức");

  const json = await res.json();
  return recipeSchema.parse(json);
}

// POST tạo mới.
export async function createRecipe(
  values: RecipeFormValues,
): Promise<Recipe> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  await assertOk(res, "Tạo công thức thất bại");

  const json = await res.json();
  return recipeSchema.parse(json);
}

// PUT cập nhật.
export async function updateRecipe(
  id: string,
  values: RecipeFormValues,
): Promise<Recipe> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  await assertOk(res, "Cập nhật công thức thất bại");

  const json = await res.json();
  return recipeSchema.parse(json);
}

// DELETE theo id -> trả về id vừa xoá.
export async function deleteRecipe(id: string): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  await assertOk(res, "Xoá công thức thất bại");
  return res.json();
}
