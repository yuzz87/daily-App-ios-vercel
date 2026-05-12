import type { CalendarEvent } from "../../types";
import WeekEventBlock from "./WeekEventBlock";

type WeekCalendarColumnProps = {
  events: CalendarEvent[];
  editingEventId: number | null;
  onEventClick: (event: CalendarEvent) => void;
};

const HOUR_HEIGHT = 64;
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const MIN_EVENT_HEIGHT = 24;

function getMinutesFromDayStart(dateTime: string) {
  const date = new Date(dateTime);

  return date.getHours() * 60 + date.getMinutes();
}

function getEventLayout(event: CalendarEvent) {
  if (event.all_day) {
    return {
      top: 2,
      height: MIN_EVENT_HEIGHT,
    };
  }

  const startMinutes = getMinutesFromDayStart(event.start_at);
  const endMinutes = event.end_at
    ? getMinutesFromDayStart(event.end_at)
    : startMinutes + 30;
  const durationMinutes = Math.max(endMinutes - startMinutes, 15);

  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT),
  };
}

export default function WeekCalendarColumn({
  events,
  editingEventId,
  onEventClick,
}: WeekCalendarColumnProps) {
  return (
    <div
      className="relative border-r bg-[linear-gradient(to_bottom,transparent_63px,#e5e7eb_64px)] bg-[length:100%_64px]"
      style={{ minHeight: DAY_HEIGHT }}
    >
      {events.map((event) => {
        const layout = getEventLayout(event);

        return (
          <WeekEventBlock
            key={event.id}
            event={event}
            isEditing={editingEventId === event.id}
            style={{
              top: layout.top + 2,
              left: 6,
              right: 6,
              height: layout.height - 4,
            }}
            onClick={onEventClick}
          />
        );
      })}
    </div>
  );
}
