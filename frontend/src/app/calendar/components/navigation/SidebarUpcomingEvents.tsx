import type { CalendarEvent } from "../../types";
import { formatTime } from "../../utils/date";

type SidebarUpcomingEventsProps = {
  events: CalendarEvent[];
  todayString: string;
  limit?: number;
  onEventClick: (event: CalendarEvent) => void;
};

function getEventDateString(event: CalendarEvent) {
  return event.start_at.slice(0, 10);
}

export default function SidebarUpcomingEvents({
  events,
  todayString,
  limit = 10,
  onEventClick,
}: SidebarUpcomingEventsProps) {
  const upcomingEvents = [...events]
    .filter((event) => (event.end_at || event.start_at).slice(0, 10) >= todayString)
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .slice(0, limit);

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-gray-800">直近の予定</h2>

      {upcomingEvents.length === 0 ? (
        <p className="text-xs text-gray-500">予定はありません。</p>
      ) : (
        <div className="space-y-1">
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event)}
              className="flex w-full items-start gap-2 rounded px-2 py-2 text-left hover:bg-gray-50"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: event.color || "#3b82f6" }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-gray-900">
                  {event.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-gray-500">
                  {getEventDateString(event)}{" "}
                  {event.all_day ? "終日" : formatTime(event.start_at)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
