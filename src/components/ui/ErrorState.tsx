import { Button } from "./Button";
import { CircleAlert } from "lucide-react";

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
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert aria-hidden="true"/>
      </div>
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
