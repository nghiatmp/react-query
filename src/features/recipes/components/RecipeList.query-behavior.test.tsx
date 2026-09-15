import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeFilters } from "./RecipeFilters";
import { RecipeList } from "./RecipeList";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

const recipe = {
  id: "recipe-1",
  name: "Mì carbonara",
  description: "Món mì đơn giản",
  cuisine: "italian",
  cookTimeMinutes: 20,
  ingredients: [{ name: "Mì", amount: "200g" }],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("RecipeList query behavior", () => {
  beforeEach(() => {
    useRecipePreferences.setState({
      search: "",
      cuisine: "all",
      viewMode: "grid",
      favoriteIds: [],
      favoritesOnly: false,
    });
  });

  it("does not fetch again when only favorites mode changes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([recipe]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <RecipeFilters />
        <RecipeList onOpen={vi.fn()} onCreate={vi.fn()} />
      </QueryClientProvider>,
    );

    await screen.findByText("Mì carbonara");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: "Chỉ xem yêu thích" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Chưa có công thức yêu thích",
        }),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
