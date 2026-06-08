import type { CalendarEvent } from "../../types";
import type { EventSegment } from "../../utils/eventSegments";
import EventBar from "../shared/EventBar";

const DAY_COUNT = 7;

type MonthEventBarsProps = {
  segments: EventSegment[];
  weekIndex: number;
  editingEventId: number | null;
  eventBarHeight: number;
  eventBarGap: number;
  dateAreaHeight: number;
  maxVisibleLanes: number;
  moreRowHeight: number;
  onEventClick: (event: CalendarEvent) => void;
};

export default function MonthEventBars({
  segments,
  weekIndex,
  editingEventId,
  eventBarHeight,
  eventBarGap,
  dateAreaHeight,
  maxVisibleLanes,
  moreRowHeight,
  onEventClick,
}: MonthEventBarsProps) {
  // 表示上限を超えたレーンのバーは描画しない。
  const visibleSegments = segments.filter(
    (segment) => segment.lane < maxVisibleLanes
  );

  // 各日について、表示しきれず隠れた予定の件数を数える。
  // 複数日にまたがる予定は、覆う日それぞれでカウントする。
  const hiddenCountByDay = new Array<number>(DAY_COUNT).fill(0);
  segments.forEach((segment) => {
    if (segment.lane < maxVisibleLanes) return;
    for (let index = segment.startIndex; index <= segment.endIndex; index += 1) {
      hiddenCountByDay[index] += 1;
    }
  });

  // 「+X」を置く行の上端。可視レーンのすぐ下。
  const moreRowTop =
    dateAreaHeight + maxVisibleLanes * (eventBarHeight + eventBarGap);

  return (
    <>
      {visibleSegments.map((segment) => {
        const top = dateAreaHeight + segment.lane * (eventBarHeight + eventBarGap);

        return (
          <EventBar
            key={`${segment.event.id}-${weekIndex}-${segment.startIndex}`}
            segment={segment}
            dayCount={DAY_COUNT}
            top={top}
            height={eventBarHeight}
            isEditing={editingEventId === segment.event.id}
            className="z-0 text-[11px] leading-5 sm:text-xs"
            onEventClick={onEventClick}
          />
        );
      })}

      {hiddenCountByDay.map((count, dayIndex) =>
        count > 0 ? (
          <div
            key={`more-${weekIndex}-${dayIndex}`}
            className="absolute truncate px-2 text-left text-[11px] font-medium text-gray-500"
            style={{
              top: moreRowTop,
              left: `calc(${(dayIndex / DAY_COUNT) * 100}% + 2px)`,
              width: `calc(${(1 / DAY_COUNT) * 100}% - 4px)`,
              height: moreRowHeight,
              lineHeight: `${moreRowHeight}px`,
            }}
            title={`他 ${count} 件`}
          >
            +{count}
          </div>
        ) : null
      )}
    </>
  );
}
