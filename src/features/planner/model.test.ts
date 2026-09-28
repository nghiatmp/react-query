import { describe, expect, it, beforeEach } from "vitest";
import { monday, addDays, emptyWeek, weekSchema, shoppingFromWeek, itemSchema } from "./model";
import * as local from "./localRepository";
import type { Recipe } from "@/features/recipes/types/recipe";
const recipe: Recipe = { id: "r1", name: "Mì Ý", description: "Mì ngon tại nhà", cuisine: "italian", cookTimeMinutes: 20, ingredients: [{ name: "Trứng", amount: "2 quả" }, { name: "Trứng", amount: "100g" }], createdAt: "2026-01-01T00:00:00.000Z" };
describe("calendar and shopping behavior", () => {
  beforeEach(() => localStorage.clear());
  it("starts on Monday across month/year/leap-day boundaries without UTC shifting", () => {
    expect(monday(new Date(2027, 0, 3, 23, 59))).toBe("2026-12-28");
    expect(monday(new Date(2026, 8, 28, 0, 1))).toBe("2026-09-28");
    expect(addDays("2024-02-26", 7)).toBe("2024-03-04");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
    expect(weekSchema.safeParse({ weekStart: "2026-09-29", slots: {} }).success).toBe(false);
    expect(weekSchema.safeParse({ weekStart: "2026-02-30", slots: {} }).success).toBe(false);
  });
  it("preserves different units and repeated meals, and does not overwrite edits/checks on generation", () => {
    const week = { ...emptyWeek("2026-09-28"), slots: { "0-breakfast": "r1", "1-lunch": "r1" } };
    const first = shoppingFromWeek(week, [recipe], []);
    expect(first).toHaveLength(4);
    expect(first.map(i => i.amount)).toEqual(["2 quả", "100g", "2 quả", "100g"]);
    const edited = first.map((item, index) => index === 0 ? { ...item, name: "Trứng hữu cơ", amount: "4 quả", checked: true } : item);
    expect(shoppingFromWeek(week, [recipe], edited)).toEqual([]);
    expect(edited[0]).toMatchObject({ name: "Trứng hữu cơ", checked: true, amount: "4 quả" });
    expect(shoppingFromWeek({ ...week, slots: { "0-breakfast": "deleted" } }, [recipe], [])).toEqual([]);
  });
  it("persists slot add/replace/remove, prior-week copy, shopping edits and checked state across reloads", async () => {
    const week = "2026-09-28";
    await local.localChangeWeek(week, current => ({ ...current, slots: { "0-breakfast": "r1" } }));
    expect((await local.localWeek(week)).slots["0-breakfast"]).toBe("r1");
    await local.localChangeWeek(week, current => ({ ...current, slots: { "0-breakfast": "r2" } }));
    expect((await local.localWeek(week)).slots["0-breakfast"]).toBe("r2");
    await local.localChangeWeek(week, current => ({ ...current, slots: {} }));
    expect((await local.localWeek(week)).slots).toEqual({});
    await local.localChangeWeek("2026-09-21", current => ({ ...current, slots: { "2-dinner": "r1" } }));
    const previous = await local.localWeek("2026-09-21");
    await local.localChangeWeek(week, current => ({ ...current, slots: previous.slots }));
    const generated = shoppingFromWeek(await local.localWeek(week), [recipe], []);
    await local.localAddItems(week, generated);
    await local.localEditItem(week, generated[0].id, { amount: "3 quả", checked: true });
    await local.localAddItems(week, generated);
    expect(await local.localItems(week)).toHaveLength(2);
    expect((await local.localItems(week))[0]).toMatchObject({ amount: "3 quả", checked: true });
    expect(await local.localItems("2026-10-05")).toEqual([]);
    await local.localRemoveItem(week, generated[0].id);
    expect(await local.localItems(week)).toHaveLength(1);
  });
  it("rejects invalid slot keys, empty shopping fields and nonboolean checked values", () => {
    expect(weekSchema.safeParse({ weekStart: "2026-09-28", slots: { "7-dinner": "r1" } }).success).toBe(false);
    expect(itemSchema.safeParse({ id: "i1", name: " ", amount: "1", checked: true, source: "" }).success).toBe(false);
    expect(itemSchema.safeParse({ id: "i1", name: "Gạo", amount: "1kg", checked: "yes", source: "" }).success).toBe(false);
  });
});
