import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFavorites } from "@/features/auth/useFavorites";
import * as cloud from "@/lib/firebase/repository";
import * as local from "./localRepository";
import { emptyWeek, type ShoppingItem } from "./model";
import { useChangeWeek, useShoppingMutation } from "./hooks";

const authState = vi.hoisted((): { ready: boolean; busy: boolean; user: { uid: string } | null } => ({ ready: false, busy: false, user: null }));
const localToggle = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => authState }));
vi.mock("@/stores/recipePreferencesStore", () => ({
  useRecipePreferences: (selector: (state: { favoriteIds: string[]; toggleFavorite: typeof localToggle }) => unknown) =>
    selector({ favoriteIds: [], toggleFavorite: localToggle }),
}));
vi.mock("./localRepository", () => ({
  localChangeWeek: vi.fn(),
  localAddItems: vi.fn(),
  localEditItem: vi.fn(),
  localRemoveItem: vi.fn(),
}));
vi.mock("@/lib/firebase/repository", () => ({
  cloudFavorites: vi.fn().mockResolvedValue([]),
  cloudToggleFavorite: vi.fn(),
  cloudChangeWeek: vi.fn(),
  cloudAddItems: vi.fn(),
  cloudEditItem: vi.fn(),
  cloudRemoveItem: vi.fn(),
}));

const weekStart = "2026-09-28";
const item: ShoppingItem = { id: "i1", name: "Mì", amount: "200g", checked: false, source: "" };

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function renderMutationHooks() {
  return renderHook(() => ({
    week: useChangeWeek(weekStart),
    shopping: useShoppingMutation(weekStart),
    favorites: useFavorites(),
  }), { wrapper: wrapper() });
}

describe("planner mutation auth routing", () => {
  beforeEach(() => {
    authState.ready = false;
    authState.busy = false;
    authState.user = null;
    vi.clearAllMocks();
  });

  it("blocks local writes while anonymous sign-in is pending", async () => {
    authState.ready = true;
    authState.busy = true;
    const { result } = renderMutationHooks();

    let errors: unknown[] = [];
    await act(async () => {
      errors = await Promise.all([
        result.current.week.mutateAsync(current => current).catch(error => error),
        result.current.shopping.mutateAsync({ type: "add", items: [item] }).catch(error => error),
      ]);
      result.current.favorites.toggle("r1");
    });

    for (const error of errors) expect(error).toMatchObject({ message: "Đang xác định tài khoản. Hãy thử lại." });
    expect(result.current.favorites.disabled).toBe(true);
    expect(local.localChangeWeek).not.toHaveBeenCalled();
    expect(local.localAddItems).not.toHaveBeenCalled();
    expect(local.localEditItem).not.toHaveBeenCalled();
    expect(local.localRemoveItem).not.toHaveBeenCalled();
    expect(localToggle).not.toHaveBeenCalled();
    expect(cloud.cloudChangeWeek).not.toHaveBeenCalled();
    expect(cloud.cloudAddItems).not.toHaveBeenCalled();
    expect(cloud.cloudEditItem).not.toHaveBeenCalled();
    expect(cloud.cloudRemoveItem).not.toHaveBeenCalled();
    expect(cloud.cloudToggleFavorite).not.toHaveBeenCalled();
  });

  it("blocks cloud writes while sign-out is pending", async () => {
    authState.ready = true;
    authState.busy = true;
    authState.user = { uid: "u1" };
    const { result } = renderMutationHooks();

    await act(async () => {
      await Promise.all([
        result.current.week.mutateAsync(current => current).catch(error => error),
        result.current.shopping.mutateAsync({ type: "remove", id: "i1" }).catch(error => error),
      ]);
      result.current.favorites.toggle("r1");
    });

    expect(cloud.cloudChangeWeek).not.toHaveBeenCalled();
    expect(cloud.cloudAddItems).not.toHaveBeenCalled();
    expect(cloud.cloudEditItem).not.toHaveBeenCalled();
    expect(cloud.cloudRemoveItem).not.toHaveBeenCalled();
    expect(cloud.cloudToggleFavorite).not.toHaveBeenCalled();
  });

  it("preserves local writes after anonymous auth settles", async () => {
    authState.ready = true;
    vi.mocked(local.localChangeWeek).mockResolvedValue(emptyWeek(weekStart));
    vi.mocked(local.localAddItems).mockResolvedValue(undefined);
    const { result } = renderMutationHooks();

    await act(async () => {
      await result.current.week.mutateAsync(current => current);
      await result.current.shopping.mutateAsync({ type: "add", items: [item] });
      result.current.favorites.toggle("r1");
    });

    expect(result.current.favorites.disabled).toBe(false);
    expect(local.localChangeWeek).toHaveBeenCalledWith(weekStart, expect.any(Function));
    expect(local.localAddItems).toHaveBeenCalledWith(weekStart, [item]);
    expect(localToggle).toHaveBeenCalledWith("r1");
    expect(cloud.cloudChangeWeek).not.toHaveBeenCalled();
    expect(cloud.cloudAddItems).not.toHaveBeenCalled();
    expect(cloud.cloudToggleFavorite).not.toHaveBeenCalled();
  });
});
