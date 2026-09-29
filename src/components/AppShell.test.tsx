import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRecipes } from "@/features/recipes/api/recipeApi";
import { importDemo } from "@/lib/firebase/repository";
import { AppShell } from "./AppShell";

const authState = vi.hoisted(() => ({
  ready: true,
  busy: true,
  configured: true,
  user: { uid: "u1", displayName: "Người dùng" },
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => authState }));
vi.mock("@/features/auth/useFavorites", () => ({
  useFavorites: () => ({ ids: [], toggle: vi.fn(), disabled: false, pending: false, error: null, retry: vi.fn() }),
}));
vi.mock("@/lib/firebase/client", () => ({ emulatorMode: false }));
vi.mock("@/features/recipes/api/recipeApi", () => ({ fetchRecipes: vi.fn() }));
vi.mock("@/lib/firebase/repository", () => ({ importDemo: vi.fn() }));
vi.mock("@/stores/recipePreferencesStore", () => ({
  useRecipePreferences: Object.assign(vi.fn(), { getState: () => ({ favoriteIds: ["r1"] }) }),
}));

describe("AppShell demo import auth routing", () => {
  beforeEach(() => {
    authState.ready = true;
    authState.busy = true;
    authState.user = { uid: "u1", displayName: "Người dùng" };
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("blocks import while logout is pending", async () => {
    authState.busy = false;
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><AppShell><p>Nội dung</p></AppShell></QueryClientProvider>);

    const button = screen.getByRole("button", { name: "Nhập công thức demo & yêu thích" });
    expect(button).toBeEnabled();

    authState.busy = true;
    fireEvent.click(button);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nhập dữ liệu chưa hoàn tất"));
    expect(button).toBeDisabled();
    expect(fetchRecipes).not.toHaveBeenCalled();
    expect(importDemo).not.toHaveBeenCalled();
  });
});
