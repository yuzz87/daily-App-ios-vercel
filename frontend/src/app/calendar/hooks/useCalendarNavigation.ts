import { useMemo, useState } from "react";

import { createCalendarDays, formatDate } from "../utils/date";

export function useCalendarNavigation(today: Date) {
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const todayString = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const calendarDays = useMemo(() => {
    return createCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  function selectDate(dateString: string) {
    const date = new Date(dateString);

    setSelectedDate(dateString);
    setCurrentYear(date.getFullYear());
    setCurrentMonth(date.getMonth());
  }

  function goToPrevMonth() {
    const newDate = new Date(currentYear, currentMonth - 1, 1);

    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth());
    setSelectedDate(formatDate(newDate.getFullYear(), newDate.getMonth(), 1));
  }

  function goToNextMonth() {
    const newDate = new Date(currentYear, currentMonth + 1, 1);

    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth());
    setSelectedDate(formatDate(newDate.getFullYear(), newDate.getMonth(), 1));
  }

  function goToToday() {
    const now = new Date();

    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(formatDate(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  function moveSelectedDate(offset: number) {
    const date = new Date(selectedDate || todayString);
    date.setDate(date.getDate() + offset);

    selectDate(formatDate(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  function goToPrevWeek() {
    moveSelectedDate(-7);
  }

  function goToNextWeek() {
    moveSelectedDate(7);
  }

  function goToPrevYear() {
    const newYear = currentYear - 1;

    setCurrentYear(newYear);
    setSelectedDate(formatDate(newYear, currentMonth, 1));
  }

  function goToNextYear() {
    const newYear = currentYear + 1;

    setCurrentYear(newYear);
    setSelectedDate(formatDate(newYear, currentMonth, 1));
  }

  return {
    currentYear,
    currentMonth,
    selectedDate,
    todayString,
    calendarDays,
    setCurrentMonth,
    setSelectedDate,
    selectDate,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    moveSelectedDate,
    goToPrevWeek,
    goToNextWeek,
    goToPrevYear,
    goToNextYear,
  };
}
