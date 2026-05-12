import type { CalendarDay } from "../types";

type SidebarCalendarProps = {
  calendarDays: CalendarDay[];
  holidayMap: Map<string, string>;
  todayString: string;
  selectedDate: string;
  onDateClick: (dateString: string) => void;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function SidebarCalendar({
  calendarDays,
  holidayMap,
  todayString,
  selectedDate,
  onDateClick,
}: SidebarCalendarProps) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-500">
        {WEEK_LABELS.map((weekLabel) => (
          <div key={weekLabel} className="py-1">
            {weekLabel}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((calendarDay, index) => {
          if (!calendarDay.dateString) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isHoliday = holidayMap.has(calendarDay.dateString);
          const isSelected = calendarDay.dateString === selectedDate;
          const isToday = calendarDay.dateString === todayString;
          const isSunday = calendarDay.weekDay === 0;
          const isSaturday = calendarDay.weekDay === 6;

          return (
            <button
              key={calendarDay.dateString}
              type="button"
              onClick={() => onDateClick(calendarDay.dateString!)}
              className={`aspect-square rounded text-xs font-medium hover:bg-gray-100 ${
                isSelected ? "bg-gray-800 text-white hover:bg-gray-800" : ""
              } ${isToday && !isSelected ? "ring-2 ring-blue-400" : ""} ${
                !isSelected && (isSunday || isHoliday)
                  ? "text-red-500"
                  : !isSelected && isSaturday
                    ? "text-blue-500"
                    : !isSelected
                      ? "text-gray-800"
                      : ""
              }`}
              title={holidayMap.get(calendarDay.dateString) || undefined}
            >
              {calendarDay.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
