import type { CalendarEvent } from "../types";

export type EventSegment = {
  event: CalendarEvent;
  startIndex: number;
  endIndex: number;
  lane: number;
  showTitle: boolean;
};

export function getEventDateRange(event: CalendarEvent) {
  return {
    startDateString: event.start_at.slice(0, 10),
    endDateString: (event.end_at || event.start_at).slice(0, 10),
  };
}

export function isMultiDayEvent(event: CalendarEvent) {
  const { startDateString, endDateString } = getEventDateRange(event);

  return startDateString !== endDateString;
}

export function createEventSegments(
  dateStrings: Array<string | null>,
  events: CalendarEvent[]
) {
  const firstVisibleDateIndex = dateStrings.findIndex(Boolean);
  const rawSegments = events
    .map((event) => {
      const { startDateString, endDateString } = getEventDateRange(event);
      const indexes = dateStrings
        .map((dateString, index) =>
          dateString &&
          startDateString <= dateString &&
          dateString <= endDateString
            ? index
            : -1
        )
        .filter((index) => index >= 0);

      if (indexes.length === 0) return null;

      const startIndex = indexes[0];
      const endIndex = indexes[indexes.length - 1];

      return {
        event,
        startIndex,
        endIndex,
        lane: 0,
        showTitle:
          dateStrings[startIndex] === startDateString ||
          startIndex === 0 ||
          startIndex === firstVisibleDateIndex,
      };
    })
    .filter((segment): segment is EventSegment => Boolean(segment))
    .sort((a, b) => {
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
      return b.endIndex - b.startIndex - (a.endIndex - a.startIndex);
    });

  const laneEndIndexes: number[] = [];

  return rawSegments.map((segment) => {
    const lane = laneEndIndexes.findIndex(
      (endIndex) => endIndex < segment.startIndex
    );
    const nextLane = lane >= 0 ? lane : laneEndIndexes.length;

    laneEndIndexes[nextLane] = segment.endIndex;

    return {
      ...segment,
      lane: nextLane,
    };
  });
}

export function getSegmentLaneCount(segments: EventSegment[]) {
  return segments.length > 0
    ? Math.max(...segments.map((segment) => segment.lane)) + 1
    : 0;
}
