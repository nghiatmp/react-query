import { beforeEach, describe, expect, it, vi } from "vitest";
import { runTransaction } from "firebase/firestore";
import { cloudAddItems } from "./repository";
import type { ShoppingItem } from "@/features/planner/model";

const transaction = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("./client", () => ({ getFirebase: () => ({ db: {} }) }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db: unknown, path: string) => path),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  runTransaction: vi.fn(async (_db: unknown, update: (tx: typeof transaction) => Promise<number>) => update(transaction)),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

const items: ShoppingItem[] = [
  { id: "slot-r1-egg", name: "Trứng", amount: "2 quả", checked: false, source: "Bữa sáng" },
  { id: "slot-r1-noodle", name: "Mì", amount: "200g", checked: false, source: "Bữa sáng" },
];

describe("cloud shopping persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero when another device already inserted every item", async () => {
    transaction.get.mockResolvedValue({ exists: () => true });

    await expect(cloudAddItems("u1", "2026-09-28", items)).resolves.toBe(0);

    expect(runTransaction).toHaveBeenCalledTimes(2);
    expect(transaction.set).not.toHaveBeenCalled();
  });
});
