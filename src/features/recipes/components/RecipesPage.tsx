"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { RecipeFilters } from "./RecipeFilters";
import { RecipeList } from "./RecipeList";
import { RecipeDetail } from "./RecipeDetail";
import { RecipeForm } from "./RecipeForm";
import { useRecipe } from "../hooks/useRecipe";
import { useCreateRecipe } from "../hooks/useCreateRecipe";
import { useUpdateRecipe } from "../hooks/useUpdateRecipe";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";
import type { RecipeFormValues } from "../types/recipe";

/**
 * Container điều phối toàn màn hình:
 *  - Header (đếm số món yêu thích từ Zustand)
 *  - Bộ lọc + danh sách
 *  - 3 modal: chi tiết / thêm mới / chỉnh sửa
 *
 * State đóng/mở modal là state cục bộ của component (useState) - đây KHÔNG phải
 * global state nên không cần đưa vào Zustand.
 */
export function RecipesPage() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; id: string } | null
  >(null);

  const favoriteCount = useRecipePreferences((s) => s.favoriteIds.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-2xl shadow-lg shadow-orange-200">
            🍳
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recipe Planner
            </h1>
            <p className="text-sm text-slate-500">
              Học React Query, Zustand & Zod qua ví dụ thực tế.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {favoriteCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-rose-100">
              ♥ {favoriteCount} yêu thích
            </span>
          )}
          <Link
            href="/ssr-demo"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            SSR demo →
          </Link>
          <Button onClick={() => setFormState({ mode: "create" })}>
            + Thêm công thức
          </Button>
        </div>
      </header>

      <div className="mb-8 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur">
        <RecipeFilters />
      </div>

      <RecipeList
        onOpen={(id) => setDetailId(id)}
        onCreate={() => setFormState({ mode: "create" })}
      />

      {/* MODAL: chi tiết */}
      <Modal
        open={detailId !== null}
        title="Chi tiết công thức"
        onClose={() => setDetailId(null)}
      >
        {detailId && (
          <RecipeDetail
            recipeId={detailId}
            onEdit={() => {
              // chuyển từ xem -> sửa cùng recipe
              setFormState({ mode: "edit", id: detailId });
              setDetailId(null);
            }}
            onDeleted={() => setDetailId(null)}
          />
        )}
      </Modal>

      {/* MODAL: thêm mới */}
      <Modal
        open={formState?.mode === "create"}
        title="Thêm công thức mới"
        onClose={() => setFormState(null)}
      >
        <CreateRecipeForm onDone={() => setFormState(null)} />
      </Modal>

      {/* MODAL: chỉnh sửa */}
      <Modal
        open={formState?.mode === "edit"}
        title="Chỉnh sửa công thức"
        onClose={() => setFormState(null)}
      >
        {formState?.mode === "edit" && (
          <EditRecipeForm id={formState.id} onDone={() => setFormState(null)} />
        )}
      </Modal>
    </div>
  );
}

/**
 * Form THÊM: bọc RecipeForm với useCreateRecipe.
 * Truyền serverError = mutation.error để form hiển thị lỗi từ server.
 */
function CreateRecipeForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateRecipe();

  return (
    <RecipeForm
      submitLabel="Tạo công thức"
      isSubmitting={createMutation.isPending}
      serverError={
        createMutation.isError ? (createMutation.error as Error).message : null
      }
      onCancel={onDone}
      onSubmit={(values: RecipeFormValues) =>
        createMutation.mutate(values, { onSuccess: onDone })
      }
    />
  );
}

/**
 * Form SỬA: đọc recipe hiện tại từ cache (useRecipe) để đổ vào defaultValues,
 * rồi dùng useUpdateRecipe để lưu.
 */
function EditRecipeForm({ id, onDone }: { id: string; onDone: () => void }) {
  const { data: recipe, isPending } = useRecipe(id);
  const updateMutation = useUpdateRecipe();

  if (isPending || !recipe) return <LoadingState />;

  return (
    <RecipeForm
      submitLabel="Lưu thay đổi"
      isSubmitting={updateMutation.isPending}
      serverError={
        updateMutation.isError ? (updateMutation.error as Error).message : null
      }
      // Đổ dữ liệu hiện có vào form để user chỉnh sửa.
      defaultValues={{
        name: recipe.name,
        description: recipe.description,
        cuisine: recipe.cuisine,
        cookTimeMinutes: recipe.cookTimeMinutes,
        ingredients: recipe.ingredients,
      }}
      onCancel={onDone}
      onSubmit={(values: RecipeFormValues) =>
        updateMutation.mutate({ id, values }, { onSuccess: onDone })
      }
    />
  );
}
