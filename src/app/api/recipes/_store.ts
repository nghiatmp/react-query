import type {
  Recipe,
  RecipeFormValues,
  RecipeFilters,
} from "@/features/recipes/types/recipe";

/**
 * "Cơ sở dữ liệu" giả lập chạy trong bộ nhớ của tiến trình server.
 * Dữ liệu tồn tại đến khi restart dev server. Đủ để mô phỏng backend thật:
 * có độ trễ mạng, có thể lỗi, và mọi thao tác đều bất đồng bộ.
 *
 * File bắt đầu bằng "_" nên Next.js KHÔNG coi đây là route.
 *
 * VÌ SAO PHẢI GẮN DỮ LIỆU VÀO `globalThis`?
 * -----------------------------------------
 * Module này được import từ HAI phía khác nhau:
 *   - Route handler  `src/app/api/recipes/route.ts`  (bundle layer "app-route")
 *   - Server Component `src/app/ssr-demo/page.tsx`   (bundle layer "rsc")
 *
 * Next.js bundle hai layer đó RIÊNG BIỆT, nên nếu để dữ liệu trong một biến
 * module-scope (`let recipes = [...]`) thì mỗi layer sẽ có MỘT BẢN RIÊNG:
 * thêm công thức qua /api/recipes xong mở /ssr-demo vẫn chỉ thấy dữ liệu seed.
 *
 * `globalThis` chỉ có một, dùng chung cho cả tiến trình -> hai layer thấy
 * cùng một mảng. Đây cũng là mẹo quen thuộc khi giữ instance Prisma/DB pool
 * sống qua các lần hot-reload của `next dev`.
 */

// Giả lập độ trễ mạng để bạn quan sát rõ trạng thái loading trên UI.
function delay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

declare global {
  var __recipeStore: { recipes: Recipe[] } | undefined;
}

function seedRecipes(): Recipe[] {
  return [
    {
      id: "r1",
      name: "Spaghetti Carbonara",
      description:
        "Mì Ý sốt trứng và phô mai béo ngậy, thêm thịt xông khói giòn.",
      cuisine: "italian",
      cookTimeMinutes: 25,
      ingredients: [
        { name: "Mì spaghetti", amount: "200g" },
        { name: "Trứng gà", amount: "2 quả" },
        { name: "Phô mai Parmesan", amount: "50g" },
        { name: "Thịt xông khói", amount: "100g" },
      ],
      createdAt: new Date("2026-01-10").toISOString(),
    },
    {
      id: "r2",
      name: "Sushi cá hồi",
      description: "Cơm cuộn cá hồi tươi kiểu Nhật, ăn kèm wasabi và gừng.",
      cuisine: "japanese",
      cookTimeMinutes: 40,
      ingredients: [
        { name: "Cơm sushi", amount: "300g" },
        { name: "Cá hồi phi lê", amount: "150g" },
        { name: "Rong biển", amount: "3 lá" },
      ],
      createdAt: new Date("2026-02-05").toISOString(),
    },
    {
      id: "r3",
      name: "Tacos gà",
      description: "Bánh taco giòn kẹp gà xé, rau tươi và sốt chua cay.",
      cuisine: "mexican",
      cookTimeMinutes: 30,
      ingredients: [
        { name: "Vỏ taco", amount: "6 cái" },
        { name: "Ức gà", amount: "250g" },
        { name: "Rau xà lách", amount: "100g" },
      ],
        createdAt: new Date("2026-03-01").toISOString(),
      },
  ];
}

/**
 * `??=` -> chỉ tạo seed ở lần nạp module ĐẦU TIÊN. Các lần nạp sau (layer khác,
 * hoặc sau hot-reload) đều nhận lại ĐÚNG object đang có.
 *
 * Lưu ý: `store` là một OBJECT bọc ngoài, không phải mảng trực tiếp. Nhờ vậy
 * các hàm dưới đây gán `store.recipes = [...]` thì mọi bản nạp module đều thấy,
 * vì tất cả đang giữ cùng một tham chiếu tới object bọc này.
 */
const store = (globalThis.__recipeStore ??= { recipes: seedRecipes() });

// GET danh sách + lọc theo search / cuisine (giả lập backend lọc dữ liệu).
export async function listRecipes(filters: RecipeFilters): Promise<Recipe[]> {
  await delay();
  const keyword = filters.search.trim().toLowerCase();
  return store.recipes.filter((r) => {
    const matchCuisine =
      filters.cuisine === "all" || r.cuisine === filters.cuisine;
    const matchSearch =
      keyword === "" ||
      r.name.toLowerCase().includes(keyword) ||
      r.description.toLowerCase().includes(keyword);
    return matchCuisine && matchSearch;
  });
}

// GET chi tiết theo id.
export async function getRecipe(id: string): Promise<Recipe | undefined> {
  await delay(400);
  return store.recipes.find((r) => r.id === id);
}

// POST tạo mới -> server tự sinh id + createdAt.
export async function createRecipe(input: RecipeFormValues): Promise<Recipe> {
  await delay();
  const created: Recipe = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  store.recipes = [created, ...store.recipes];
  return created;
}

// PUT cập nhật -> trả về recipe sau khi sửa, hoặc undefined nếu không tìm thấy.
export async function updateRecipe(
  id: string,
  input: RecipeFormValues,
): Promise<Recipe | undefined> {
  await delay();
  const index = store.recipes.findIndex((r) => r.id === id);
  if (index === -1) return undefined;
  const updated: Recipe = { ...store.recipes[index], ...input };
  store.recipes[index] = updated;
  return updated;
}

// DELETE -> true nếu xoá được.
export async function deleteRecipe(id: string): Promise<boolean> {
  await delay();
  const before = store.recipes.length;
  store.recipes = store.recipes.filter((r) => r.id !== id);
  return store.recipes.length < before;
}
