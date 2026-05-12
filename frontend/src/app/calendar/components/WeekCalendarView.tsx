import type { CalendarEvent } from "../types";
import WeekCalendarColumn from "./WeekCalendarColumn";

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

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
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

const TIME_LABELS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`
);

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

  const eventMap = new Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    const dateString = event.start_at.slice(0, 10);

    if (!eventMap.has(dateString)) {
      eventMap.set(dateString, []);
    }

    eventMap.get(dateString)?.push(event);
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `52px repeat(${dayCount}, minmax(96px, 1fr))`,
          minWidth: `${64 + dayCount * 110}px`,
        }}
      >
        <div className="border-r bg-gray-50">
          <div className="sticky top-0 z-20 h-20 border-b bg-gray-50" />
          <div className="min-h-[1536px]">
            {TIME_LABELS.map((time) => (
              <div
                key={time}
                className="h-16 border-b px-2 pt-1 text-right text-[11px] text-gray-500"
              >
                {time}
              </div>
            ))}
          </div>
        </div>
        {weekDays.map((weekDay) => (
          <WeekCalendarColumn
            key={weekDay.dateString}
            weekDay={weekDay}
            holidayName={holidayMap.get(weekDay.dateString)}
            events={eventMap.get(weekDay.dateString) || []}
            todayString={todayString}
            editingEventId={editingEventId}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}
