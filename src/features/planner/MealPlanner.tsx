"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, X, Copy, ShoppingBasket, Heart, Sun, Sunrise, Moon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useRecipes } from "@/features/recipes/hooks/useRecipes";
import { useFavorites } from "@/features/auth/useFavorites";
import { useAuth } from "@/features/auth/AuthProvider";
import { RecipePhoto } from "@/features/recipes/components/RecipePhoto";
import { cn } from "@/lib/utils/cn";
import { MEALS, MEAL_LABELS, DAYS, addDays, parseDate, type Meal } from "./model";
import { useWeek, useChangeWeek } from "./hooks";
import { WeekControls } from "./WeekControls";
import { useBrowserWeek } from "./useBrowserWeek";
const icons = { breakfast: Sunrise, lunch: Sun, dinner: Moon };
export function MealPlanner({ initialWeek }: { initialWeek?: string }) {
  const browser = useBrowserWeek(initialWeek);
  return <AppShell>{browser.week ? <PlannerContent initialWeek={browser.week} today={browser.today}/> : <LoadingState label="Đang xác định tuần hiện tại…"/>}</AppShell>;
}
function PlannerContent({ initialWeek, today }: { initialWeek: string; today: string | null }) {
  const [week, setWeek] = useState(initialWeek); const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null); const [search, setSearch] = useState(""); const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false); const [notice, setNotice] = useState("");
  const query = useWeek(week); const previous = useWeek(addDays(week, -7)); const change = useChangeWeek(week);
  const recipes = useRecipes({ search: "", cuisine: "all" }); const favorites = useFavorites();
  const auth = useAuth(); const writeBlocked = !auth.ready || auth.busy;
  const selectedCount = Object.keys(query.data?.slots ?? {}).length;
  const visible = (recipes.data ?? []).filter(r => (!onlyFavorites || favorites.ids.includes(r.id)) && `${r.name} ${r.description}`.toLowerCase().includes(search.toLowerCase()));
  const loading = query.isPending || recipes.isPending;
  function copy() {
    if (!previous.data || !Object.keys(previous.data.slots).length) { setNotice("Tuần trước chưa có món nào để sao chép."); setCopyOpen(false); return; }
    change.mutate(current => ({ ...current, slots: { ...previous.data.slots } }), { onSuccess: () => { setNotice("Đã sao chép thực đơn tuần trước."); setCopyOpen(false); } });
  }
  return <>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bữa ngon bắt đầu từ một kế hoạch</p><h1 className="text-4xl sm:text-5xl">Tuần này, mình ăn gì?</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Chọn món bạn thích. Dành nhiều thời gian hơn cho bữa cơm nhà.</p></div><Link href={`/shopping?week=${week}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm text-primary-foreground"><ShoppingBasket size={18} aria-hidden="true"/>Danh sách đi chợ</Link></div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><WeekControls week={week} disabled={change.isPending} onChange={next => { setWeek(next); setSlot(null); setCopyOpen(false); setNotice(""); change.reset(); }}/><Button variant="secondary" disabled={writeBlocked || change.isPending || previous.isPending || previous.isError || loading || query.isError} onClick={() => selectedCount ? setCopyOpen(true) : copy()}><Copy size={16} aria-hidden="true"/>Sao chép tuần trước</Button></div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent px-5 py-4 text-sm"><span><strong>{selectedCount}/21 bữa</strong> đã lên kế hoạch <span className="mx-2 text-primary/50">·</span> Bắt đầu với một món yêu thích</span><span className="text-muted-foreground">Sáng · Trưa · Tối</span></div>
    {notice && <p role="status" className="mb-4 text-sm text-primary">{notice}</p>}
    {change.error && <p role="alert" className="mb-4 text-sm text-destructive">Chưa lưu được thực đơn. Giữ nguyên lựa chọn và thử lại thao tác.</p>}
    {previous.isError && <div className="mb-4"><ErrorState message="Không tải được tuần trước để sao chép" onRetry={() => void previous.refetch()}/></div>}
    {loading ? <LoadingState label="Đang tải thực đơn…"/> : query.isError || recipes.isError ? <ErrorState message="Không tải được thực đơn hoặc công thức" onRetry={() => { void query.refetch(); void recipes.refetch(); }}/> : <>
      <div className="mb-5 grid grid-cols-7 gap-1 lg:hidden" aria-label="Chọn ngày">{DAYS.map((name, index) => <button key={name} type="button" aria-label={name} aria-pressed={day === index} onClick={() => setDay(index)} className={cn("rounded-xl py-2 text-center text-xs", day === index ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}><span className="block">{index === 6 ? "CN" : `T${index+2}`}</span><span className="mt-1 block text-base font-semibold">{parseDate(addDays(week,index)).getDate()}</span></button>)}</div>
      <div className="grid gap-3 lg:grid-cols-7">{DAYS.map((name, index) => <section key={name} className={cn("min-w-0", day !== index && "hidden lg:block")} aria-label={name}>
        <div className={cn("mb-3 rounded-xl border px-3 py-3", addDays(week,index) === today ? "border-primary bg-accent" : "bg-card")}><h2 className="text-sm font-semibold">{name}</h2><p className="mt-1 text-xs text-muted-foreground">{parseDate(addDays(week,index)).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })}{addDays(week,index) === today && " · Hôm nay"}</p></div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{MEALS.map((meal: Meal) => {
          const key = `${index}-${meal}`; const recipeId = query.data?.slots[key]; const recipe = recipes.data?.find(r => r.id === recipeId); const Icon = icons[meal];
          return <div key={meal} className="flex min-h-48 flex-col rounded-2xl border bg-card p-3 lg:h-72"><p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon size={14} aria-hidden="true"/>{MEAL_LABELS[meal]}</p>
            {recipe ? <><RecipePhoto recipe={recipe} className="mb-3 h-24 rounded-xl"/><h3 title={recipe.name} className="line-clamp-2 break-words text-sm font-semibold leading-5">{recipe.name}</h3><p className="mt-1 text-xs text-muted-foreground">{recipe.cookTimeMinutes} phút</p><div className="mt-auto flex items-center justify-between gap-1 pt-2"><Button size="sm" variant="ghost" disabled={writeBlocked || change.isPending} onClick={() => { setSlot(key); setSearch(""); }} aria-label={`Thay món ${name} ${MEAL_LABELS[meal]}`}>Thay món</Button><Button size="sm" variant="ghost" disabled={writeBlocked || change.isPending} aria-label={`Gỡ món ${name} ${MEAL_LABELS[meal]}`} onClick={() => change.mutate(current => { const slots = { ...current.slots }; delete slots[key]; return { ...current, slots }; })}><X size={15}/></Button></div></> : <>
              {recipeId && <p className="mb-2 text-xs text-destructive">Công thức đã bị xóa. Chọn món khác hoặc gỡ bữa này.</p>}
              <button type="button" disabled={writeBlocked || change.isPending} onClick={() => { setSlot(key); setSearch(""); }} aria-label={`Chọn món ${name} ${MEAL_LABELS[meal]}`} className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-input px-2 py-5 text-sm text-muted-foreground hover:border-primary hover:bg-muted"><span className="flex size-9 items-center justify-center rounded-full bg-muted"><Plus size={18}/></span>Chọn món</button>
              {recipeId && <Button variant="ghost" disabled={writeBlocked || change.isPending} onClick={() => change.mutate(current => { const slots = { ...current.slots }; delete slots[key]; return { ...current, slots }; })}>Gỡ bữa</Button>}
            </>}
          </div>;
        })}</div>
      </section>)}</div>
      {recipes.data?.length === 0 && <p className="mt-5 text-sm text-muted-foreground">Chưa có công thức. <Link href="/" className="underline">Thêm công thức</Link> hoặc nhập demo từ thanh tài khoản để bắt đầu.</p>}
    </>}
    <Modal open={slot !== null} title="Chọn một món ngon" onClose={() => { if (!change.isPending) setSlot(null); }}>
      <p className="text-sm text-muted-foreground">{slot && `${DAYS[Number(slot.split("-")[0])]} · ${MEAL_LABELS[slot.split("-")[1] as Meal]}`}</p>
      <Input id="picker-search" label="Tìm công thức" placeholder="Tên món bạn muốn nấu…" value={search} onChange={e => setSearch(e.target.value)}/>
      <div className="flex gap-2"><Button variant={!onlyFavorites ? "primary" : "secondary"} aria-pressed={!onlyFavorites} onClick={() => setOnlyFavorites(false)}>Tất cả món</Button><Button variant={onlyFavorites ? "primary" : "secondary"} aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(true)}><Heart size={15} aria-hidden="true"/>Yêu thích</Button></div>
      {favorites.error && <ErrorState message="Không tải được yêu thích" onRetry={() => void favorites.retry()}/>}
      {onlyFavorites && favorites.pending ? <LoadingState/> : !visible.length ? <p className="py-8 text-center text-sm text-muted-foreground">{onlyFavorites ? "Chưa có món yêu thích phù hợp. Thử xem tất cả món." : "Không có công thức phù hợp."}</p> : <div className="space-y-2">{visible.map(recipe => <button key={recipe.id} type="button" disabled={writeBlocked || change.isPending} className="flex w-full items-center gap-4 rounded-xl border p-3 text-left hover:bg-muted disabled:opacity-50" onClick={() => { if (slot) change.mutate(current => ({ ...current, slots: { ...current.slots, [slot]: recipe.id } }), { onSuccess: () => { setSlot(null); setNotice("Đã lưu món vào thực đơn."); } }); }}><RecipePhoto recipe={recipe} className="h-16 w-20 shrink-0 rounded-lg"/><span><span className="block font-medium">{recipe.name}</span><span className="mt-1 block text-xs text-muted-foreground">{recipe.cookTimeMinutes} phút · {recipe.ingredients.length} nguyên liệu</span></span><Plus className="ml-auto shrink-0" size={18}/></button>)}</div>}
      {change.isPending && <p role="status" className="text-sm">Đang lưu…</p>}{change.error && <p role="alert" className="text-sm text-destructive">Chưa lưu được. Chọn lại món để thử lại.</p>}
    </Modal>
    <Modal open={copyOpen} title="Thay thực đơn tuần này?" onClose={() => { if (!change.isPending) setCopyOpen(false); }}><p className="text-sm leading-6 text-muted-foreground">Các bữa hiện tại sẽ được thay bằng tuần trước. Danh sách đi chợ đã tạo được giữ nguyên.</p><div className="flex justify-end gap-2"><Button variant="secondary" disabled={change.isPending} onClick={() => setCopyOpen(false)}>Hủy</Button><Button disabled={writeBlocked || change.isPending} onClick={copy}>{change.isPending ? "Đang lưu…" : "Sao chép và thay thế"}</Button></div>{change.error && <p role="alert" className="text-destructive">Chưa sao chép được. Hãy thử lại.</p>}</Modal>
  </>;
}
