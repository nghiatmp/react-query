import { RecipesPage } from "@/features/recipes/components/RecipesPage";

/**
 * page.tsx là SERVER component (không "use client").
 * Nó chỉ render RecipesPage - component client chứa toàn bộ logic tương tác.
 *
 * Nguyên tắc: giữ "use client" ở CÀNG SÂU càng tốt, chỉ đánh dấu những component
 * thực sự cần state/hook/tương tác của browser.
 */
export default function Home() {
  return <RecipesPage />;
}
