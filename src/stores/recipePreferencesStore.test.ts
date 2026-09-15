import { beforeEach, describe, expect, it } from "vitest";
import { useRecipePreferences } from "./recipePreferencesStore";

function resetPreferences() {
  useRecipePreferences.setState({
    search: "",
    cuisine: "all",
    viewMode: "grid",
    favoriteIds: [],
    favoritesOnly: false,
  });
}

describe("recipePreferencesStore", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPreferences();
  });

  it("starts with favoritesOnly disabled and can toggle it", () => {
    expect(useRecipePreferences.getState().favoritesOnly).toBe(false);

    useRecipePreferences.getState().setFavoritesOnly(true);

    expect(useRecipePreferences.getState().favoritesOnly).toBe(true);
  });

  it("removes only the deleted recipe from local favorites", () => {
    useRecipePreferences.setState({ favoriteIds: ["recipe-1", "recipe-2"] });

    useRecipePreferences.getState().removeFavorite("recipe-1");

    expect(useRecipePreferences.getState().favoriteIds).toEqual(["recipe-2"]);
  });

  it("hydrates old persisted state without favoritesOnly as false", async () => {
    localStorage.setItem(
      "recipe-preferences",
      JSON.stringify({
        state: {
          search: "ramen",
          cuisine: "all",
          viewMode: "list",
          favoriteIds: ["recipe-1"],
        },
        version: 0,
      }),
    );

    await useRecipePreferences.persist.rehydrate();

    expect(useRecipePreferences.getState()).toMatchObject({
      search: "ramen",
      viewMode: "list",
      favoriteIds: ["recipe-1"],
      favoritesOnly: false,
    });
  });
});
