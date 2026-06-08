import type { CalendarDay, CalendarEvent } from "../../types";
import MonthWeekRow from "./MonthWeekRow";

type CalendarGridProps = {
  calendarDays: CalendarDay[];
  holidayMap: Map<string, string>;
  events: CalendarEvent[];
  todayString: string;
  editingEventId: number | null;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

type CalendarWeek = CalendarDay[];

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const MIN_WEEK_HEIGHT = 112;
const DATE_AREA_HEIGHT = 64;
const EVENT_BAR_HEIGHT = 20;
const EVENT_BAR_GAP = 1;
// 1 マスに表示する予定バーの最大レーン数。超えた分は各日に「+X」で集約する。
const MAX_VISIBLE_LANES = 3;
// 「+X」表示用に確保する行の高さ。
const MORE_ROW_HEIGHT = 18;

function chunkWeeks(calendarDays: CalendarDay[]) {
  const paddedDays = [...calendarDays];

  while (paddedDays.length % 7 !== 0) {
    paddedDays.push({
      dateString: null,
      day: null,
      weekDay: null,
    });
  }

  const weeks: CalendarWeek[] = [];

  for (let index = 0; index < paddedDays.length; index += 7) {
    weeks.push(paddedDays.slice(index, index + 7));
  }

  return weeks;
}

export default function CalendarGrid({
  calendarDays,
  holidayMap,
  events,
  todayString,
  editingEventId,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  const weeks = chunkWeeks(calendarDays);

  return (
    <>
      <div className="grid grid-cols-7">
        {WEEK_LABELS.map((week) => (
          <div key={week} className="text-center text-xs font-bold">
            {week}
          </div>
        ))}
      </div>

      <div className="border-l border-t">
        {weeks.map((week, weekIndex) => (
          <MonthWeekRow
            key={weekIndex}
            week={week}
            weekIndex={weekIndex}
            events={events}
            holidayMap={holidayMap}
            todayString={todayString}
            editingEventId={editingEventId}
            minWeekHeight={MIN_WEEK_HEIGHT}
            dateAreaHeight={DATE_AREA_HEIGHT}
            eventBarHeight={EVENT_BAR_HEIGHT}
            eventBarGap={EVENT_BAR_GAP}
            maxVisibleLanes={MAX_VISIBLE_LANES}
            moreRowHeight={MORE_ROW_HEIGHT}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </>
  );
}
