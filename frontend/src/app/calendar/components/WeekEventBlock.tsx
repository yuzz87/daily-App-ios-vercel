import type { CalendarEvent } from "../types";

type WeekEventBlockProps = {
  event: CalendarEvent;
  isEditing?: boolean;
  onClick: (event: CalendarEvent) => void;
};

function formatTime(dateTime: string) {
  const date = new Date(dateTime);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default function WeekEventBlock({
  event,
  isEditing = false,
  onClick,
}: WeekEventBlockProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={`block w-full rounded px-2 py-1.5 text-left text-xs text-white opacity-90 hover:opacity-100 ${
        isEditing ? "ring-2 ring-gray-800" : ""
      }`}
      style={{ backgroundColor: event.color || "#3b82f6" }}
      title={event.description || event.title}
    >
      <span className="block truncate font-medium">{event.title}</span>
      <span className="block truncate text-[10px] opacity-90">
        {event.all_day ? "終日" : formatTime(event.start_at)}
      </span>
    </button>
  );
}
