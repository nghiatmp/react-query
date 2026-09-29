import { ShoppingList } from "@/features/planner/ShoppingList";
import { dateSchema } from "@/features/planner/model";
export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const parsedWeek = dateSchema.safeParse(week);
  return <ShoppingList initialWeek={parsedWeek.success ? parsedWeek.data : undefined}/>;
}
