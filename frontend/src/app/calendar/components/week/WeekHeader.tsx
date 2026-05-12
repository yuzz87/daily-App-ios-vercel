import type { CalendarEvent } from "../../types";
import type { EventSegment } from "../../utils/eventSegments";
import DayHeaderCell from "../shared/DayHeaderCell";
import WeekAllDayBars from "./WeekAllDayBars";

type WeekDay = {
  dateString: string;
  day: number;
  weekDay: number;
};

type WeekHeaderProps = {
  weekDays: WeekDay[];
  holidayMap: Map<string, string>;
  todayString: string;
  dayCount: number;
  headerHeight: number;
  segments: EventSegment[];
  editingEventId: number | null;
  dayHeaderHeight: number;
  eventBarHeight: number;
  eventBarGap: number;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export default function WeekHeader({
  weekDays,
  holidayMap,
  todayString,
  dayCount,
  headerHeight,
  segments,
  editingEventId,
  dayHeaderHeight,
  eventBarHeight,
  eventBarGap,
  onDateClick,
  onEventClick,
}: WeekHeaderProps) {
  return (
    <div
      className="sticky top-0 z-20 grid border-b bg-white"
      style={{
        gridTemplateColumns: `repeat(${dayCount}, minmax(96px, 1fr))`,
        height: headerHeight,
      }}
    >
      {weekDays.map((weekDay) => (
        <DayHeaderCell
          key={weekDay.dateString}
          dateString={weekDay.dateString}
          day={weekDay.day}
          weekDay={weekDay.weekDay}
          holidayName={holidayMap.get(weekDay.dateString)}
          todayString={todayString}
          variant="week"
          onDateClick={onDateClick}
        />
      ))}

      <WeekAllDayBars
        segments={segments}
        dayCount={dayCount}
        editingEventId={editingEventId}
        dayHeaderHeight={dayHeaderHeight}
        eventBarHeight={eventBarHeight}
        eventBarGap={eventBarGap}
        onEventClick={onEventClick}
      />
    </div>
  );
}
