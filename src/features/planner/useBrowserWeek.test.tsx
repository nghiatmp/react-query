import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBrowserWeek } from "./useBrowserWeek";

function WeekProbe({ initialWeek }: { initialWeek?: string }) {
  const { week, today } = useBrowserWeek(initialWeek);
  return <output>{week ?? "pending"}|{today ?? "pending"}</output>;
}

describe("browser-local planner dates", () => {
  const originalTimezone = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T17:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalTimezone) process.env.TZ = originalTimezone;
    else delete process.env.TZ;
  });

  it("defers the implicit week to the browser and keeps an explicit deep link during SSR", () => {
    expect(renderToStaticMarkup(<WeekProbe/>)).toContain("pending|pending");
    expect(renderToStaticMarkup(<WeekProbe initialWeek="2026-09-21"/>)).toContain("2026-09-21|pending");

    render(<WeekProbe/>);
    expect(screen.getByText("2026-09-28|2026-09-28")).toBeInTheDocument();
  });
});
