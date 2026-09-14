import { z } from "zod";

/**
 * Zod là "single source of truth" cho hình dạng dữ liệu.
 * Ta định nghĩa schema ở đây, rồi:
 *  - suy ra TypeScript type từ schema (xem types/recipe.ts)
 *  - validate response API (parse dữ liệu server trả về)
 *  - validate input form trước khi gửi mutation
 */

// Danh sách cuisine hợp lệ, khai báo `as const` để Zod enum bắt đúng literal type.
export const CUISINES = [
  "italian",
  "japanese",
  "mexican",
  "indian",
  "american",
  "other",
] as const;

export const cuisineSchema = z.enum(CUISINES);

// Nhãn tiếng Việt để hiển thị trên UI (map từ giá trị enum).
export const CUISINE_LABELS: Record<(typeof CUISINES)[number], string> = {
  italian: "Ý",
  japanese: "Nhật",
  mexican: "Mexico",
  indian: "Ấn Độ",
  american: "Mỹ",
  other: "Khác",
};

// Một nguyên liệu = tên + định lượng.
export const ingredientSchema = z.object({
  name: z.string().min(1, "Tên nguyên liệu không được để trống"),
  amount: z.string().min(1, "Định lượng không được để trống"),
});

// Schema đầy đủ của một recipe (giống hệt dữ liệu server trả về).
export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  cuisine: cuisineSchema,
  cookTimeMinutes: z.number().int().positive(),
  ingredients: z.array(ingredientSchema),
  createdAt: z.string(), // ISO date string
});

// Danh sách recipe -> dùng để parse response GET /api/recipes
export const recipeListSchema = z.array(recipeSchema);

/**
 * Schema cho FORM thêm/sửa recipe.
 * Khác recipeSchema ở chỗ: KHÔNG có id / createdAt (do server sinh ra),
 * và ràng buộc chặt hơn để hướng dẫn người dùng nhập liệu.
 */
export const recipeFormSchema = z.object({
  name: z.string().min(2, "Tên món cần ít nhất 2 ký tự"),
  description: z
    .string()
    .min(5, "Mô tả cần ít nhất 5 ký tự")
    .max(500, "Mô tả tối đa 500 ký tự"),
  cuisine: cuisineSchema,
  // z.coerce.number: input từ <input> luôn là string -> ép về number rồi validate.
  cookTimeMinutes: z.coerce
    .number("Thời gian nấu phải là số")
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu 1 phút")
    .max(1000, "Tối đa 1000 phút"),
  ingredients: z
    .array(ingredientSchema)
    .min(1, "Cần ít nhất 1 nguyên liệu"),
});
