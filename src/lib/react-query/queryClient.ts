import { QueryClient } from "@tanstack/react-query";

/**
 * Tạo một QueryClient với cấu hình mặc định dùng chung cho toàn app.
 *
 * Tách ra hàm factory (thay vì tạo 1 instance global) vì:
 * - Trên server (SSR) mỗi request nên có client riêng để không rò rỉ dữ liệu giữa các user.
 * - Trên client (browser) ta chỉ tạo 1 lần và tái sử dụng (xem providers.tsx).
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime: khoảng thời gian data được coi là "còn tươi".
        // Trong khoảng này React Query KHÔNG refetch, dùng thẳng cache -> UI mượt.
        staleTime: 60 * 1000, // 60s

        // gcTime (garbage collection): cache bị xoá sau khi không còn observer trong 5 phút.
        gcTime: 5 * 60 * 1000,

        // Tự retry 1 lần khi query lỗi (mặc định là 3).
        retry: 1,

        // Không refetch lại chỉ vì user click qua lại tab (đỡ gọi API thừa khi học).
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
