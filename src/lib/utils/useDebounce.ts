import { useEffect, useState } from "react";

/**
 * useDebounce: trả về một giá trị "trễ" so với `value`.
 *
 * Mỗi khi `value` đổi, ta hẹn giờ `delay` ms rồi mới cập nhật giá trị trả về.
 * Nếu trong lúc chờ mà `value` lại đổi (người dùng gõ tiếp) -> huỷ hẹn giờ cũ,
 * đặt hẹn giờ mới. => Chỉ khi ngừng thay đổi đủ `delay` ms, giá trị mới "chốt".
 *
 * Dùng để tránh chạy tác vụ tốn kém (gọi API, lọc danh sách lớn) mỗi phím gõ.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // cleanup: huỷ hẹn giờ trước khi đặt cái mới (hoặc khi unmount)
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
