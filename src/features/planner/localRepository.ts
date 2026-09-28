import { emptyWeek, weekSchema, itemSchema, type Week, type ShoppingItem } from "./model";
import { z } from "zod";
const weekKey = (week: string) => `meal-demo:week:${week}`;
const itemsKey = (week: string) => `meal-demo:shopping:${week}`;
// Reading happens in query functions after hydration; storage failures surface to UI.
export async function localWeek(week: string): Promise<Week> {
  const raw = localStorage.getItem(weekKey(week));
  return raw ? weekSchema.parse(JSON.parse(raw)) : emptyWeek(week);
}
export async function localChangeWeek(week: string, change: (current: Week) => Week): Promise<Week> {
  const current = await localWeek(week);
  const next = weekSchema.parse(change(current));
  localStorage.setItem(weekKey(week), JSON.stringify(next));
  return next;
}
export async function localItems(week: string): Promise<ShoppingItem[]> {
  const raw = localStorage.getItem(itemsKey(week));
  return raw ? z.array(itemSchema).parse(JSON.parse(raw)) : [];
}
export async function localAddItems(week: string, items: ShoppingItem[]) {
  const current = await localItems(week);
  const ids = new Set(current.map(i => i.id));
  localStorage.setItem(itemsKey(week), JSON.stringify([...current, ...items.filter(i => !ids.has(i.id)).map(i => itemSchema.parse(i))]));
}
export async function localEditItem(week: string, id: string, patch: Partial<ShoppingItem>) {
  const items = await localItems(week);
  localStorage.setItem(itemsKey(week), JSON.stringify(items.map(i => i.id === id ? itemSchema.parse({ ...i, ...patch }) : i)));
}
export async function localRemoveItem(week: string, id: string) {
  localStorage.setItem(itemsKey(week), JSON.stringify((await localItems(week)).filter(i => i.id !== id)));
}
