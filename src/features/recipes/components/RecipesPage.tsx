"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useFavorites } from "@/features/auth/useFavorites";
import { Plus } from "lucide-react";
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

  const favoriteCount = useFavorites().ids.length;

  return (
    <AppShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Một chút cảm hứng cho bữa cơm nhà</p><h1 className="text-4xl sm:text-5xl">Nấu điều mình thích.</h1><p className="mt-3 text-sm text-muted-foreground">Lưu công thức ngon, lên thực đơn và chuẩn bị cho tuần mới.</p></div>
        <div className="flex items-center gap-3">{favoriteCount > 0 && <span className="text-sm text-primary">♥ {favoriteCount} yêu thích</span>}<Button onClick={() => setFormState({ mode: "create" })}><Plus size={17} aria-hidden="true"/>Thêm công thức</Button></div>
      </header>
      <div className="mb-8 rounded-2xl border bg-card p-5"><RecipeFilters/></div>

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
    </AppShell>
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
