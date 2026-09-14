"use client";

import { cn } from "@/lib/utils/cn";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "./RecipeCard";
import { useRecipes } from "../hooks/useRecipes";
import { useRecipePreferences } from "@/stores/recipePreferencesStore";

interface RecipeListProps {
  onOpen: (id: string) => void; // mở modal chi tiết
  onCreate: () => void; // mở modal thêm mới
}

/**
 * Danh sách recipe = nơi thể hiện rõ nhất vòng đời một React Query:
 * đọc filter từ Zustand -> useRecipes(filters) -> render theo trạng thái
 * loading / error / empty / success.
 */
export function RecipeList({ onOpen, onCreate }: RecipeListProps) {
  const search = useRecipePreferences((s) => s.search);
  const cuisine = useRecipePreferences((s) => s.cuisine);
  const viewMode = useRecipePreferences((s) => s.viewMode);
  const favoritesOnly = useRecipePreferences((s) => s.favoritesOnly);
  const favoriteIds = useRecipePreferences((s) => s.favoriteIds);
  const setFavoritesOnly = useRecipePreferences((s) => s.setFavoritesOnly);

  // Truyền filter làm tham số -> cũng chính là phần động của query key.
  const {
    data: recipes,
    isPending, // true ở lần tải đầu (chưa có data trong cache)
    isError,
    error,
    isFetching, // true mỗi khi đang gọi API (kể cả refetch nền)
    refetch,
  } = useRecipes({ search, cuisine });

  // 1) LOADING: lần đầu chưa có gì trong cache.
  if (isPending) return <LoadingState label="Đang tải công thức..." />;

  // 2) ERROR: query lỗi -> cho phép thử lại bằng refetch().
  if (isError) {
    return (
      <ErrorState
        message={(error as Error).message}
        onRetry={() => refetch()}
      />
    );
  }

  // Lọc client-side sau khi query server đã áp dụng search/cuisine.
  // Chỉ giữ lại object từ React Query, không đưa bản sao recipe vào Zustand.
  const visibleRecipes = favoritesOnly
    ? recipes.filter((recipe) => favoriteIds.includes(recipe.id))
    : recipes;

  // Query thành công nhưng không có favorite nào khớp với chế độ hiện tại.
  // Nhánh này đứng trước empty state server để cả trường hợp search/cuisine
  // trả về mảng rỗng vẫn giải thích đúng lý do khi đang bật favoritesOnly.
  if (favoritesOnly && visibleRecipes.length === 0) {
    const hasNoFavorites = favoriteIds.length === 0;

    return (
      <div>
        {isFetching && (
          <p className="mb-2 text-xs text-orange-600">Đang cập nhật...</p>
        )}
        <EmptyState
          title={
            hasNoFavorites
              ? "Chưa có công thức yêu thích"
              : "Không có công thức yêu thích phù hợp"
          }
          description={
            hasNoFavorites
              ? "Hãy bấm biểu tượng tim trên công thức để thêm vào danh sách yêu thích."
              : "Không có công thức yêu thích nào khớp tìm kiếm hoặc ẩm thực hiện tại."
          }
          action={
            <Button
              variant="secondary"
              onClick={() => setFavoritesOnly(false)}
            >
              Tắt chế độ chỉ xem yêu thích
            </Button>
          }
        />
      </div>
    );
  }

  // 3) EMPTY: thành công nhưng danh sách server rỗng.
  if (recipes.length === 0) {
    return (
      <EmptyState
        title="Không có công thức nào"
        description="Thử đổi bộ lọc, hoặc thêm một công thức mới để bắt đầu."
        action={<Button onClick={onCreate}>+ Thêm công thức</Button>}
      />
    );
  }

  // 4) SUCCESS: render grid/list. `isFetching` báo cho user biết đang cập nhật nền.
  return (
    <div>
      {isFetching && (
        <p className="mb-2 text-xs text-orange-600">Đang cập nhật...</p>
      )}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-3",
        )}
      >
        {visibleRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            viewMode={viewMode}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}
