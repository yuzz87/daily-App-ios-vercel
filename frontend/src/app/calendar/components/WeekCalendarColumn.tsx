import type { CalendarEvent } from "../types";
import WeekEventBlock from "./WeekEventBlock";

type WeekDay = {
  dateString: string;
  day: number;
  weekDay: number;
};

type WeekCalendarColumnProps = {
  weekDay: WeekDay;
  holidayName?: string;
  events: CalendarEvent[];
  todayString: string;
  editingEventId: number | null;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function WeekCalendarColumn({
  weekDay,
  holidayName,
  events,
  todayString,
  editingEventId,
  onDateClick,
  onEventClick,
}: WeekCalendarColumnProps) {
  const isSunday = weekDay.weekDay === 0;
  const isSaturday = weekDay.weekDay === 6;
  const isHoliday = Boolean(holidayName);
  const isToday = weekDay.dateString === todayString;

  return (
    <div className={`${isToday ? "ring-2 ring-blue-400" : ""}`}>
      <button
        type="button"
        onClick={() => onDateClick(weekDay.dateString)}
        className="sticky top-0 z-10 block h-20 w-full border-b bg-inherit p-3 text-center hover:bg-[#9e9eff]/30"
      >
        <div className="flex flex-col items-center justify-center gap-1">
          {/* 曜日を日付の上に表示 */}
          <span
            className={`text-xs font-bold ${
              isSunday || isHoliday
                ? "text-red-500"
                : isSaturday
                  ? "text-blue-500"
                  : "text-gray-800"
            }`}
          >
            {WEEK_LABELS[weekDay.weekDay]}
          </span>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              isToday
                ? "bg-gray-900 text-white"
                : isSunday || isHoliday
                  ? "text-red-500"
                  : isSaturday
                    ? "text-blue-500"
                    : "text-gray-800"
            }`}
          >
            {weekDay.day}
          </span>
        </div>

        {holidayName && (
          <div className="mt-1 truncate text-xs text-red-600" title={holidayName}>
            {holidayName}
          </div>
        )}
      </button>

      <div className="min-h-[1232px] space-y-2 bg-[linear-gradient(to_bottom,transparent_63px,#e5e7eb_64px)] bg-[length:100%_64px] p-2">
        {events.map((event) => (
          <WeekEventBlock
            key={event.id}
            event={event}
            isEditing={editingEventId === event.id}
            onClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}