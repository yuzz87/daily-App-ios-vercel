"use client";

import type { CalendarDay } from "../../types";
import DayHeaderCell from "../shared/DayHeaderCell";

type MonthDayCellProps = {
  calendarDay: CalendarDay;
  dayKey: string;
  holidayName?: string;
  todayString: string;
  onDateClick: (dateString: string) => void;
};

export default function MonthDayCell({
  calendarDay,
  dayKey,
  holidayName,
  todayString,
  onDateClick,
}: MonthDayCellProps) {
  if (!calendarDay.dateString || calendarDay.day === null || calendarDay.weekDay === null) {
    return <div key={dayKey} className="border-b border-r bg-gray-300" />;
  }

  return (
    <div className="relative">
      <DayHeaderCell
        dateString={calendarDay.dateString}
        day={calendarDay.day}
        weekDay={calendarDay.weekDay}
        holidayName={holidayName}
        todayString={todayString}
        variant="month"
        onDateClick={onDateClick}
      />
    </div>
  );
}
