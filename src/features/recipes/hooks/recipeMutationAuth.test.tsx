import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRecipe, deleteRecipe, updateRecipe } from "../api/recipeApi";
import { cloudCreateRecipe, cloudDeleteRecipe, cloudUpdateRecipe } from "@/lib/firebase/repository";
import { useCreateRecipe } from "./useCreateRecipe";
import { useDeleteRecipe } from "./useDeleteRecipe";
import { useUpdateRecipe } from "./useUpdateRecipe";
import type { Recipe, RecipeFormValues } from "../types/recipe";

const authState = vi.hoisted((): { ready: boolean; busy: boolean; user: { uid: string } | null } => ({ ready: false, busy: false, user: null }));

vi.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => authState }));
vi.mock("../api/recipeApi", () => ({ createRecipe: vi.fn(), updateRecipe: vi.fn(), deleteRecipe: vi.fn() }));
vi.mock("@/lib/firebase/repository", () => ({ cloudCreateRecipe: vi.fn(), cloudUpdateRecipe: vi.fn(), cloudDeleteRecipe: vi.fn() }));

const values: RecipeFormValues = {
  name: "Mì ngon",
  description: "Nấu tại nhà",
  cuisine: "italian",
  cookTimeMinutes: 20,
  ingredients: [{ name: "Mì", amount: "200g" }],
};
const recipe: Recipe = { id: "r1", createdAt: "2026-09-28T00:00:00.000Z", ...values };

function wrapper() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("recipe mutation auth routing", () => {
  beforeEach(() => {
    authState.ready = false;
    authState.busy = false;
    authState.user = null;
    vi.clearAllMocks();
  });

  it("rejects every mutation while sign-in is pending", async () => {
    authState.ready = true;
    authState.busy = true;
    const { result } = renderHook(() => ({ create: useCreateRecipe(), update: useUpdateRecipe(), remove: useDeleteRecipe() }), { wrapper: wrapper() });

    let errors: unknown[] = [];
    await act(async () => {
      errors = await Promise.all([
        result.current.create.mutateAsync(values).catch(error => error),
        result.current.update.mutateAsync({ id: "r1", values }).catch(error => error),
        result.current.remove.mutateAsync("r1").catch(error => error),
      ]);
    });

    for (const error of errors) expect(error).toMatchObject({ message: "Đang xác định tài khoản. Hãy thử lại." });
    expect(createRecipe).not.toHaveBeenCalled();
    expect(updateRecipe).not.toHaveBeenCalled();
    expect(deleteRecipe).not.toHaveBeenCalled();
    expect(cloudCreateRecipe).not.toHaveBeenCalled();
    expect(cloudUpdateRecipe).not.toHaveBeenCalled();
    expect(cloudDeleteRecipe).not.toHaveBeenCalled();
  });

  it("rejects create, update, and delete while auth is unresolved", async () => {
    const { result } = renderHook(() => ({ create: useCreateRecipe(), update: useUpdateRecipe(), remove: useDeleteRecipe() }), { wrapper: wrapper() });
    let errors: unknown[] = [];

    await act(async () => {
      errors = await Promise.all([
        result.current.create.mutateAsync(values).catch(error => error),
        result.current.update.mutateAsync({ id: "r1", values }).catch(error => error),
        result.current.remove.mutateAsync("r1").catch(error => error),
      ]);
    });

    expect(errors).toHaveLength(3);
    for (const error of errors) expect(error).toMatchObject({ message: "Đang xác định tài khoản. Hãy thử lại." });
    expect(createRecipe).not.toHaveBeenCalled();
    expect(updateRecipe).not.toHaveBeenCalled();
    expect(deleteRecipe).not.toHaveBeenCalled();
    expect(cloudCreateRecipe).not.toHaveBeenCalled();
    expect(cloudUpdateRecipe).not.toHaveBeenCalled();
    expect(cloudDeleteRecipe).not.toHaveBeenCalled();
  });

  it("keeps demo mutations available after anonymous auth resolves", async () => {
    authState.ready = true;
    vi.mocked(createRecipe).mockResolvedValue(recipe);
    vi.mocked(updateRecipe).mockResolvedValue(recipe);
    vi.mocked(deleteRecipe).mockResolvedValue({ id: "r1" });
    const { result } = renderHook(() => ({ create: useCreateRecipe(), update: useUpdateRecipe(), remove: useDeleteRecipe() }), { wrapper: wrapper() });

    await act(async () => {
      await result.current.create.mutateAsync(values);
      await result.current.update.mutateAsync({ id: "r1", values });
      await result.current.remove.mutateAsync("r1");
    });

    expect(createRecipe).toHaveBeenCalledWith(values);
    expect(updateRecipe).toHaveBeenCalledWith("r1", values);
    expect(deleteRecipe).toHaveBeenCalledWith("r1");
  });
});
