import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, runTransaction, writeBatch, type Firestore } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithCredential, GoogleAuthProvider, signOut } from "firebase/auth";
import { createStoredRecipe, updateStoredRecipe, deleteStoredRecipe, readStoredRecipe, importStoredRecipe } from "@/lib/firebase/recipeStorage";
let env: RulesTestEnvironment;
const recipe = { id: "r1", name: "Mì ngon", description: "Nấu tại nhà", cuisine: "italian" as const, cookTimeMinutes: 25, ingredients: [{ name: "Trứng", amount: "2 quả" }], createdAt: "2026-09-28T00:00:00.000Z" };
const week = { weekStart: "2026-09-28", slots: { "0-breakfast": "r1" } };
const item = { name: "Trứng", amount: "2 quả", checked: false, source: "Thứ Hai · Bữa sáng" };
const dbFor = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const values = (count: number) => ({ ...recipe, ingredients: Array.from({ length: count }, (_, index) => ({ name: `Nguyên liệu ${index}`, amount: `${index + 1} quả` })) });
async function read(db: Firestore, uid: string, id: string) { return readStoredRecipe(db, uid, (await getDoc(doc(db, `users/${uid}/recipes/${id}`))).data()); }
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: "demo-meal-planner", firestore: { host: "127.0.0.1", port: 8080, rules: await readFile("firestore.rules", "utf8") } }); });
beforeEach(async () => env.clearFirestore());
afterAll(async () => { await env?.cleanup(); });
describe("Firestore ownership, atomic adapter and validation (actual emulator)", () => {
  it("allows 30-ingredient owner CRUD preserving order across clients and leaves no children after shrink/delete", async () => {
    const db = dbFor("alice"); const created = await assertSucceeds(createStoredRecipe(db, "alice", values(30)));
    expect((await read(dbFor("alice"), "alice", created.id)).ingredients).toEqual(values(30).ingredients);
    await assertSucceeds(updateStoredRecipe(db, "alice", created.id, { ...values(30), name: "Món mới đủ 30" }));
    expect((await read(db, "alice", created.id)).name).toBe("Món mới đủ 30");
    await assertSucceeds(updateStoredRecipe(db, "alice", created.id, values(2)));
    expect((await getDocs(collection(db, `users/alice/recipes/${created.id}/ingredients`))).size).toBe(2);
    await assertSucceeds(deleteStoredRecipe(db, "alice", created.id));
    expect((await getDoc(doc(db, `users/alice/recipes/${created.id}`))).exists()).toBe(false);
    expect((await getDocs(collection(db, `users/alice/recipes/${created.id}/ingredients`))).empty).toBe(true);
  });
  it("imports recipe and favorite atomically and preserves existing cloud edits", async () => {
    const db = dbFor("alice"); await importStoredRecipe(db, "alice", recipe, true);
    expect((await getDoc(doc(db, "users/alice/favorites/r1"))).exists()).toBe(true);
    await updateStoredRecipe(db, "alice", "r1", { ...recipe, name: "Giữ tên đã sửa" });
    await importStoredRecipe(db, "alice", recipe, true);
    expect((await read(db, "alice", "r1")).name).toBe("Giữ tên đã sửa");
  });
  it("persists week/shopping edits/checks across clients and preserves concurrent slots", async () => {
    const db = dbFor("alice"); await setDoc(doc(db, "users/alice/weeks/2026-09-28"), week);
    await setDoc(doc(db, "users/alice/weeks/2026-09-28/items/i1"), item);
    await updateDoc(doc(db, "users/alice/weeks/2026-09-28/items/i1"), { checked: true, amount: "4 quả" });
    expect((await getDoc(doc(dbFor("alice"), "users/alice/weeks/2026-09-28/items/i1"))).data()).toMatchObject({ checked: true, amount: "4 quả" });
    await Promise.all([[db, "1-lunch"], [dbFor("alice"), "2-dinner"]].map(([database, key]) => runTransaction(database as Firestore, async tx => {
      const target = doc(database as Firestore, "users/alice/weeks/2026-09-28"); const old = await tx.get(target);
      tx.set(target, { ...week, slots: { ...old.data()?.slots, [key as string]: "r1" } });
    })));
    expect((await getDoc(doc(db, "users/alice/weeks/2026-09-28"))).data()?.slots).toEqual({ "0-breakfast": "r1", "1-lunch": "r1", "2-dinner": "r1" });
    await deleteDoc(doc(db, "users/alice/weeks/2026-09-28/items/i1"));
    expect((await getDocs(collection(db, "users/alice/weeks/2026-09-28/items"))).empty).toBe(true);
  });
  it("denies anonymous/other-user read/write/delete/list for all collections including ingredients", async () => {
    const owner = dbFor("alice"); await importStoredRecipe(owner, "alice", recipe, true);
    await setDoc(doc(owner, "users/alice/weeks/2026-09-28"), week); await setDoc(doc(owner, "users/alice/weeks/2026-09-28/items/i1"), item);
    for (const db of [env.unauthenticatedContext().firestore() as unknown as Firestore, dbFor("bob")]) {
      for (const path of ["recipes/r1", "recipes/r1/ingredients/0", "favorites/r1", "weeks/2026-09-28", "weeks/2026-09-28/items/i1"]) {
        const data = (await getDoc(doc(owner, `users/alice/${path}`))).data()!;
        await assertFails(getDoc(doc(db, `users/alice/${path}`))); await assertFails(setDoc(doc(db, `users/alice/${path}`), data)); await assertFails(deleteDoc(doc(db, `users/alice/${path}`)));
      }
      for (const path of ["recipes", "recipes/r1/ingredients", "favorites", "weeks", "weeks/2026-09-28/items"]) await assertFails(getDocs(collection(db, `users/alice/${path}`)));
    }
  });
  it("rejects malformed first/middle/last ingredients and rolls back entire 30-item batch", async () => {
    const db = dbFor("alice"); const created = await createStoredRecipe(db, "alice", values(30));
    const parent = doc(db, `users/alice/recipes/${created.id}`); const metadata = (await getDoc(parent)).data()!;
    const badFields = [{ name: "Egg" }, { name: "Egg", amount: 2 }, { name: 2, amount: "1" }, { name: " ", amount: "1" }, { name: "\u00a0", amount: "1" }, { name: "Egg", amount: "" }, { name: "Egg", amount: "1", extra: true }, { name: "Egg", amount: "1", index: 31 }, { name: "Egg", amount: "1", revision: 9 }];
    for (const index of [0, 15, 29]) for (const bad of badFields) {
      const batch = writeBatch(db); batch.update(parent, { revision: 2 });
      for (let i = 0; i < 30; i++) batch.set(doc(db, `users/alice/recipes/${created.id}/ingredients/${i}`), i === index ? { index: i, revision: 2, ...bad } : { ...values(30).ingredients[i], index: i, revision: 2 });
      await assertFails(batch.commit()).catch(error => { throw new Error(`Malformed index=${index}; fields=${JSON.stringify(bad)}`, { cause: error }); });
      expect((await getDoc(parent)).data()).toEqual(metadata);
    }
    await assertFails(deleteDoc(doc(db, `users/alice/recipes/${created.id}/ingredients/0`)));
    await assertFails(setDoc(doc(db, "users/alice/recipes/missing/ingredients/0"), { name: "Egg", amount: "1", index: 0, revision: 1 }));
    for (const bad of [{ createdAt: "2026-09-29T00:00:00.000Z" }, { ingredientCount: 31 }, { ingredientCount: 0 }, { admin: true }, { name: 7 }, { name: "\u00a0\u00a0" }, { cuisine: "bad" }, { cookTimeMinutes: -1 }]) await assertFails(updateDoc(parent, { ...bad, revision: 2 }));
    await assertFails(setDoc(doc(db, "public/data"), { open: true }));
  });
  it("rejects invalid week, slot, shopping and favorite fields", async () => {
    const db = dbFor("alice");
    for (const invalid of [{ ...week, slots: { "7-dinner": "r1" } }, { ...week, slots: { "0-breakfast": 7 } }, { ...week, weekStart: "2026-09-21" }]) await assertFails(setDoc(doc(db, "users/alice/weeks/2026-09-28"), invalid));
    for (const date of ["2026-09-29", "2026-02-30"]) await assertFails(setDoc(doc(db, `users/alice/weeks/${date}`), { ...week, weekStart: date }));
    for (const invalid of [{ ...item, checked: "true" }, { ...item, name: " " }, { ...item, amount: "" }, { ...item, source: 5 }, { ...item, admin: true }]) await assertFails(setDoc(doc(db, "users/alice/weeks/2026-09-28/items/i1"), invalid));
    await assertFails(setDoc(doc(db, "users/alice/favorites/missing"), { recipeId: "missing" }));
  });
  it("serializes concurrent full recipe edits without mixed revisions", async () => {
    const db = dbFor("alice"); const created = await createStoredRecipe(db, "alice", values(30));
    await Promise.all([updateStoredRecipe(db, "alice", created.id, { ...values(30), name: "Edit A" }), updateStoredRecipe(dbFor("alice"), "alice", created.id, { ...values(3), name: "Edit B" })]);
    const final = await read(db, "alice", created.id); expect(final.ingredients).toEqual(final.name === "Edit A" ? values(30).ingredients : values(3).ingredients);
    expect((await getDoc(doc(db, `users/alice/recipes/${created.id}`))).data()?.revision).toBe(3);
  });
});
describe("Firebase Auth Google credential (actual auth emulator)", () => {
  it("authenticates a test Google identity and signs out", async () => {
    const app = initializeApp({ apiKey: "demo-api-key", projectId: "demo-meal-planner" }, "auth-test"); const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    try { const result = await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: "test-google-user", email: "emulator@example.test", email_verified: true, name: "Emulator Test" }))); expect(result.user.providerData[0].providerId).toBe("google.com"); await signOut(auth); expect(auth.currentUser).toBeNull(); } finally { await deleteApp(app); }
  });
});
