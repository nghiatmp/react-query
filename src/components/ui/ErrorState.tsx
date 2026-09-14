import { Button } from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void; // thường truyền refetch() của React Query vào đây
}

// Trạng thái LỖI dùng lại được. Nút "Thử lại" gọi refetch().
export function ErrorState({
  message = "Đã có lỗi xảy ra.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
        ⚠️
      </div>
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
