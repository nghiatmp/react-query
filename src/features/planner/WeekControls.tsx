"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addDays, monday, parseDate } from "./model";
export function weekLabel(week: string) {
  const start = parseDate(week).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
  const end = parseDate(addDays(week, 6)).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
  return `${start} — ${end}`;
}
export function WeekControls({ week, onChange, disabled = false }: { week: string; onChange: (week: string) => void; disabled?: boolean }) {
  return <div className="flex flex-wrap items-center gap-2">
    <div className="flex items-center gap-2 rounded-xl border bg-card p-1"><Button variant="ghost" disabled={disabled} onClick={() => onChange(addDays(week, -7))} aria-label="Tuần trước"><ChevronLeft size={18}/></Button><span className="px-1 text-sm font-medium">{weekLabel(week)}</span><Button variant="ghost" disabled={disabled} onClick={() => onChange(addDays(week, 7))} aria-label="Tuần sau"><ChevronRight size={18}/></Button></div>
    <Button variant="ghost" disabled={disabled} onClick={() => onChange(monday())}>Tuần này</Button>
  </div>;
}
