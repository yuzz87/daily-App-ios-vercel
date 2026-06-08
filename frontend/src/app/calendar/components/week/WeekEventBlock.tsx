import type { CalendarEvent } from "../../types";
import { formatTime } from "../../utils/date";

type WeekEventBlockProps = {
  event: CalendarEvent;
  isEditing?: boolean;
  onClick: (event: CalendarEvent) => void;
};

export default function WeekEventBlock({
  event,
  isEditing = false,
  onClick,
}: WeekEventBlockProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={`block w-full overflow-hidden rounded px-2 py-1 text-left text-xs text-white opacity-90 hover:opacity-100 ${
        isEditing ? "ring-2 ring-gray-800" : ""
      }`}
      style={{
        backgroundColor: event.color || "#3b82f6",
      }}
      title={event.description || event.title}
    >
      <span className="block truncate font-medium">{event.title}</span>
      <span className="block truncate text-[10px] opacity-90">
        {formatTime(event.start_at)}
      </span>
    </button>
  );
}
