import type { ReactNode } from "react";

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
      <div className="text-4xl">🍽️</div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
