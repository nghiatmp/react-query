import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteRecipe } from "../api/recipeApi";
import { useDeleteRecipe } from "./useDeleteRecipe";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

vi.mock("../api/recipeApi", () => ({
  deleteRecipe: vi.fn(),
}));

const mockedDeleteRecipe = vi.mocked(deleteRecipe);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useDeleteRecipe favorites cleanup", () => {
  beforeEach(() => {
    useRecipePreferences.setState({ favoriteIds: ["recipe-1", "recipe-2"] });
    vi.clearAllMocks();
  });

  it("removes the deleted id after a successful DELETE", async () => {
    mockedDeleteRecipe.mockResolvedValue({ id: "recipe-1" });
    const { result } = renderHook(() => useDeleteRecipe(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.mutate("recipe-1"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useRecipePreferences.getState().favoriteIds).toEqual(["recipe-2"]);
  });

  it("keeps the local favorite when DELETE fails", async () => {
    mockedDeleteRecipe.mockRejectedValue(new Error("DELETE thất bại"));
    const { result } = renderHook(() => useDeleteRecipe(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.mutate("recipe-1"));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useRecipePreferences.getState().favoriteIds).toEqual([
      "recipe-1",
      "recipe-2",
    ]);
  });
});
