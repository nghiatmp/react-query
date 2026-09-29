import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MealPlanner } from "./MealPlanner";
import { ShoppingList } from "./ShoppingList";
import type { Recipe } from "@/features/recipes/types/recipe";

const authState = vi.hoisted(() => ({ ready: true, busy: false, user: null }));
const fixtures = vi.hoisted(() => ({
  weekStart: "2026-09-28",
  recipe: {
    id: "r1",
    name: "Mì ngon",
    description: "Nấu tại nhà",
    cuisine: "italian",
    cookTimeMinutes: 20,
    ingredients: [{ name: "Mì", amount: "200g" }],
    createdAt: "2026-09-28T00:00:00.000Z",
  } as Recipe,
}));
const changeMutation = vi.hoisted(() => ({
  mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null,
}));
const shoppingMutation = vi.hoisted(() => ({
  mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null,
}));

vi.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => authState }));
vi.mock("@/components/AppShell", () => ({ AppShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/features/recipes/components/RecipePhoto", () => ({ RecipePhoto: () => <div/> }));
vi.mock("@/features/recipes/hooks/useRecipes", () => ({
  useRecipes: () => ({ data: [fixtures.recipe], isPending: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/features/auth/useFavorites", () => ({
  useFavorites: () => ({ ids: [], toggle: vi.fn(), disabled: !authState.ready || authState.busy, pending: false, error: null, retry: vi.fn() }),
}));
vi.mock("./useBrowserWeek", () => ({
  useBrowserWeek: () => ({ week: fixtures.weekStart, today: null }),
}));
vi.mock("./hooks", () => ({
  useWeek: (week: string) => ({
    data: { weekStart: week, slots: { "0-breakfast": "r1" } },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useChangeWeek: () => changeMutation,
  useShopping: () => ({
    data: [{ id: "i1", name: "Mì", amount: "200g", checked: false, source: "" }],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useShoppingMutation: () => shoppingMutation,
}));

describe("planner mutation controls during auth transitions", () => {
  beforeEach(() => {
    authState.ready = true;
    authState.busy = false;
    vi.clearAllMocks();
  });

  it("disables meal plan and shopping writes while sign-in is pending", () => {
    authState.busy = true;
    const planner = render(<MealPlanner initialWeek={fixtures.weekStart}/>);

    expect(screen.getByRole("button", { name: "Sao chép tuần trước" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thay món Thứ Hai Bữa sáng" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Gỡ món Thứ Hai Bữa sáng" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Chọn món Thứ Hai Bữa tối" })).toBeDisabled();
    planner.unmount();

    render(<ShoppingList initialWeek={fixtures.weekStart}/>);
    expect(screen.getByRole("button", { name: "Thêm nguyên liệu" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Đã mua Mì" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sửa Mì" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xóa Mì" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thêm từ thực đơn" })).toBeDisabled();
  });
});
