import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cloudFavorites, cloudSetFavorite } from "@/lib/firebase/repository";
import { useFavorites } from "./useFavorites";

const authState = vi.hoisted(() => ({
  ready: true,
  busy: false,
  user: { uid: "u1" },
}));
const localToggle = vi.hoisted(() => vi.fn());
const backendFavorites = new Set<string>();

vi.mock("./AuthProvider", () => ({ useAuth: () => authState }));
vi.mock("@/stores/recipePreferencesStore", () => ({
  useRecipePreferences: (selector: (state: { favoriteIds: string[]; toggleFavorite: typeof localToggle }) => unknown) =>
    selector({ favoriteIds: [], toggleFavorite: localToggle }),
}));
vi.mock("@/lib/firebase/repository", () => ({
  cloudFavorites: vi.fn(),
  cloudSetFavorite: vi.fn(),
}));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("cloud favorite intent", () => {
  beforeEach(() => {
    backendFavorites.clear();
    backendFavorites.add("r1");
    vi.clearAllMocks();
    vi.mocked(cloudFavorites).mockResolvedValue([]);
    vi.mocked(cloudSetFavorite).mockImplementation(async (_uid, id, favorite) => {
      if (favorite) backendFavorites.add(id);
      else backendFavorites.delete(id);
    });
  });

  it("keeps an existing remote favorite when stale UI requests favorite", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.pending).toBe(false));

    expect(result.current.ids).toEqual([]);
    await act(async () => result.current.toggle("r1"));

    await waitFor(() => expect(cloudSetFavorite).toHaveBeenCalledWith("u1", "r1", true));
    expect(backendFavorites.has("r1")).toBe(true);
  });
});
