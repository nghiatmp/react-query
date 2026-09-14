import Link from "next/link";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query/getQueryClient";
import { recipeKeys } from "@/features/recipes/hooks/recipeKeys";
import { listRecipes } from "../api/recipes/_store";
import { SsrRecipeList } from "@/features/recipes/components/SsrRecipeList";
import type { RecipeFilters } from "@/features/recipes/types/recipe";

/**
 * ĐÂY LÀ SERVER COMPONENT (không có "use client").
 * Toàn bộ hàm này CHẠY TRÊN SERVER mỗi khi có người mở /ssr-demo.
 *
 * Luồng SSR prefetch:
 *   1) Tạo 1 QueryClient RIÊNG cho request này (getQueryClient).
 *   2) prefetchQuery: fetch dữ liệu NGAY TRÊN SERVER, nhét vào cache của client đó.
 *   3) dehydrate: "đóng gói" cache thành JSON, gắn vào HTML gửi về browser.
 *   4) Browser nhận HTML đã có sẵn dữ liệu + "hydrate" JSON đó vào QueryClient
 *      phía client -> useQuery thấy data ngay, không cần fetch lại, không loading.
 */

const filters: RecipeFilters = { search: "", cuisine: "all" };

export default async function SsrDemoPage() {
  // (1) client riêng cho request này — "cái khay mới" cho mỗi khách
  const queryClient = getQueryClient();

  // (2) prefetch: gọi THẲNG data layer trên server (không qua HTTP).
  //     Dùng ĐÚNG queryKey mà client sẽ dùng -> lát nữa client mới "nhận" được.
  await queryClient.prefetchQuery({
    queryKey: recipeKeys.list(filters),
    queryFn: () => listRecipes(filters),
  });

  // (3) dehydrate(queryClient): serialize cache -> nhúng vào HTML.
  //     HydrationBoundary sẽ nạp state này vào QueryClient phía client.
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SSR Prefetch Demo
          </h1>
          <p className="text-sm text-slate-500">
            Dữ liệu được fetch sẵn trên server, gửi về cùng HTML.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          ← Về trang chủ (client-fetch)
        </Link>
      </header>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SsrRecipeList />
      </HydrationBoundary>
    </div>
  );
}
