import { twMerge, type ClassNameValue } from "tailwind-merge";

/**
 * Gộp className và LOẠI BỎ class Tailwind bị xung đột.
 *
 * Vì sao cần twMerge chứ không chỉ join(" "):
 * thứ tự class trong `className` KHÔNG quyết định class nào thắng — thứ tự
 * trong file CSS mới quyết định. Nên `cn("px-4", "px-8")` nếu chỉ nối chuỗi
 * sẽ ra "px-4 px-8" và trình duyệt vẫn có thể áp px-4.
 * twMerge xoá hẳn class cũ: "px-8".
 *
 * Nhờ vậy component nhận prop `className` mới override được style mặc định
 * (xem Button.tsx: className của caller được truyền vào cuối).
 */
export function cn(...classes: ClassNameValue[]): string {
  return twMerge(classes);
}
