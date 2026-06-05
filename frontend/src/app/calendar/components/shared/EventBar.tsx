"use client";

import { useDraggable } from "@dnd-kit/core";

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
  // 単一日のイベントのみドラッグ可能。複数日に渡るバーはドラッグ無効。
  const isSingleDay = span === 1;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `event-${segment.event.id}`,
      disabled: !isSingleDay,
    });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(event) => {
        event.stopPropagation();
        onEventClick(segment.event);
      }}
      className={`absolute truncate rounded px-2 text-left font-medium text-white opacity-95 hover:opacity-100 ${
        isEditing ? "ring-2 ring-gray-800" : ""
      } ${isDragging ? "opacity-40" : ""} ${className}`}
      style={{
        top,
        left: `calc(${(segment.startIndex / dayCount) * 100}% + 2px)`,
        width: `calc(${(span / dayCount) * 100}% - 4px)`,
        height,
        backgroundColor: segment.event.color || "#3b82f6",
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        touchAction: isSingleDay ? "none" : undefined,
      }}
      title={segment.event.description || segment.event.title}
    >
      {segment.showTitle ? segment.event.title : ""}
    </button>
  );
}
