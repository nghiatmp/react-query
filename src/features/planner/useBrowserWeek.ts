"use client";
import { useSyncExternalStore } from "react";
import { dateKey, monday } from "./model";

const subscribe = () => () => {};
const browserSnapshot = () => true;
const serverSnapshot = () => false;

export function useBrowserWeek(initialWeek?: string) {
  const browserReady = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  if (!browserReady) return { week: initialWeek ?? null, today: null };
  const now = new Date();
  return { week: initialWeek ?? monday(now), today: dateKey(now) };
}
