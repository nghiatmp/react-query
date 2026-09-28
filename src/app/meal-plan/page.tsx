import { MealPlanner } from "@/features/planner/MealPlanner";
import { dateSchema, monday } from "@/features/planner/model";
export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  return <MealPlanner initialWeek={dateSchema.safeParse(week).success ? week! : monday()}/>;
}
