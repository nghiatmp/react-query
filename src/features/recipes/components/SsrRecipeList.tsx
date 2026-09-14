"use client";

import { useState } from "react";
import { useRecipes } from "../hooks/useRecipes";
import { CUISINE_LABELS } from "../schemas/recipeSchema";
import type { RecipeFilters } from "../types/recipe";

// Dùng ĐÚNG bộ filter mà server đã prefetch -> query key phải khớp thì mới
// "nhận" được dữ liệu đã dehydrate. Sai key = coi như chưa có gì, phải fetch lại.
const filters: RecipeFilters = { search: "", cuisine: "all" };

export function SsrRecipeList() {
  const { data, isPending, isFetching } = useRecipes(filters);

  // Chụp lại trạng thái ở LẦN RENDER ĐẦU TIÊN trên client để chứng minh:
  // vì data đã được server nhét sẵn vào cache nên isPending = false ngay,
  // KHÔNG có màn hình loading nào cả.
  const [firstRender] = useState(() => ({ isPending, isFetching }));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold">✅ Dữ liệu đã được prefetch trên SERVER</p>
        <p className="mt-1">
          Trạng thái ngay khi trang vừa hiện trên client:{" "}
          <code className="rounded bg-white px-1 py-0.5">
            isPending = {String(firstRender.isPending)}
          </code>{" "}
          <code className="rounded bg-white px-1 py-0.5">
            isFetching = {String(firstRender.isFetching)}
          </code>
          . Vì đã có sẵn cache nên KHÔNG hiện spinner.
        </p>
        <p className="mt-1">
          👉 Bấm <b>Ctrl/Cmd + U</b> (View Source) để thấy tên các món{" "}
          <b>đã nằm sẵn trong HTML</b> do server render — bằng chứng dữ liệu
          được tạo ở server chứ không phải fetch sau ở browser.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((recipe) => (
          <div
            key={recipe.id}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                {CUISINE_LABELS[recipe.cuisine]}
              </span>
              <span className="text-xs text-slate-400">
                ⏱ {recipe.cookTimeMinutes} phút
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {recipe.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {recipe.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
