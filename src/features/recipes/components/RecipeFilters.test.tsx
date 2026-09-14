import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RecipeFilters } from "./RecipeFilters";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

describe("RecipeFilters favorites toggle", () => {
  beforeEach(() => {
    useRecipePreferences.setState({ favoritesOnly: false });
  });

  it("is an accessible button toggle that works with keyboard input", async () => {
    const user = userEvent.setup();
    render(<RecipeFilters />);

    const toggle = screen.getByRole("button", { name: "Chỉ xem yêu thích" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
