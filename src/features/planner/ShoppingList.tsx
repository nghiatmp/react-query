"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ShoppingBasket, Plus, Pencil, Trash2, Check, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useRecipes } from "@/features/recipes/hooks/useRecipes";
import { cn } from "@/lib/utils/cn";
import { useWeek, useShopping, useShoppingMutation } from "./hooks";
import { shoppingFromWeek, itemSchema, type ShoppingItem } from "./model";
import { WeekControls } from "./WeekControls";
import { useBrowserWeek } from "./useBrowserWeek";
export function ShoppingList({ initialWeek }: { initialWeek?: string }) {
  const browser = useBrowserWeek(initialWeek);
  return <AppShell>{browser.week ? <ShoppingContent initialWeek={browser.week}/> : <LoadingState label="Đang xác định tuần hiện tại…"/>}</AppShell>;
}
function ShoppingContent({ initialWeek }: { initialWeek: string }) {
  const [week, setWeek] = useState(initialWeek); const [editor, setEditor] = useState<ShoppingItem | "new" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null); const [notice, setNotice] = useState("");
  const items = useShopping(week); const plan = useWeek(week); const recipes = useRecipes({ search: "", cuisine: "all" }); const mutation = useShoppingMutation(week);
  const checked = items.data?.filter(i => i.checked).length ?? 0; const total = items.data?.length ?? 0;
  const busy = mutation.isPending; const loading = items.isPending || plan.isPending || recipes.isPending;
  const missingRecipe = Object.values(plan.data?.slots ?? {}).some(id => !recipes.data?.some(r => r.id === id));
  function generate() {
    if (!plan.data || !recipes.data || !items.data) return;
    const generated = shoppingFromWeek(plan.data, recipes.data, items.data);
    if (!generated.length) { setNotice("Không có nguyên liệu mới. Thêm món vào thực đơn hoặc thêm mục thủ công."); return; }
    mutation.mutate({ type: "add", items: generated }, { onSuccess: () => setNotice(`Đã thêm ${generated.length} nguyên liệu từ thực đơn. Các mục cũ được giữ nguyên.`) });
  }
  return <>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Chuẩn bị một chút, thảnh thơi cả tuần</p><h1 className="text-4xl sm:text-5xl">Giỏ đi chợ của bạn</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Từ thực đơn đến căn bếp, từng nguyên liệu đều sẵn sàng.</p></div><Button onClick={() => { mutation.reset(); setEditor("new"); }} disabled={busy || loading || items.isError}><Plus size={17} aria-hidden="true"/>Thêm nguyên liệu</Button></div>
    <div className="mb-6"><WeekControls week={week} disabled={busy} onChange={next => { setWeek(next); setEditor(null); setNotice(""); mutation.reset(); }}/></div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-5"><h2 className="flex items-center gap-2 font-semibold"><ShoppingBasket size={19} aria-hidden="true"/>Nguyên liệu trong tuần</h2><span className="rounded-full bg-accent px-3 py-1 text-xs text-primary">{total} mục</span></div>
        {loading ? <div className="p-8"><LoadingState label="Đang tải danh sách đi chợ…"/></div> : items.isError || plan.isError || recipes.isError ? <div className="p-5"><ErrorState message="Không tải được danh sách hoặc thực đơn" onRetry={() => { void items.refetch(); void plan.refetch(); void recipes.refetch(); }}/></div> : !total ? <div className="flex flex-col items-center px-6 py-16 text-center"><span className="mb-5 flex size-16 items-center justify-center rounded-full bg-muted"><ShoppingBasket size={28} className="text-primary"/></span><h3 className="display-heading text-2xl">Giỏ còn trống, bếp đang chờ</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Thêm nguyên liệu từ thực đơn đã lên, hoặc ghi lại món cần mua theo cách của bạn.</p><Button className="mt-6" disabled={busy || missingRecipe} onClick={generate}>Lấy nguyên liệu từ thực đơn</Button></div> : <ul className="divide-y">{items.data?.map(item => <li key={item.id} className={cn("flex items-start gap-3 px-4 py-4 sm:px-5", item.checked && "bg-muted/40")}>
          <label className="mt-0.5 flex size-11 shrink-0 items-center justify-center"><input type="checkbox" className="size-5 accent-primary" checked={item.checked} disabled={busy} onChange={e => mutation.mutate({ type: "edit", id: item.id, patch: { checked: e.target.checked } })} aria-label={`Đã mua ${item.name}`}/></label>
          <div className="min-w-0 flex-1 py-1"><h3 className={cn("break-words text-sm font-medium", item.checked && "text-muted-foreground line-through")}>{item.name}<span className="ml-2 inline-block text-sm font-normal text-muted-foreground">{item.amount}</span></h3><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{item.source || "Thêm thủ công"}</p></div>
          <div className="flex shrink-0 gap-1"><Button variant="ghost" size="sm" disabled={busy} aria-label={`Sửa ${item.name}`} onClick={() => { mutation.reset(); setEditor(item); }}><Pencil size={16}/></Button><Button variant="ghost" size="sm" disabled={busy} aria-label={`Xóa ${item.name}`} onClick={() => setDeleteId(item.id)}><Trash2 size={16}/></Button></div>
        </li>)}</ul>}
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl bg-primary p-6 text-primary-foreground"><div className="mb-4 flex size-11 items-center justify-center rounded-full border border-white/30"><Check size={22}/></div><h2 className="display-heading text-2xl">Sẵn sàng vào bếp</h2><p className="mt-3 text-sm text-white/85">Đã mua {checked} / {total} nguyên liệu</p><progress aria-label="Tiến độ mua nguyên liệu" value={checked} max={Math.max(total, 1)} className="shopping-progress mt-4 h-2 w-full"/><p className="mt-3 text-xs text-white/85">{total && checked === total ? "Đủ nguyên liệu rồi. Chúc bạn một bữa thật ngon!" : "Đánh dấu từng mục khi cho vào giỏ."}</p></div>
        <div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Từ thực đơn của bạn</h2><p className="my-3 text-sm leading-6 text-muted-foreground">Thêm nguyên liệu còn thiếu. Giữ nguyên mục đã sửa, đã mua và mục của thực đơn cũ.</p><Button className="w-full" disabled={loading || busy || items.isError || plan.isError || recipes.isError || missingRecipe} onClick={generate}>{busy ? "Đang lưu…" : "Thêm từ thực đơn"}<Plus size={16}/></Button>{missingRecipe && <p className="mt-3 text-xs leading-5 text-destructive">Có công thức đã bị xóa. Thay hoặc gỡ món đó trong thực đơn trước khi tạo danh sách.</p>}<Link href={`/meal-plan?week=${week}`} className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm text-primary">Xem thực đơn tuần<ArrowRight size={16}/></Link></div>
        <p className="px-1 text-xs leading-6 text-muted-foreground">Mỗi bữa giữ định lượng riêng từ công thức. Chưa tự cộng hoặc quy đổi đơn vị; bạn có thể chỉnh từng mục theo nhu cầu.</p>
      </aside>
    </div>
    {notice && <p role="status" className="mt-5 text-sm text-primary">{notice}</p>}{mutation.error && <p role="alert" className="mt-5 text-sm text-destructive">Chưa lưu được thay đổi. Thử lại thao tác; nếu thêm nhiều mục, những mục đã lưu vẫn được giữ.</p>}
    <Modal open={editor !== null} title={editor === "new" ? "Thêm nguyên liệu" : "Chỉnh nguyên liệu"} onClose={() => { if (!busy) setEditor(null); }}>
      {editor && <ItemForm key={editor === "new" ? "new" : editor.id} item={editor === "new" ? undefined : editor} busy={busy} error={!!mutation.error} onSave={item => mutation.mutate(editor === "new" ? { type: "add", items: [item] } : { type: "edit", id: item.id, patch: { name: item.name, amount: item.amount } }, { onSuccess: () => setEditor(null) })}/>}
    </Modal>
    <Modal open={deleteId !== null} title="Xóa nguyên liệu này?" onClose={() => { if (!busy) setDeleteId(null); }}><p className="text-sm text-muted-foreground">Bạn có thể thêm lại mục từ thực đơn hoặc ghi thủ công.</p><div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setDeleteId(null)}>Hủy</Button><Button variant="danger" disabled={busy} onClick={() => { if (deleteId) mutation.mutate({ type: "remove", id: deleteId }, { onSuccess: () => setDeleteId(null) }); }}>{busy ? "Đang xóa…" : "Xóa mục"}</Button></div>{mutation.error && <p role="alert" className="text-destructive">Chưa xóa được. Hãy thử lại.</p>}</Modal>
  </>;
}
function ItemForm({ item, busy, error, onSave }: { item?: ShoppingItem; busy: boolean; error: boolean; onSave: (item: ShoppingItem) => void }) {
  const [name, setName] = useState(item?.name ?? ""); const [amount, setAmount] = useState(item?.amount ?? ""); const [invalid, setInvalid] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault(); const result = itemSchema.safeParse({ id: item?.id ?? crypto.randomUUID(), name, amount, checked: item?.checked ?? false, source: item?.source ?? "" });
    if (!result.success) { setInvalid(result.error.issues[0].message); return; } setInvalid(""); onSave(result.data);
  }
  return <form onSubmit={submit} className="space-y-4"><Input id="item-name" label="Tên nguyên liệu" value={name} maxLength={200} onChange={e => setName(e.target.value)} required/><Input id="item-amount" label="Định lượng" placeholder="Ví dụ: 200g hoặc 2 quả" value={amount} maxLength={100} onChange={e => setAmount(e.target.value)} required/>{invalid && <p role="alert" className="text-sm text-destructive">{invalid}</p>}{error && <p role="alert" className="text-sm text-destructive">Chưa lưu được. Nội dung của bạn được giữ, hãy thử lại.</p>}<Button type="submit" disabled={busy} className="w-full">{busy ? "Đang lưu…" : "Lưu nguyên liệu"}</Button></form>;
}
