// Trạng thái LOADING dùng lại được cho mọi query đang tải.
export function LoadingState({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <div aria-hidden="true" className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
