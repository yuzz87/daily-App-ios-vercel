import { useEffect, useMemo, useState } from "react";

import { fetchEvents, fetchHolidays } from "../api";
import type { CalendarEvent, Holiday } from "../types";

export function useCalendarEvents(currentYear: number, currentMonth: number) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();

    holidays.forEach((holiday) => {
      map.set(holiday.date, holiday.name);
    });

    return map;
  }, [holidays]);

  useEffect(() => {
    async function loadHolidays() {
      try {
        const data = await fetchHolidays(currentYear, currentMonth + 1);
        setHolidays(data);
      } catch (error) {
        console.error(error);
        setHolidays([]);
      }
    }

    loadHolidays();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents(currentYear, currentMonth + 1);
        setEvents(data);
      } catch (error) {
        console.error(error);
        setEvents([]);
      }
    }

    loadEvents();
  }, [currentYear, currentMonth]);

  return {
    events,
    setEvents,
    holidayMap,
  };
}
