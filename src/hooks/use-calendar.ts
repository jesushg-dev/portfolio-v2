import { useState, useMemo } from "react";

const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const generateCalendarDays = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Start and end of the calendar view (including previous and next months)
    const startDay = startOfMonth.getDay();
    const endDay = 6 - endOfMonth.getDay();

    const start = new Date(startOfMonth);
    start.setDate(start.getDate() - startDay);

    const end = new Date(endOfMonth);
    end.setDate(end.getDate() + endDay);

    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const calendarDays = useMemo(
    () => generateCalendarDays(currentDate),
    [currentDate],
  );

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  return { currentDate, calendarDays, nextMonth, prevMonth };
};

export default useCalendar;
