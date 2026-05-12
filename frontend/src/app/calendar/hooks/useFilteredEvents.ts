import { useMemo } from "react";

import type { CalendarEvent } from "../types";

export function useFilteredEvents(
  events: CalendarEvent[],
  searchKeyword: string
) {
  return useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return events;
    }

    return events.filter((event) => {
      const title = event.title.toLowerCase();
      const description = event.description?.toLowerCase() || "";

      return title.includes(keyword) || description.includes(keyword);
    });
  }, [events, searchKeyword]);
}
