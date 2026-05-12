import type { CalendarEvent } from "../../types";
import type { EventSegment } from "../../utils/eventSegments";
import EventBar from "../shared/EventBar";

type WeekAllDayBarsProps = {
  segments: EventSegment[];
  dayCount: number;
  editingEventId: number | null;
  dayHeaderHeight: number;
  eventBarHeight: number;
  eventBarGap: number;
  onEventClick: (event: CalendarEvent) => void;
};

export default function WeekAllDayBars({
  segments,
  dayCount,
  editingEventId,
  dayHeaderHeight,
  eventBarHeight,
  eventBarGap,
  onEventClick,
}: WeekAllDayBarsProps) {
  return (
    <>
      {segments.map((segment) => {
        const top = dayHeaderHeight + segment.lane * (eventBarHeight + eventBarGap);

        return (
          <EventBar
            key={`${segment.event.id}-${segment.startIndex}`}
            segment={segment}
            dayCount={dayCount}
            top={top}
            height={eventBarHeight}
            isEditing={editingEventId === segment.event.id}
            className=""
            onEventClick={onEventClick}
          />
        );
      })}
    </>
  );
}
