import type { CalendarDay, CalendarEvent } from "../../types";

type SidebarCalendarProps = {
  calendarDays: CalendarDay[];
  events: CalendarEvent[];
  holidayMap: Map<string, string>;
  todayString: string;
  selectedDate: string;
  onDateClick: (dateString: string) => void;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function SidebarCalendar({
  calendarDays,
  events,
  holidayMap,
  todayString,
  selectedDate,
  onDateClick,
}: SidebarCalendarProps) {
  const eventMap = new Map<string, CalendarEvent[]>();

  events.forEach((event) => {
    const currentDate = new Date(`${event.start_at.slice(0, 10)}T00:00:00`);
    const endDate = new Date(`${(event.end_at || event.start_at).slice(0, 10)}T00:00:00`);

    while (currentDate <= endDate) {
      const dateString = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

      if (!eventMap.has(dateString)) {
        eventMap.set(dateString, []);
      }

      eventMap.get(dateString)?.push(event);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return (
    <div className="mx-auto max-w-[300px] rounded-lg bg-white p-3 shadow-sm">
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
          const dayEvents = eventMap.get(calendarDay.dateString) || [];

          return (
            <button
              key={calendarDay.dateString}
              type="button"
              onClick={() => onDateClick(calendarDay.dateString!)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded text-xs font-medium hover:bg-gray-100 ${
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
              title={
                dayEvents.length > 0
                  ? dayEvents.map((event) => event.title).join("\n")
                  : holidayMap.get(calendarDay.dateString) || undefined
              }
            >
              <span className="leading-none">{calendarDay.day}</span>
              {dayEvents.length > 0 && (
                <span className="flex max-w-full justify-center gap-0.5 overflow-hidden px-0.5">
                  {dayEvents.slice(0, 4).map((event) => (
                    <span
                      key={event.id}
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: event.color || "#3b82f6" }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
