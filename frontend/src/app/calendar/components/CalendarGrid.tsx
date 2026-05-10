import type { CalendarDay, CalendarEvent } from "../types";

const MAX_VISIBLE_EVENTS_DESKTOP = 3;
const MAX_VISIBLE_EVENTS_MOBILE = 1;

type CalendarGridProps = {
  calendarDays: CalendarDay[];
  holidayMap: Map<string, string>;
  eventMap: Map<string, CalendarEvent[]>;
  todayString: string;
  editingEventId: number | null;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onMoreEventsClick: (dateString: string, events: CalendarEvent[]) => void;
};

function formatTime(dateTime: string) {
  const date = new Date(dateTime);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default function CalendarGrid({
  calendarDays,
  holidayMap,
  eventMap,
  todayString,
  editingEventId,
  onDateClick,
  onEventClick,
  onMoreEventsClick,
}: CalendarGridProps) {
  return (
    <>
      <div className="grid grid-cols-7">
        {["日", "月", "火", "水", "木", "金", "土"].map((week) => (
          <div
            key={week}
            className="text-center text-xs font-bold "
          >
            {week}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-t">
        {calendarDays.map((calendarDay, index) => {
          if (!calendarDay.dateString) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-20 border-b border-r bg-gray-100"
              />
            );
          }

          const holidayName = holidayMap.get(calendarDay.dateString);
          const dayEvents = eventMap.get(calendarDay.dateString) || [];

          const visibleEventsMobile = dayEvents.slice(
            0,
            MAX_VISIBLE_EVENTS_MOBILE
          );
          const visibleEventsDesktop = dayEvents.slice(
            0,
            MAX_VISIBLE_EVENTS_DESKTOP
          );

          const hiddenEventCountMobile =
            dayEvents.length - visibleEventsMobile.length;
          const hiddenEventCountDesktop =
            dayEvents.length - visibleEventsDesktop.length;

          const isSunday = calendarDay.weekDay === 0;
          const isSaturday = calendarDay.weekDay === 6;
          const isHoliday = Boolean(holidayName);
          const isToday = calendarDay.dateString === todayString;

          return (
            <div
              key={calendarDay.dateString}
              onClick={() => onDateClick(calendarDay.dateString!)}
              className={`min-h-20 cursor-pointer border-b border-r p-1 sm:min-h-28 sm:p-2 ${
                isHoliday ? "bg-red-50" : ""
              } ${isToday ? "ring-2 ring-blue-400" : ""}`}
            >
              <div
                className={`mb-0.5 text-xs font-bold sm:mb-1 sm:text-base ${
                  isSunday || isHoliday
                    ? "text-red-500"
                    : isSaturday
                      ? "text-blue-500"
                      : "text-gray-800"
                }`}
              >
                {calendarDay.day}
              </div>

              {holidayName && (
                <div
                  className="truncate rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-600 sm:px-2 sm:py-1 sm:text-xs"
                  title={holidayName}
                >
                  {holidayName}
                </div>
              )}

              <div className="mt-1 space-y-1 sm:hidden">
                {visibleEventsMobile.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] text-white opacity-90 hover:opacity-100 ${
                      editingEventId === event.id ? "ring-2 ring-gray-800" : ""
                    }`}
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                    title={event.description || "クリックで編集"}
                  >
                    {event.all_day ? "終日 " : `${formatTime(event.start_at)} `}
                    {event.title}
                  </button>
                ))}

                {hiddenEventCountMobile > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreEventsClick(calendarDay.dateString!, dayEvents);
                    }}
                    className="block w-full rounded bg-gray-100 px-1 py-0.5 text-left text-[10px] text-gray-600 hover:bg-gray-200"
                  >
                    +{hiddenEventCountMobile}件
                  </button>
                )}
              </div>

              <div className="mt-2 hidden space-y-1 sm:block">
                {visibleEventsDesktop.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs text-white opacity-90 hover:opacity-100 ${
                      editingEventId === event.id ? "ring-2 ring-gray-800" : ""
                    }`}
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                    title={event.description || "クリックで編集"}
                  >
                    {event.all_day ? "終日 " : `${formatTime(event.start_at)} `}
                    {event.title}
                  </button>
                ))}

                {hiddenEventCountDesktop > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreEventsClick(calendarDay.dateString!, dayEvents);
                    }}
                    className="block w-full rounded bg-gray-100 px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-200"
                  >
                    +{hiddenEventCountDesktop}件
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}