import type { EventSegment } from "../../utils/eventSegments";

type EventBarProps = {
  segment: EventSegment;
  dayCount: number;
  top: number;
  height: number;
  isEditing: boolean;
  className?: string;
  onEventClick: (event: EventSegment["event"]) => void;
};

export default function EventBar({
  segment,
  dayCount,
  top,
  height,
  isEditing,
  className = "",
  onEventClick,
}: EventBarProps) {
  const span = segment.endIndex - segment.startIndex + 1;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onEventClick(segment.event);
      }}
      className={`absolute truncate rounded px-2 text-left font-medium text-white opacity-95 hover:opacity-100 ${
        isEditing ? "ring-2 ring-gray-800" : ""
      } ${className}`}
      style={{
        top,
        left: `calc(${(segment.startIndex / dayCount) * 100}% + 2px)`,
        width: `calc(${(span / dayCount) * 100}% - 4px)`,
        height,
        backgroundColor: segment.event.color || "#3b82f6",
      }}
      title={segment.event.description || segment.event.title}
    >
      {segment.showTitle ? segment.event.title : ""}
    </button>
  );
}
