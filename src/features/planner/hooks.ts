"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import * as cloud from "@/lib/firebase/repository";
import * as local from "./localRepository";
import type { Week, ShoppingItem } from "./model";
export const plannerKey = (uid: string | undefined, week: string, part: string) => uid ? ["personal", uid, "planner", week, part] : ["demo-planner", week, part];
export function useWeek(week: string) {
  const { user, ready } = useAuth();
  return useQuery({ queryKey: plannerKey(user?.uid, week, "week"), queryFn: () => user ? cloud.cloudWeek(user.uid, week) : local.localWeek(week), enabled: ready, refetchInterval: user ? 30000 : false, refetchOnWindowFocus: !!user });
}
export function useChangeWeek(week: string) {
  const { user } = useAuth(); const client = useQueryClient();
  return useMutation({
    mutationFn: (change: (current: Week) => Week) => user ? cloud.cloudChangeWeek(user.uid, week, change) : local.localChangeWeek(week, change),
    onSuccess: data => client.setQueryData(plannerKey(user?.uid, week, "week"), data),
  });
}
export function useShopping(week: string) {
  const { user, ready } = useAuth();
  return useQuery({ queryKey: plannerKey(user?.uid, week, "items"), queryFn: () => user ? cloud.cloudItems(user.uid, week) : local.localItems(week), enabled: ready, refetchInterval: user ? 30000 : false, refetchOnWindowFocus: !!user });
}
export type ShoppingAction = { type: "add"; items: ShoppingItem[] } | { type: "edit"; id: string; patch: Partial<ShoppingItem> } | { type: "remove"; id: string };
export function useShoppingMutation(week: string) {
  const { user } = useAuth(); const client = useQueryClient();
  return useMutation({
    mutationFn: async (action: ShoppingAction) => {
      if (action.type === "add") return user ? cloud.cloudAddItems(user.uid, week, action.items) : local.localAddItems(week, action.items);
      if (action.type === "edit") return user ? cloud.cloudEditItem(user.uid, week, action.id, action.patch) : local.localEditItem(week, action.id, action.patch);
      return user ? cloud.cloudRemoveItem(user.uid, week, action.id) : local.localRemoveItem(week, action.id);
    },
    onSettled: () => client.invalidateQueries({ queryKey: plannerKey(user?.uid, week, "items") }),
  });
}
