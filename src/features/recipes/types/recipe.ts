import type { z } from "zod";
import type {
  recipeSchema,
  recipeFormSchema,
  ingredientSchema,
  cuisineSchema,
} from "../schemas/recipeSchema";

/**
 * Suy ra type trực tiếp từ Zod schema bằng z.infer.
 * => Type và validation luôn đồng bộ: sửa schema thì type tự đổi theo,
 *    không cần khai báo interface trùng lặp và dễ sai lệch.
 */
export type Recipe = z.infer<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Cuisine = z.infer<typeof cuisineSchema>;

// Giá trị mà form thu thập được (đã qua Zod parse, cookTimeMinutes là number).
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

/**
 * Filter dùng cho query danh sách. `cuisine: "all"` nghĩa là không lọc.
 * Đây cũng chính là phần dữ liệu đi vào query key ["recipes", filters].
 */
export interface RecipeFilters {
  search: string;
  cuisine: Cuisine | "all";
}
