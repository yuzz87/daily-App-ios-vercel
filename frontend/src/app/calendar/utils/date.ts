import type { CalendarDay } from "../types";

export function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

export function createCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const days: CalendarDay[] = [];

  for (let i = 0; i < startWeekDay; i++) {
    days.push({
      dateString: null,
      day: null,
      weekDay: null,
    });
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

export function formatTime(dateTime: string) {
  const date = new Date(dateTime);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function formatDateFromDateTime(dateTime: string) {
  return dateTime.slice(0, 10);
}
