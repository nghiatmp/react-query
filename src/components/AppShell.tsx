"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, BookOpen, CalendarDays, ShoppingBasket, LogOut, Cloud, HardDrive } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils/cn";
import { emulatorMode } from "@/lib/firebase/client";
import { useFavorites } from "@/features/auth/useFavorites";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecipes } from "@/features/recipes/api/recipeApi";
import { importDemo } from "@/lib/firebase/repository";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import type { ReactNode } from "react";
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const auth = useAuth(); const favorites = useFavorites(); const client = useQueryClient();
  const importer = useMutation({ mutationFn: async () => {
    const user = auth.user;
    if (!auth.ready || auth.busy || !user) throw new Error("Đang xác định tài khoản. Hãy thử lại.");
    await importDemo(user.uid, await fetchRecipes({ search: "", cuisine: "all" }), useRecipePreferences.getState().favoriteIds);
  }, onSuccess: () => client.invalidateQueries({ queryKey: ["personal", auth.user?.uid] }) });
  const links = [{ href: "/", label: "Công thức", icon: BookOpen }, { href: "/meal-plan", label: "Thực đơn", icon: CalendarDays }, { href: "/shopping", label: "Đi chợ", icon: ShoppingBasket }];
  return <>
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-4">Đến nội dung chính</a>
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Leaf aria-hidden="true" size={23}/></span><span><span className="display-heading text-2xl">Bếp nhà<span className="text-primary">.</span></span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Mỗi ngày, một bữa ngon</span></span></Link>
        <nav aria-label="Điều hướng chính" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 text-sm sm:flex-none sm:px-4", pathname === href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Icon size={17} aria-hidden="true"/>{label}</Link>)}</nav>
        <div className="flex items-center gap-2">{auth.user ? <><span className="hidden max-w-32 truncate text-sm sm:block">{auth.user.displayName || "Tài khoản"}</span><span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary sm:hidden" aria-label={auth.user.displayName || "Tài khoản"}>{(auth.user.displayName || "T").slice(0, 1)}</span><Button variant="ghost" disabled={auth.busy} onClick={() => void auth.logout()} aria-label="Đăng xuất"><LogOut size={18}/></Button></> : <Button variant="secondary" disabled={!auth.ready || auth.busy || !auth.configured} onClick={() => void auth.login()}>{auth.busy ? "Đang đăng nhập…" : "Đăng nhập Google"}</Button>}</div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        {auth.user ? <><Cloud aria-hidden="true" size={15}/><span>{emulatorMode ? "Tài khoản thử nghiệm · lưu trên Firebase Emulator" : "Không gian riêng · lưu trên Firebase"}</span><Button variant="ghost" size="sm" disabled={!auth.ready || auth.busy || importer.isPending} onClick={() => { if (window.confirm("Nhập công thức demo và yêu thích cục bộ vào tài khoản? Công thức đã có sẽ được giữ nguyên; dữ liệu demo vẫn được giữ trên thiết bị.")) importer.mutate(); }}>{importer.isPending ? "Đang nhập…" : "Nhập công thức demo & yêu thích"}</Button></> : <><HardDrive aria-hidden="true" size={15}/><span>Bản demo · thực đơn, đi chợ và yêu thích chỉ lưu trên trình duyệt{!auth.configured && " · chưa cấu hình đăng nhập"}</span></>}
      </div>
      {importer.isSuccess && <p role="status" className="mt-2 text-sm text-primary">Đã nhập công thức và yêu thích. Dữ liệu cũ được giữ nguyên.</p>}
      {(auth.error || importer.error || favorites.error) && <div role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-card p-3 text-sm text-destructive">{auth.error || (importer.error ? "Nhập dữ liệu chưa hoàn tất. Hãy thử lại, các mục đã nhập sẽ được giữ." : "Không tải/lưu được yêu thích.")} {favorites.error && <Button variant="secondary" onClick={() => void favorites.retry()}>Thử tải lại</Button>}</div>}
    </div>
    <main key={auth.user?.uid ?? "demo"} id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    <footer className="mx-auto mt-8 flex max-w-7xl flex-wrap justify-between gap-3 border-t px-4 py-6 text-xs text-muted-foreground sm:px-8"><span>Bếp nhà — lên kế hoạch nhỏ, tận hưởng bữa ngon.</span><Link href="/ssr-demo" className="underline underline-offset-4">SSR demo</Link></footer>
  </>;
}
