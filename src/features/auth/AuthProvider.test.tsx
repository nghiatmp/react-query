import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onAuthStateChanged } from "firebase/auth";
import { AuthProvider, useAuth } from "./AuthProvider";

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/firebase/client", () => ({
  firebaseConfigured: true,
  emulatorMode: false,
  getFirebase: () => ({ auth: {} }),
}));

function AuthProbe() {
  const auth = useAuth();
  return <output>{auth.ready ? "resolved" : "blocked"}|{auth.user ? "personal" : "no-user"}|{auth.error ?? "no-error"}</output>;
}

describe("AuthProvider initialization", () => {
  let rejectInitialization: (() => void) | undefined;

  beforeEach(() => {
    rejectInitialization = undefined;
    vi.clearAllMocks();
    vi.mocked(onAuthStateChanged).mockImplementation((...args) => {
      rejectInitialization = () => args[2]?.(new Error("auth failed"));
      return vi.fn();
    });
  });

  it("keeps identity unresolved when the auth observer fails", () => {
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><AuthProvider><AuthProbe/></AuthProvider></QueryClientProvider>);

    expect(screen.getByText("blocked|no-user|no-error")).toBeTruthy();
    act(() => rejectInitialization?.());
    expect(screen.getByText("blocked|no-user|Không đọc được phiên đăng nhập. Tải lại trang để thử lại.")).toBeTruthy();
  });
});
