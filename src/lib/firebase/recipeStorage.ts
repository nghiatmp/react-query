import { z } from "zod";
import { collection, doc, getDocs, runTransaction, type Firestore, type Transaction } from "firebase/firestore";
import { recipeSchema, recipeFormSchema, ingredientSchema } from "@/features/recipes/schemas/recipeSchema";
import type { Recipe, RecipeFormValues } from "@/features/recipes/types/recipe";

export const recipeMetadataSchema = recipeSchema.omit({ ingredients: true }).extend({
  ingredientCount: z.number().int().min(1).max(30),
  revision: z.number().int().positive(),
}).strict();
const storedIngredientSchema = ingredientSchema.extend({ index: z.number().int().min(0).max(29), revision: z.number().int().positive() }).strict();
const target = (db: Firestore, uid: string, id: string) => doc(db, `users/${uid}/recipes/${id}`);
const ingredientRef = (db: Firestore, uid: string, id: string, index: number) => doc(db, `users/${uid}/recipes/${id}/ingredients/${index}`);

/** Domain/API shape stays unchanged; only the new Firebase storage is normalized. */
export async function readStoredRecipe(db: Firestore, uid: string, raw: unknown): Promise<Recipe> {
  const metadata = recipeMetadataSchema.parse(raw);
  const snapshot = await getDocs(collection(db, `users/${uid}/recipes/${metadata.id}/ingredients`));
  const ingredients = snapshot.docs.map(d => {
    const item = storedIngredientSchema.parse(d.data());
    if (d.id !== String(item.index) || item.revision !== metadata.revision) throw new Error("Công thức đang thay đổi. Hãy tải lại.");
    return item;
  }).sort((a, b) => a.index - b.index);
  if (ingredients.length !== metadata.ingredientCount || ingredients.some((item, index) => item.index !== index)) {
    throw new Error("Công thức thiếu nguyên liệu. Hãy tải lại hoặc liên hệ chủ dữ liệu.");
  }
  return recipeSchema.parse({ ...metadata, ingredients: ingredients.map(({ name, amount }) => ({ name, amount })) });
}

function writeRecipe(tx: Transaction, db: Firestore, uid: string, recipe: Recipe, revision: number, previousCount = 0) {
  const { ingredients, ...metadata } = recipe;
  tx.set(target(db, uid, recipe.id), { ...metadata, ingredientCount: ingredients.length, revision });
  ingredients.forEach((item, index) => tx.set(ingredientRef(db, uid, recipe.id, index), { ...item, index, revision }));
  for (let index = ingredients.length; index < previousCount; index++) tx.delete(ingredientRef(db, uid, recipe.id, index));
}

export async function createStoredRecipe(db: Firestore, uid: string, values: RecipeFormValues) {
  const recipe = recipeSchema.parse({ ...recipeFormSchema.parse(values), id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  await runTransaction(db, async tx => {
    if ((await tx.get(target(db, uid, recipe.id))).exists()) throw new Error("ID công thức đã tồn tại. Hãy thử lại.");
    writeRecipe(tx, db, uid, recipe, 1);
  });
  return recipe;
}
export async function updateStoredRecipe(db: Firestore, uid: string, id: string, values: RecipeFormValues) {
  const fields = recipeFormSchema.parse(values);
  return runTransaction(db, async tx => {
    const old = await tx.get(target(db, uid, id));
    if (!old.exists()) throw new Error("Không tìm thấy công thức");
    const metadata = recipeMetadataSchema.parse(old.data());
    const recipe = recipeSchema.parse({ ...metadata, ...fields });
    writeRecipe(tx, db, uid, recipe, metadata.revision + 1, metadata.ingredientCount);
    return recipe;
  });
}
export async function deleteStoredRecipe(db: Firestore, uid: string, id: string) {
  await runTransaction(db, async tx => {
    const old = await tx.get(target(db, uid, id));
    if (old.exists()) {
      const metadata = recipeMetadataSchema.parse(old.data());
      for (let index = 0; index < metadata.ingredientCount; index++) tx.delete(ingredientRef(db, uid, id, index));
      tx.delete(target(db, uid, id));
    }
    tx.delete(doc(db, `users/${uid}/favorites/${id}`));
  });
  return { id };
}
/** Import each complete recipe and its favorite atomically; existing cloud recipes remain untouched. */
export async function importStoredRecipe(db: Firestore, uid: string, raw: unknown, favorite: boolean) {
  const recipe = recipeSchema.parse(raw);
  const valid = recipeFormSchema.parse(recipe);
  await runTransaction(db, async tx => {
    const old = await tx.get(target(db, uid, recipe.id));
    if (!old.exists()) writeRecipe(tx, db, uid, { ...recipe, ...valid }, 1);
    if (favorite) tx.set(doc(db, `users/${uid}/favorites/${recipe.id}`), { recipeId: recipe.id });
  });
}
