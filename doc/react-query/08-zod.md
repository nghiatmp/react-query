# 08. Zod — validation & nguồn chân lý dữ liệu

## Vai trò của Zod

Zod là **single source of truth** (nguồn chân lý duy nhất) cho hình dạng dữ liệu. Định nghĩa
schema **một lần**, rồi dùng lại cho 3 việc:

1. **Suy ra TypeScript type** từ schema (không khai báo type trùng lặp).
2. **Validate response API** (parse data server trả về trước khi vào cache).
3. **Validate input form** trước khi gửi mutation.

## Định nghĩa schema

File `src/features/recipes/schemas/recipeSchema.ts`:

```ts
import { z } from "zod";

export const CUISINES = ["italian","japanese","mexican","indian","american","other"] as const;
export const cuisineSchema = z.enum(CUISINES);

export const ingredientSchema = z.object({
  name: z.string().min(1, "Tên nguyên liệu không được để trống"),
  amount: z.string().min(1, "Định lượng không được để trống"),
});

// Schema đầy đủ (giống hệt data server trả về)
export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  cuisine: cuisineSchema,
  cookTimeMinutes: z.number().int().positive(),
  ingredients: z.array(ingredientSchema),
  createdAt: z.string(),
});

export const recipeListSchema = z.array(recipeSchema);

// Schema cho FORM: không có id/createdAt (server tự sinh), ràng buộc chặt hơn
export const recipeFormSchema = z.object({
  name: z.string().min(2, "Tên món cần ít nhất 2 ký tự"),
  description: z.string().min(5, "...").max(500, "..."),
  cuisine: cuisineSchema,
  cookTimeMinutes: z.coerce.number("...").int("...").min(1, "...").max(1000, "..."),
  ingredients: z.array(ingredientSchema).min(1, "Cần ít nhất 1 nguyên liệu"),
});
```

Điểm đáng chú ý:

- **`z.enum(CUISINES)`**: chỉ nhận đúng 6 giá trị cuisine hợp lệ.
- **`z.coerce.number()`**: input từ `<input>` luôn là **string**; `coerce` **ép về number**
  trước khi validate. Nhờ vậy form không cần tự `parseInt`.
- **Chuỗi thứ 2** trong `.min(2, "...")` là **thông báo lỗi** hiện cho người dùng.
- Tách `recipeSchema` (data đầy đủ) và `recipeFormSchema` (input form) vì hai thứ có ràng buộc
  khác nhau.

## Suy ra type từ schema (`z.infer`)

File `src/features/recipes/types/recipe.ts`:

```ts
import type { z } from "zod";
import type { recipeSchema, recipeFormSchema } from "../schemas/recipeSchema";

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
```

`z.infer<typeof schema>` sinh ra TypeScript type **khớp y hệt** schema. Sửa schema → type tự đổi.
Không còn cảnh khai báo `interface Recipe` riêng rồi quên đồng bộ với validation.

## Validate response API

File `src/features/recipes/api/recipeApi.ts`:

```ts
export async function fetchRecipes(filters: RecipeFilters): Promise<Recipe[]> {
  const res = await fetch(`/api/recipes?...`);
  await assertOk(res, "Không tải được danh sách công thức");
  const json = await res.json();
  return recipeListSchema.parse(json);   // ✅ validate TRƯỚC KHI vào cache
}
```

`.parse(json)`:
- Nếu data **đúng** hình dạng → trả về (đã có type `Recipe[]`).
- Nếu **sai** (server đổi field, thiếu key, sai kiểu) → **ném lỗi ngay tại đây** → React Query
  bắt được ở `isError`. Bạn biết vấn đề tại "cửa ngõ" thay vì để data hỏng lan khắp app.

## Validate form

File `src/features/recipes/components/RecipeForm.tsx`:

```ts
function handleSubmit(e) {
  e.preventDefault();

  // safeParse: KHÔNG ném lỗi, trả về { success, data | error }
  const result = recipeFormSchema.safeParse(form);

  if (!result.success) {
    // gom lỗi theo path để hiện đúng ô nhập
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");           // vd: "ingredients.0.name"
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    setErrors(fieldErrors);
    return;
  }

  setErrors({});
  onSubmit(result.data);   // result.data đã đúng type RecipeFormValues (cookTime là number)
}
```

### `parse` vs `safeParse`

| | `parse` | `safeParse` |
|---|---|---|
| Data hợp lệ | Trả về data | `{ success: true, data }` |
| Data sai | **Ném lỗi** (throw) | `{ success: false, error }` (không throw) |
| Dùng khi | API layer (muốn lỗi để React Query bắt) | Form (muốn tự xử lý, hiện lỗi từng field) |

### `issue.path` — định vị lỗi

Mỗi lỗi có `path` là mảng, vd `["ingredients", 0, "name"]`. Join lại thành `"ingredients.0.name"`
để map với đúng ô input và hiện thông báo cạnh nó.

## Validate 2 lớp: client VÀ server

Trong route handler (`src/app/api/recipes/route.ts`) cũng validate lại:

```ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = recipeFormSchema.safeParse(body);   // server KHÔNG tin client
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ", issues: parsed.error.issues },
      { status: 400 });
  }
  const created = await createRecipe(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
```

Nguyên tắc bảo mật: **luôn validate lại ở server**, không tin dữ liệu từ client (người ta có thể
gọi API trực tiếp, bỏ qua form). Dùng lại đúng `recipeFormSchema` → nhất quán, không viết 2 lần.
