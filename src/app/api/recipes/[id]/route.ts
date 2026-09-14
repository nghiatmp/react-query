import { NextRequest, NextResponse } from "next/server";
import { getRecipe, updateRecipe, deleteRecipe } from "../_store";
import { recipeFormSchema } from "@/features/recipes/schemas/recipeSchema";

/**
 * Route handler cho một recipe cụ thể: /api/recipes/[id]
 * - GET    : chi tiết
 * - PUT    : cập nhật
 * - DELETE : xoá
 *
 * Lưu ý Next.js 15+: `params` là Promise, phải await.
 */

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    return NextResponse.json(
      { message: "Không tìm thấy công thức" },
      { status: 404 },
    );
  }
  return NextResponse.json(recipe);
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const body = await request.json();

  const parsed = recipeFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dữ liệu không hợp lệ", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await updateRecipe(id, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { message: "Không tìm thấy công thức để cập nhật" },
      { status: 404 },
    );
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const ok = await deleteRecipe(id);

  if (!ok) {
    return NextResponse.json(
      { message: "Không tìm thấy công thức để xoá" },
      { status: 404 },
    );
  }
  // 200 kèm id để client biết chính xác cái gì vừa bị xoá.
  return NextResponse.json({ id });
}
