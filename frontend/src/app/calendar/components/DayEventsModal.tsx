import type { CalendarEvent } from "../types";

type DayEventsModalProps = {
  isOpen: boolean;
  dateString: string;
  events: CalendarEvent[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
};

function formatTime(dateTime: string) {
  const date = new Date(dateTime);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default function DayEventsModal({
  isOpen,
  dateString,
  events,
  onClose,
  onEventClick,
}: DayEventsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:items-center sm:p-4">
      <div className="my-4 w-full max-w-lg rounded-lg bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">予定一覧</h2>
            <p className="text-sm text-gray-500">{dateString}</p>
          </div>

          <button
            onClick={onClose}
            className="min-h-10 rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
          >
            閉じる
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-gray-500">この日の予定はありません。</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="block w-full rounded border p-3 text-left hover:bg-gray-50"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                  />

                  <span className="shrink-0 text-sm font-bold">
                    {event.all_day ? "終日" : formatTime(event.start_at)}
                  </span>

                  <span className="truncate text-sm font-medium">
                    {event.title}
                  </span>
                </div>

                {event.description && (
                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {event.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}