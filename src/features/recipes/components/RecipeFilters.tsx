"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CUISINES, CUISINE_LABELS } from "../schemas/recipeSchema";
import { useDebounce } from "@/lib/utils/useDebounce";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

/**
 * Thanh filter: search + chọn cuisine + đổi grid/list.
 *
 * Search dùng DEBOUNCE:
 *  - Ô input lưu ở state cục bộ `searchInput` -> gõ hiện ra NGAY, mượt.
 *  - `useDebounce` chờ 300ms ngừng gõ mới "chốt" giá trị.
 *  - Chỉ khi đó mới đẩy vào Zustand (setSearch) -> query key đổi -> gọi API.
 *  => Gõ "carbonara" (9 phím) chỉ tốn 1 request thay vì 9.
 *
 * Vì sao ô input KHÔNG dùng `useState(storeSearch)`?
 *  - Store persist bị hoãn rehydrate (skipHydration) nên lúc mount nó vẫn là
 *    giá trị mặc định -> copy lúc đó sẽ lấy nhầm chuỗi rỗng, và từ khoá đã lưu
 *    trong localStorage bị mất.
 *  - Thay vào đó: DẪN XUẤT giá trị hiển thị -> `draft ?? storeSearch`.
 *    `draft === null` nghĩa là "user chưa gõ gì", cứ hiển thị theo store; sau
 *    khi rehydrate xong store đổi thì ô input tự cập nhật, không cần effect nào.
 */
export function RecipeFilters() {
  // Lấy đúng slice cần dùng từ store (tránh re-render thừa).
  const storeSearch = useRecipePreferences((s) => s.search);
  const cuisine = useRecipePreferences((s) => s.cuisine);
  const viewMode = useRecipePreferences((s) => s.viewMode);
  const setSearch = useRecipePreferences((s) => s.setSearch);
  const setCuisine = useRecipePreferences((s) => s.setCuisine);
  const setViewMode = useRecipePreferences((s) => s.setViewMode);

  // `null` = user CHƯA gõ gì -> ô input hiển thị theo store.
  const [draft, setDraft] = useState<string | null>(null);
  const searchInput = draft ?? storeSearch;

  // Debounce chính `draft` (thứ user gõ), không debounce giá trị hiển thị.
  const debouncedDraft = useDebounce(draft, 300);

  // Khi giá trị debounce "chốt" -> đẩy vào store (đây mới là thứ query dùng).
  //
  // `null` -> return: chỉ ghi vào store khi user THỰC SỰ gõ. Nếu bỏ điều kiện
  // này, effect sẽ đẩy chuỗi rỗng của lần render đầu vào store và middleware
  // `persist` ghi luôn xuống localStorage -> xoá mất từ khoá đã lưu. React
  // StrictMode chạy effect hai lượt khi mount nên lượt sau rơi vào đúng thời
  // điểm store đã rehydrate xong, càng dễ ghi đè.
  useEffect(() => {
    if (debouncedDraft === null) return;
    setSearch(debouncedDraft);
  }, [debouncedDraft, setSearch]);

  const cuisineOptions = [
    { value: "all", label: "Tất cả ẩm thực" },
    ...CUISINES.map((c) => ({ value: c, label: CUISINE_LABELS[c] })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          id="search"
          label="Tìm kiếm"
          placeholder="Tìm theo tên hoặc mô tả..."
          value={searchInput}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>

      <div className="w-full sm:w-48">
        <Select
          id="cuisine"
          label="Ẩm thực"
          options={cuisineOptions}
          value={cuisine}
          onChange={(e) =>
            setCuisine(e.target.value as typeof cuisine)
          }
        />
      </div>

      {/* Toggle grid/list -> chỉ đổi client state, không gọi lại API */}
      <div className="flex gap-1 rounded-lg border border-gray-200 p-1">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "grid" ? "primary" : "ghost"}
          onClick={() => setViewMode("grid")}
        >
          ▦ Lưới
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === "list" ? "primary" : "ghost"}
          onClick={() => setViewMode("list")}
        >
          ≣ Danh sách
        </Button>
      </div>
    </div>
  );
}
