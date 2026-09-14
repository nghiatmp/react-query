"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CUISINES, CUISINE_LABELS, recipeFormSchema } from "../schemas/recipeSchema";
import type { Cuisine, Ingredient, RecipeFormValues } from "../types/recipe";

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormValues>;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (values: RecipeFormValues) => void;
  onCancel: () => void;
}

// Kiểu state nội bộ của form: cookTime để dạng string vì <input> trả string.
interface FormState {
  name: string;
  description: string;
  cuisine: Cuisine;
  cookTimeMinutes: string;
  ingredients: Ingredient[];
}

const emptyIngredient: Ingredient = { name: "", amount: "" };

export function RecipeForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: RecipeFormProps) {
  const [form, setForm] = useState<FormState>({
    name: defaultValues?.name ?? "",
    description: defaultValues?.description ?? "",
    cuisine: defaultValues?.cuisine ?? "italian",
    cookTimeMinutes:
      defaultValues?.cookTimeMinutes != null
        ? String(defaultValues.cookTimeMinutes)
        : "",
    ingredients: defaultValues?.ingredients?.length
      ? defaultValues.ingredients
      : [{ ...emptyIngredient }],
  });

  // errors keyed theo path Zod, ví dụ "name", "ingredients.0.amount".
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateIngredient(
    index: number,
    key: keyof Ingredient,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [key]: value } : ing,
      ),
    }));
  }

  function addIngredient() {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...emptyIngredient }],
    }));
  }

  function removeIngredient(index: number) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // VALIDATE bằng Zod ngay trước khi gọi mutation.
    // recipeFormSchema tự ép cookTimeMinutes (string) -> number nhờ z.coerce.
    const result = recipeFormSchema.safeParse(form);

    if (!result.success) {
      // Gom lỗi theo path để hiển thị đúng ô nhập.
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data); // result.data đã đúng type RecipeFormValues
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="name"
        label="Tên món"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors["name"]}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          id="description"
          rows={3}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {errors["description"] && (
          <span className="text-xs text-red-600">{errors["description"]}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="cuisine"
          label="Ẩm thực"
          options={CUISINES.map((c) => ({ value: c, label: CUISINE_LABELS[c] }))}
          value={form.cuisine}
          onChange={(e) =>
            setForm({ ...form, cuisine: e.target.value as Cuisine })
          }
          error={errors["cuisine"]}
        />
        <Input
          id="cookTimeMinutes"
          label="Thời gian nấu (phút)"
          type="number"
          value={form.cookTimeMinutes}
          onChange={(e) =>
            setForm({ ...form, cookTimeMinutes: e.target.value })
          }
          error={errors["cookTimeMinutes"]}
        />
      </div>

      {/* Danh sách nguyên liệu động (thêm/xoá dòng) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Nguyên liệu</span>
          <Button type="button" size="sm" variant="secondary" onClick={addIngredient}>
            + Thêm nguyên liệu
          </Button>
        </div>

        {form.ingredients.map((ing, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                placeholder="Tên (vd: Trứng gà)"
                value={ing.name}
                onChange={(e) => updateIngredient(index, "name", e.target.value)}
                error={errors[`ingredients.${index}.name`]}
              />
            </div>
            <div className="w-28">
              <Input
                placeholder="Định lượng"
                value={ing.amount}
                onChange={(e) =>
                  updateIngredient(index, "amount", e.target.value)
                }
                error={errors[`ingredients.${index}.amount`]}
              />
            </div>
            {form.ingredients.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-0.5 text-red-500"
                onClick={() => removeIngredient(index)}
                aria-label="Xoá nguyên liệu"
              >
                ✕
              </Button>
            )}
          </div>
        ))}
        {/* Lỗi cấp mảng, vd: "Cần ít nhất 1 nguyên liệu" */}
        {errors["ingredients"] && (
          <span className="text-xs text-red-600">{errors["ingredients"]}</span>
        )}
      </div>

      {/* Lỗi trả về từ server (nếu mutation thất bại) */}
      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
