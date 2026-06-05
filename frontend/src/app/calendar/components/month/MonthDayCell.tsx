"use client";

import { useDroppable } from "@dnd-kit/core";

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
  // 月初・月末の空白セルは droppable にしない。
  const dropId = calendarDay.dateString ?? `empty-${dayKey}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    disabled: !calendarDay.dateString,
  });

  if (!calendarDay.dateString || calendarDay.day === null || calendarDay.weekDay === null) {
    return <div key={dayKey} className="border-b border-r bg-gray-300" />;
  }

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-colors ${isOver ? "bg-blue-100" : ""}`}
    >
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
