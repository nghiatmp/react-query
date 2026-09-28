import { ShoppingList } from "@/features/planner/ShoppingList";
import { dateSchema, monday } from "@/features/planner/model";
export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  return <ShoppingList initialWeek={dateSchema.safeParse(week).success ? week! : monday()}/>;
}
