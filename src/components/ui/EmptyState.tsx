import type { ReactNode } from "react";
import { Utensils } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode; // ví dụ: nút "Thêm công thức"
}

// Trạng thái RỖNG: query thành công nhưng không có dữ liệu.
export function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Không tìm thấy mục nào phù hợp.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-accent text-primary"><Utensils size={26} aria-hidden="true"/></div>
      <h3 className="display-heading text-2xl">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
