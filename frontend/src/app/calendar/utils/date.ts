import type { CalendarDay } from "../types";

function padTwoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function createEmptyCalendarDay(): CalendarDay {
  return {
    dateString: null,
    day: null,
    weekDay: null,
  };
}

/** Formats a date as YYYY-MM-DD. month follows the JavaScript Date index: 0-11. */
export function formatDate(year: number, month: number, day: number) {
  return `${year}-${padTwoDigits(month + 1)}-${padTwoDigits(day)}`;
}

/** Creates month-view cells, including blank cells before the first day. */
export function createCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const days: CalendarDay[] = [];

  for (let i = 0; i < startWeekDay; i++) {
    days.push(createEmptyCalendarDay());
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);

    days.push({
      dateString: formatDate(year, month, day),
      day,
      weekDay: date.getDay(),
    });
  }

  return days;
}

/** Formats a date-time string as HH:mm in the local timezone. */
export function formatTime(dateTime: string) {
  const date = new Date(dateTime);

  return `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
}

/** Extracts YYYY-MM-DD from a date-time string. */
export function formatDateFromDateTime(dateTime: string) {
  return dateTime.slice(0, 10);
}
