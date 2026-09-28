import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeDetail } from "./RecipeDetail";
import { RecipeForm } from "./RecipeForm";
import { RecipesPage } from "./RecipesPage";
import { useDeleteRecipe } from "../hooks/useDeleteRecipe";
import { useRecipe } from "../hooks/useRecipe";
import { useRecipes } from "../hooks/useRecipes";
import type { Recipe } from "../types/recipe";

const authState = vi.hoisted(() => ({
  ready: false,
  user: null,
  configured: true,
  busy: false,
  error: null as string | null,
  login: vi.fn(),
  logout: vi.fn(),
}));
const recipe: Recipe = {
  id: "r1",
  name: "Mì ngon",
  description: "Nấu tại nhà",
  cuisine: "italian",
  cookTimeMinutes: 20,
  ingredients: [{ name: "Mì", amount: "200g" }],
  createdAt: "2026-09-28T00:00:00.000Z",
};

vi.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => authState }));
vi.mock("@/features/auth/useFavorites", () => ({
  useFavorites: () => ({ ids: [], toggle: vi.fn(), pending: false, error: null, retry: vi.fn() }),
}));
vi.mock("../hooks/useRecipes", () => ({ useRecipes: vi.fn() }));
vi.mock("../hooks/useRecipe", () => ({ useRecipe: vi.fn() }));
vi.mock("../hooks/useDeleteRecipe", () => ({ useDeleteRecipe: vi.fn() }));

function withQueryClient(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

describe("recipe mutation controls during auth resolution", () => {
  beforeEach(() => {
    authState.ready = false;
    authState.error = null;
    vi.clearAllMocks();
    vi.mocked(useRecipes).mockReturnValue({
      data: [], isPending: false, isError: false, error: null, isFetching: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRecipes>);
    vi.mocked(useRecipe).mockReturnValue({
      data: recipe, isPending: false, isError: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRecipe>);
    vi.mocked(useDeleteRecipe).mockReturnValue({
      mutate: vi.fn(), isPending: false, error: null,
    } as unknown as ReturnType<typeof useDeleteRecipe>);
  });

  it("disables every visible create entry point", () => {
    withQueryClient(<RecipesPage/>);
    const createButtons = screen.getAllByRole("button", { name: /Thêm công thức/ });
    expect(createButtons).toHaveLength(2);
    for (const button of createButtons) expect(button).toBeDisabled();
  });

  it("disables edit and delete actions", () => {
    withQueryClient(<RecipeDetail recipeId="r1" onEdit={vi.fn()} onDeleted={vi.fn()}/>);
    expect(screen.getByRole("button", { name: "Xoá" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sửa" })).toBeDisabled();
  });

  it("disables form submission", () => {
    withQueryClient(<RecipeForm submitLabel="Lưu thay đổi" isSubmitting={false} onSubmit={vi.fn()} onCancel={vi.fn()}/>);
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
  });

  it("keeps mutation controls disabled and shows guidance after auth failure", () => {
    authState.error = "Không đọc được phiên đăng nhập. Tải lại trang để thử lại.";
    withQueryClient(<RecipesPage/>);

    expect(screen.getByRole("alert")).toHaveTextContent(authState.error);
    for (const button of screen.getAllByRole("button", { name: /Thêm công thức/ })) expect(button).toBeDisabled();
  });
});
