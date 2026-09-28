"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { firebaseConfigured, getFirebase, emulatorMode } from "@/lib/firebase/client";
import { useQueryClient } from "@tanstack/react-query";

type AuthState = { user: User | null; ready: boolean; configured: boolean; busy: boolean; error: string | null; login: () => Promise<void>; logout: () => Promise<void> };
const fallback: AuthState = { user: null, ready: true, configured: false, busy: false, error: null, login: async () => {}, logout: async () => {} };
const AuthContext = createContext<AuthState>(fallback);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseConfigured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useQueryClient();
  useEffect(() => {
    if (!firebaseConfigured) return;
    try {
      return onAuthStateChanged(getFirebase().auth, next => {
        // Drop personal caches on every identity transition, including logout.
        void client.cancelQueries({ predicate: q => q.queryKey[0] === "personal" });
        client.removeQueries({ predicate: q => q.queryKey[0] === "personal" });
        setUser(next); setReady(true);
      }, () => { setError("Không đọc được phiên đăng nhập. Tải lại trang để thử lại."); setReady(true); });
    } catch { queueMicrotask(() => { setError("Cấu hình Firebase không hợp lệ. Kiểm tra cấu hình và tải lại trang."); setReady(true); }); }
  }, [client]);
  async function action(login: boolean) {
    setBusy(true); setError(null);
    try {
      if (login) await signInWithPopup(getFirebase().auth, new GoogleAuthProvider());
      else await signOut(getFirebase().auth);
    } catch { setError(login ? "Đăng nhập chưa thành công. Cho phép popup và thử lại." : "Đăng xuất chưa thành công. Hãy thử lại."); }
    finally { setBusy(false); }
  }
  return <AuthContext.Provider value={{ user, ready, configured: firebaseConfigured, busy, error, login: () => action(true), logout: () => action(false) }}>{children}{emulatorMode && <div className="sr-only">Firebase Emulator</div>}</AuthContext.Provider>;
}
