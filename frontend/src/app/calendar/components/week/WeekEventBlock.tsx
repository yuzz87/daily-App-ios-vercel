import type { CSSProperties } from "react";

import type { CalendarEvent } from "../../types";
import { formatTime } from "../../utils/date";

type WeekEventBlockProps = {
  event: CalendarEvent;
  isEditing?: boolean;
  style?: CSSProperties;
  onClick: (event: CalendarEvent) => void;
};

export default function WeekEventBlock({
  event,
  isEditing = false,
  style,
  onClick,
}: WeekEventBlockProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={`absolute overflow-hidden rounded px-2 py-1.5 text-left text-xs text-white opacity-90 hover:opacity-100 ${
        isEditing ? "ring-2 ring-gray-800" : ""
      }`}
      style={{ backgroundColor: event.color || "#3b82f6", ...style }}
      title={event.description || event.title}
    >
      <span className="block truncate font-medium">{event.title}</span>
      <span className="block truncate text-[10px] opacity-90">
        {event.all_day ? "終日" : formatTime(event.start_at)}
      </span>
    </button>
  );
}
