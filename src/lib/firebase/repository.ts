import { collection, doc, getDoc, getDocs, runTransaction, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase } from "./client";
import { readStoredRecipe, createStoredRecipe, updateStoredRecipe, deleteStoredRecipe, importStoredRecipe } from "./recipeStorage";
import type { RecipeFilters, RecipeFormValues } from "@/features/recipes/types/recipe";
import { emptyWeek, weekSchema, itemSchema, itemFieldsSchema, type Week, type ShoppingItem } from "@/features/planner/model";

const root = (uid: string) => `users/${uid}`;
const ref = (uid: string, path: string) => doc(getFirebase().db, `${root(uid)}/${path}`);
export async function cloudRecipes(uid: string, filters: RecipeFilters) {
  const snapshot = await getDocs(collection(getFirebase().db, `${root(uid)}/recipes`));
  const recipes = await Promise.all(snapshot.docs.map(d => readStoredRecipe(getFirebase().db, uid, d.data())));
  const keyword = filters.search.trim().toLowerCase();
  return recipes.filter(r => (filters.cuisine === "all" || r.cuisine === filters.cuisine) && (!keyword || `${r.name} ${r.description}`.toLowerCase().includes(keyword)));
}
export async function cloudRecipe(uid: string, id: string) {
  const snapshot = await getDoc(ref(uid, `recipes/${id}`));
  if (!snapshot.exists()) throw new Error("Không tìm thấy công thức");
  return readStoredRecipe(getFirebase().db, uid, snapshot.data());
}
export async function cloudCreateRecipe(uid: string, values: RecipeFormValues) {
  return createStoredRecipe(getFirebase().db, uid, values);
}
export async function cloudUpdateRecipe(uid: string, id: string, values: RecipeFormValues) {
  return updateStoredRecipe(getFirebase().db, uid, id, values);
}
export async function cloudDeleteRecipe(uid: string, id: string) {
  return deleteStoredRecipe(getFirebase().db, uid, id);
}
export async function cloudFavorites(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(getFirebase().db, `${root(uid)}/favorites`));
  return snapshot.docs.map(d => d.id);
}
export async function cloudSetFavorite(uid: string, id: string, favorite: boolean) {
  const target = ref(uid, `favorites/${id}`);
  if (favorite) await setDoc(target, { recipeId: id });
  else await deleteDoc(target);
}
/** Explicit non-destructive demo import, resumable after partial failure. */
export async function importDemo(uid: string, recipes: unknown[], favoriteIds: string[]) {
  for (const raw of recipes) await importStoredRecipe(getFirebase().db, uid, raw, favoriteIds.includes((raw as { id: string }).id));
}
export async function cloudWeek(uid: string, weekStart: string): Promise<Week> {
  const snapshot = await getDoc(ref(uid, `weeks/${weekStart}`));
  return snapshot.exists() ? weekSchema.parse(snapshot.data()) : emptyWeek(weekStart);
}
export async function cloudChangeWeek(uid: string, weekStart: string, change: (week: Week) => Week) {
  return runTransaction(getFirebase().db, async tx => {
    const target = ref(uid, `weeks/${weekStart}`);
    const snapshot = await tx.get(target);
    const current = snapshot.exists() ? weekSchema.parse(snapshot.data()) : emptyWeek(weekStart);
    const next = weekSchema.parse(change(current));
    tx.set(target, next);
    return next;
  });
}
export async function cloudItems(uid: string, weekStart: string): Promise<ShoppingItem[]> {
  const snapshot = await getDocs(collection(getFirebase().db, `${root(uid)}/weeks/${weekStart}/items`));
  return snapshot.docs.map(d => itemSchema.parse({ ...d.data(), id: d.id }));
}
export async function cloudAddItems(uid: string, weekStart: string, items: ShoppingItem[]) {
  // Per-item transactions avoid overwriting checked/edited items from another device.
  let inserted = 0;
  for (const item of items) inserted += await runTransaction(getFirebase().db, async tx => {
    const target = ref(uid, `weeks/${weekStart}/items/${item.id}`);
    const old = await tx.get(target);
    if (old.exists()) return 0;
    tx.set(target, itemFieldsSchema.parse(itemFieldsSchema.strip().parse(item)));
    return 1;
  });
  return inserted;
}
export async function cloudEditItem(uid: string, weekStart: string, id: string, patch: Partial<ShoppingItem>) {
  const fields = itemFieldsSchema.partial().parse(patch);
  await updateDoc(ref(uid, `weeks/${weekStart}/items/${id}`), fields);
}
export const cloudRemoveItem = (uid: string, weekStart: string, id: string) => deleteDoc(ref(uid, `weeks/${weekStart}/items/${id}`));
