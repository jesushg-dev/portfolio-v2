import { act, renderHook } from "@testing-library/react";

import useCalendar from "./use-calendar";

describe("useCalendar", () => {
  it("generates a full week-aligned month grid", () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.calendarDays.length).toBeGreaterThanOrEqual(28);
    expect(result.current.calendarDays.length % 7).toBe(0);
  });

  it("moves to the next and previous month", () => {
    const { result } = renderHook(() => useCalendar());
    const startMonth = result.current.currentDate.getMonth();

    act(() => {
      result.current.nextMonth();
    });
    expect(result.current.currentDate.getMonth()).toBe((startMonth + 1) % 12);

    act(() => {
      result.current.prevMonth();
    });
    expect(result.current.currentDate.getMonth()).toBe(startMonth);
  });
});
