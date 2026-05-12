import type { CalendarEvent } from "../../types";
import type { EventSegment } from "../../utils/eventSegments";
import EventBar from "../shared/EventBar";

type MonthEventBarsProps = {
  segments: EventSegment[];
  weekIndex: number;
  editingEventId: number | null;
  eventBarHeight: number;
  eventBarGap: number;
  dateAreaHeight: number;
  onEventClick: (event: CalendarEvent) => void;
};

export default function MonthEventBars({
  segments,
  weekIndex,
  editingEventId,
  eventBarHeight,
  eventBarGap,
  dateAreaHeight,
  onEventClick,
}: MonthEventBarsProps) {
  return (
    <>
      {segments.map((segment) => {
        const top = dateAreaHeight + segment.lane * (eventBarHeight + eventBarGap);

        return (
          <EventBar
            key={`${segment.event.id}-${weekIndex}-${segment.startIndex}`}
            segment={segment}
            dayCount={7}
            top={top}
            height={eventBarHeight}
            isEditing={editingEventId === segment.event.id}
            className="z-0 text-[11px] leading-5 sm:text-xs"
            onEventClick={onEventClick}
          />
        );
      })}
    </>
  );
}
