"use client";

import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/lib/react-query/queryClient";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import type { ReactNode } from "react";

/**
 * Provider gói toàn app trong QueryClientProvider.
 *
 * Vì sao dùng useState(() => makeQueryClient())?
 *  - useState với hàm khởi tạo chỉ chạy MỘT LẦN cho vòng đời component.
 *  - Tránh tạo QueryClient mới sau mỗi lần re-render (sẽ mất sạch cache).
 *  - Mỗi tab trình duyệt có đúng 1 client -> cache dùng chung toàn app.
 *
 * "use client" là bắt buộc: QueryClientProvider dùng React Context (client-only).
 *
 * Đây cũng là chỗ rehydrate store Zustand: store dùng `skipHydration` nên phải
 * tự đọc localStorage sau khi đã ở client (xem recipePreferencesStore.ts).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  // Effect của component cha chạy SAU effect của các component con, nên tới lúc
  // này mọi component đã mount xong -> đổi state không gây hydration mismatch.
  // Gọi ở đây (không phải trong từng component) để chỉ rehydrate MỘT lần.
  useEffect(() => {
    void useRecipePreferences.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools: mở panel để quan sát cache, query key, trạng thái... rất hữu ích khi học */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
