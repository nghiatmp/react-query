// Trạng thái LOADING dùng lại được cho mọi query đang tải.
export function LoadingState({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
