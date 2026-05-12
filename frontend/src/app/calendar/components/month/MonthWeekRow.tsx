import type { CalendarDay, CalendarEvent } from "../../types";
import {
  createEventSegments,
  getSegmentLaneCount,
} from "../../utils/eventSegments";
import MonthDayCell from "./MonthDayCell";
import MonthEventBars from "./MonthEventBars";

type MonthWeekRowProps = {
  week: CalendarDay[];
  weekIndex: number;
  events: CalendarEvent[];
  holidayMap: Map<string, string>;
  todayString: string;
  editingEventId: number | null;
  minWeekHeight: number;
  dateAreaHeight: number;
  eventBarHeight: number;
  eventBarGap: number;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export default function MonthWeekRow({
  week,
  weekIndex,
  events,
  holidayMap,
  todayString,
  editingEventId,
  minWeekHeight,
  dateAreaHeight,
  eventBarHeight,
  eventBarGap,
  onDateClick,
  onEventClick,
}: MonthWeekRowProps) {
  const segments = createEventSegments(
    week.map((day) => day.dateString),
    events
  );
  const laneCount = getSegmentLaneCount(segments);
  const weekHeight = Math.max(
    minWeekHeight,
    dateAreaHeight + laneCount * (eventBarHeight + eventBarGap) + 12
  );

  return (
    <div
      className="relative grid grid-cols-7"
      style={{ minHeight: weekHeight }}
    >
      {week.map((calendarDay, dayIndex) => (
        <MonthDayCell
          key={calendarDay.dateString || `empty-${weekIndex}-${dayIndex}`}
          calendarDay={calendarDay}
          dayKey={`empty-${weekIndex}-${dayIndex}`}
          holidayName={
            calendarDay.dateString
              ? holidayMap.get(calendarDay.dateString)
              : undefined
          }
          todayString={todayString}
          onDateClick={onDateClick}
        />
      ))}

      <MonthEventBars
        segments={segments}
        weekIndex={weekIndex}
        editingEventId={editingEventId}
        eventBarHeight={eventBarHeight}
        eventBarGap={eventBarGap}
        dateAreaHeight={dateAreaHeight}
        onEventClick={onEventClick}
      />
    </div>
  );
}
