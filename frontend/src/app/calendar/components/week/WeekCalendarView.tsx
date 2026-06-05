"use client";

import { useDroppable } from "@dnd-kit/core";

import type { CalendarEvent } from "../../types";
import { isMultiDayEvent } from "../../utils/eventSegments";
import { formatDate } from "../../utils/date";
import WeekEventBlock from "./WeekEventBlock";
import WeekHeader from "./WeekHeader";

type WeekCalendarViewProps = {
  selectedDate: string;
  dayCount?: number;
  events: CalendarEvent[];
  holidayMap: Map<string, string>;
  todayString: string;
  editingEventId: number | null;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

type WeekDayColumnProps = {
  dateString: string;
  events: CalendarEvent[];
  editingEventId: number | null;
  onEventClick: (event: CalendarEvent) => void;
};

function WeekDayColumn({
  dateString,
  events,
  editingEventId,
  onEventClick,
}: WeekDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dateString });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-1 rounded p-1 transition-colors ${
        isOver ? "bg-blue-50" : ""
      }`}
    >
      {events.map((event) => (
        <WeekEventBlock
          key={event.id}
          event={event}
          isEditing={editingEventId === event.id}
          onClick={onEventClick}
        />
      ))}
    </div>
  );
}

function getDisplayDays(baseDateString: string, dayCount: number) {
  const baseDate = baseDateString ? new Date(baseDateString) : new Date();
  const startDate = new Date(baseDate);

  if (dayCount === 7) {
    startDate.setDate(baseDate.getDate() - baseDate.getDay());
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      dateString: formatDate(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      weekDay: date.getDay(),
    };
  });
}

export default function WeekCalendarView({
  selectedDate,
  dayCount = 7,
  events,
  holidayMap,
  todayString,
  editingEventId,
  onDateClick,
  onEventClick,
}: WeekCalendarViewProps) {
  const weekDays = getDisplayDays(selectedDate || todayString, dayCount);

  // 各日付に紐づくイベントを振り分け。終日 / 複数日イベントは現状非表示。
  // 将来、終日バー帯をヘッダ下に再追加する場合は、ここで isMultiDayEvent を
  // 通したものを別途集めて WeekHeader に渡す形に拡張する。
  const eventsByDate = new Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    if (event.all_day || isMultiDayEvent(event)) return;

    const dateString = event.start_at.slice(0, 10);

    if (!eventsByDate.has(dateString)) {
      eventsByDate.set(dateString, []);
    }

    eventsByDate.get(dateString)?.push(event);
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white p-2">
      <div
        className="grid gap-x-1"
        style={{
          gridTemplateColumns: `repeat(${dayCount}, minmax(96px, 1fr))`,
          minWidth: `${dayCount * 110}px`,
        }}
      >
        <div className="col-span-full">
          <WeekHeader
            weekDays={weekDays}
            holidayMap={holidayMap}
            todayString={todayString}
            dayCount={dayCount}
            onDateClick={onDateClick}
          />
        </div>

        {weekDays.map((weekDay) => (
          <WeekDayColumn
            key={weekDay.dateString}
            dateString={weekDay.dateString}
            events={eventsByDate.get(weekDay.dateString) || []}
            editingEventId={editingEventId}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}
