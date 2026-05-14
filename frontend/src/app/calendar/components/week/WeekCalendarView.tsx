"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEvent } from "../../types";
import {
  createEventSegments,
  getSegmentLaneCount,
  isMultiDayEvent,
} from "../../utils/eventSegments";
import { formatDate } from "../../utils/date";
import WeekCalendarColumn from "./WeekCalendarColumn";
import WeekHeader from "./WeekHeader";
import WeekTimeGrid from "./WeekTimeGrid";
import { HOUR_HEIGHT } from "./timeGrid";

type WeekCalendarViewProps = {
  selectedDate: string;
  dayCount?: number;
  events: CalendarEvent[];
  holidayMap: Map<string, string>;
  todayString: string;
  editingEventId: number | null;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

const DAY_HEADER_HEIGHT = 44;
const EVENT_BAR_HEIGHT = 22;
const EVENT_BAR_GAP = 4;

function getDisplayDays(baseDateString: string, dayCount: number) {
  const baseDate = baseDateString ? new Date(baseDateString) : new Date();
  const startDate = new Date(baseDate);

  if (dayCount === 7) {
    startDate.setDate(baseDate.getDate() - baseDate.getDay());
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      dateString: formatDate(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      weekDay: date.getDay(),
    };
  });
}

const TIME_LABELS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`
);

function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function WeekCalendarView({
  selectedDate,
  dayCount = 7,
  events,
  holidayMap,
  todayString,
  editingEventId,
  onDateClick,
  onEventClick,
}: WeekCalendarViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes);

  // マウント時に現在時刻付近へスクロール
  useEffect(() => {
    if (scrollRef.current) {
      const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, nowTop - 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1時間ごとに現在時刻を更新
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(getNowMinutes()), 3_600_000);
    return () => clearInterval(id);
  }, []);

  const weekDays = getDisplayDays(selectedDate || todayString, dayCount);
  const weekEventSegments = createEventSegments(
    weekDays.map((weekDay) => weekDay.dateString),
    events.filter(isMultiDayEvent)
  );
  const laneCount = getSegmentLaneCount(weekEventSegments);
  const headerHeight =
    DAY_HEADER_HEIGHT + laneCount * (EVENT_BAR_HEIGHT + EVENT_BAR_GAP);

  const eventMap = new Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    if (isMultiDayEvent(event)) return;

    const dateString = event.start_at.slice(0, 10);

    if (!eventMap.has(dateString)) {
      eventMap.set(dateString, []);
    }

    eventMap.get(dateString)?.push(event);
  });

  const todayInView = weekDays.some((d) => d.dateString === todayString);
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `52px repeat(${dayCount}, minmax(96px, 1fr))`,
          minWidth: `${64 + dayCount * 110}px`,
        }}
      >
        <div className="border-r bg-gray-50">
          <div
            className="sticky top-0 z-20 border-b bg-gray-50"
            style={{ height: headerHeight }}
          />
          <WeekTimeGrid labels={TIME_LABELS} />
        </div>
        <div
          className="col-span-full col-start-2"
          style={{ gridColumn: `2 / span ${dayCount}` }}
        >
          <WeekHeader
            weekDays={weekDays}
            holidayMap={holidayMap}
            todayString={todayString}
            dayCount={dayCount}
            headerHeight={headerHeight}
            segments={weekEventSegments}
            editingEventId={editingEventId}
            dayHeaderHeight={DAY_HEADER_HEIGHT}
            eventBarHeight={EVENT_BAR_HEIGHT}
            eventBarGap={EVENT_BAR_GAP}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
          />

          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `repeat(${dayCount}, minmax(96px, 1fr))`,
            }}
          >
            {weekDays.map((weekDay) => (
              <WeekCalendarColumn
                key={weekDay.dateString}
                events={eventMap.get(weekDay.dateString) || []}
                editingEventId={editingEventId}
                onEventClick={onEventClick}
              />
            ))}

            {todayInView && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                style={{ top: nowTop }}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                <div className="h-px flex-1 bg-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
