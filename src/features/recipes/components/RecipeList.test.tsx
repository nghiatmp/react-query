import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeList } from "./RecipeList";
import { useRecipes } from "../hooks/useRecipes";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import type { Recipe } from "../types/recipe";

vi.mock("../hooks/useRecipes", () => ({
  useRecipes: vi.fn(),
}));

const mockedUseRecipes = vi.mocked(useRecipes);

const recipes: Recipe[] = [
  {
    id: "recipe-1",
    name: "Mì yêu thích",
    description: "Món mì yêu thích",
    cuisine: "italian",
    cookTimeMinutes: 20,
    ingredients: [{ name: "Mì", amount: "200g" }],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "recipe-2",
    name: "Mì khác",
    description: "Món mì khác",
    cuisine: "japanese",
    cookTimeMinutes: 15,
    ingredients: [{ name: "Mì udon", amount: "200g" }],
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

function setupQuery(data: Recipe[] = recipes) {
  mockedUseRecipes.mockReturnValue({
    data,
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useRecipes>);
}

describe("RecipeList favorites filter", () => {
  beforeEach(() => {
    useRecipePreferences.setState({
      search: "",
      cuisine: "all",
      viewMode: "grid",
      favoriteIds: [],
      favoritesOnly: false,
    });
    vi.clearAllMocks();
  });

  it("renders only favorites while keeping query data objects as the source", () => {
    setupQuery();
    useRecipePreferences.setState({
      favoriteIds: ["recipe-1"],
      favoritesOnly: true,
    });

    render(<RecipeList onOpen={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByText("Mì yêu thích")).toBeInTheDocument();
    expect(screen.queryByText("Mì khác")).not.toBeInTheDocument();
  });

  it("shows a distinct empty state when favorites do not match the server result", async () => {
    const user = userEvent.setup();
    setupQuery();
    useRecipePreferences.setState({
      favoriteIds: ["recipe-not-in-result"],
      favoritesOnly: true,
    });

    render(<RecipeList onOpen={vi.fn()} onCreate={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Không có công thức yêu thích phù hợp",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Tắt chế độ chỉ xem yêu thích",
      }),
    );

    expect(useRecipePreferences.getState().favoritesOnly).toBe(false);
  });

  it("keeps the favorites empty state when server filters return no recipes", () => {
    setupQuery([]);
    useRecipePreferences.setState({ favoritesOnly: true });

    render(<RecipeList onOpen={vi.fn()} onCreate={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Chưa có công thức yêu thích" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Không có công thức nào" }),
    ).not.toBeInTheDocument();
  });
});
