import { z } from "zod";
import type { Recipe } from "@/features/recipes/types/recipe";

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export const MEAL_LABELS = { breakfast: "Bữa sáng", lunch: "Bữa trưa", dinner: "Bữa tối" };
export const DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
export const SLOT_KEYS = Array.from({ length: 7 }, (_, d) => MEALS.map(m => `${d}-${m}`)).flat();
export type Meal = typeof MEALS[number];
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(key: string, count: number): string {
  const date = parseDate(key);
  date.setDate(date.getDate() + count);
  return dateKey(date);
}
export function monday(date = new Date()): string {
  const day = date.getDay();
  return addDays(dateKey(date), -(day === 0 ? 6 : day - 1));
}
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(k => dateKey(parseDate(k)) === k && monday(parseDate(k)) === k, "Tuần phải bắt đầu thứ Hai");
export const weekSchema = z.object({
  weekStart: dateSchema,
  slots: z.partialRecord(z.enum(SLOT_KEYS as [string, ...string[]]), z.string().min(1).max(128)),
}).strict();
export const itemFieldsSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên nguyên liệu").max(200),
  amount: z.string().trim().min(1, "Nhập định lượng").max(100),
  checked: z.boolean(),
  source: z.string().max(300),
}).strict();
export const itemSchema = itemFieldsSchema.extend({ id: z.string().min(1).max(500) });
export type Week = z.infer<typeof weekSchema>;
export type ShoppingItem = z.infer<typeof itemSchema>;
export const emptyWeek = (weekStart: string): Week => weekSchema.parse({ weekStart, slots: {} });

function normalizedIdentity(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function stableIdentity(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x5f3759df;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x45d9f3b);
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

/** One source per meal/ingredient; text quantities are never added or converted. */
export function shoppingFromWeek(week: Week, recipes: Recipe[], existing: ShoppingItem[]): ShoppingItem[] {
  const seen = new Set(existing.map(i => i.id));
  const generated: ShoppingItem[] = [];
  for (const key of SLOT_KEYS) {
    const recipe = recipes.find(r => r.id === week.slots[key]);
    if (!recipe) continue;
    const [day, meal] = key.split("-");
    const recipeIdentity = stableIdentity(recipe.id);
    recipe.ingredients.forEach((ingredient, index) => {
      const ingredientIdentity = stableIdentity(`${normalizedIdentity(ingredient.name)}\u0000${normalizedIdentity(ingredient.amount)}`);
      const id = `meal-${key}-${recipeIdentity}-${index}-${ingredientIdentity}`;
      if (!seen.has(id)) generated.push(itemSchema.parse({
        id, ...ingredient, checked: false,
        source: `${DAYS[Number(day)]} · ${MEAL_LABELS[meal as Meal]} · ${recipe.name}`,
      }));
    });
  }
  return generated;
}
