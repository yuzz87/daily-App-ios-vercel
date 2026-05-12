"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchEvents,
  fetchHolidays,
  updateCalendarEvent,
} from "./api";
import CalendarGrid from "./components/CalendarGrid";
import CalendarHeader from "./components/CalendarHeader";
// import DayEventsModal from "./components/DayEventsModal";
import EventModal from "./components/EventModal";
import EventSearch from "./components/EventSearch";
import SidebarCalendar from "./components/SidebarCalendar";
import WeekCalendarView from "./components/WeekCalendarView";
import type { CalendarDay, CalendarEvent, Holiday } from "./types";

type CalendarViewMode = "day" | "week" | "month" | "year" | "schedule" | "fourDays";

const VIEW_MODE_OPTIONS: { label: string; value: CalendarViewMode }[] = [
  { label: "日", value: "day" },
  { label: "週", value: "week" },
  { label: "月", value: "month" },
  { label: "年", value: "year" },
  { label: "スケジュール", value: "schedule" },
  { label: "4日", value: "fourDays" },
];

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function createCalendarDays(year: number, month: number): CalendarDay[] {
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

function formatTime(dateTime: string) {
  const date = new Date(dateTime);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function formatDateFromDateTime(dateTime: string) {
  return dateTime.slice(0, 10);
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export default function CalendarPage() {
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventColor, setEventColor] = useState("#3b82f6");

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");

  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [selectedDayEventsDate, setSelectedDayEventsDate] = useState("");
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>(
    []
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const todayString = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const calendarDays = useMemo(() => {
    return createCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();

    holidays.forEach((holiday) => {
      map.set(holiday.date, holiday.name);
    });

    return map;
  }, [holidays]);

  const filteredEvents = useMemo(() => {
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

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    filteredEvents.forEach((event) => {
      const dateString = event.start_at.slice(0, 10);

      if (!map.has(dateString)) {
        map.set(dateString, []);
      }

      map.get(dateString)?.push(event);
    });

    return map;
  }, [filteredEvents]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) =>
      a.start_at.localeCompare(b.start_at)
    );
  }, [filteredEvents]);

  useEffect(() => {
    async function loadHolidays() {
      setLoadingHolidays(true);

      try {
        const data = await fetchHolidays(currentYear, currentMonth + 1);
        setHolidays(data);
      } catch (error) {
        console.error(error);
        setHolidays([]);
      } finally {
        setLoadingHolidays(false);
      }
    }

    loadHolidays();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);

      try {
        const data = await fetchEvents(currentYear, currentMonth + 1);
        setEvents(data);
      } catch (error) {
        console.error(error);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, [currentYear, currentMonth]);

  function resetEventForm() {
    setEditingEventId(null);
    setEventTitle("");
    setEventDescription("");
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setEventAllDay(false);
    setEventColor("#3b82f6");
  }

  function closeModal() {
    setIsModalOpen(false);
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    resetEventForm();
  }

  function openCreateModal(dateString: string) {
    resetEventForm();
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setSelectedDate(dateString);
    setIsModalOpen(true);
  }

  function closeDayEventsModal() {
    setIsDayEventsModalOpen(false);
    setSelectedDayEventsDate("");
    setSelectedDayEvents([]);
  }

  function openDayEventsModal(dateString: string, dayEvents: CalendarEvent[]) {
    setSelectedDayEventsDate(dateString);
    setSelectedDayEvents(dayEvents);
    setIsDayEventsModalOpen(true);
  }

  function openEventFromDayEventsModal(event: CalendarEvent) {
    closeDayEventsModal();
    startEditEvent(event);
  }

  function goToPrevMonth() {
    const newDate = new Date(currentYear, currentMonth - 1, 1);

    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth());
    setSelectedDate(formatDate(newDate.getFullYear(), newDate.getMonth(), 1));
    setIsModalOpen(false);
    setIsDayEventsModalOpen(false);
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setEditingEventId(null);
  }

  function goToNextMonth() {
    const newDate = new Date(currentYear, currentMonth + 1, 1);

    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth());
    setSelectedDate(formatDate(newDate.getFullYear(), newDate.getMonth(), 1));
    setIsModalOpen(false);
    setIsDayEventsModalOpen(false);
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setEditingEventId(null);
  }

  function goToToday() {
    const now = new Date();

    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(formatDate(now.getFullYear(), now.getMonth(), now.getDate()));
    setIsModalOpen(false);
    setIsDayEventsModalOpen(false);
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setEditingEventId(null);
  }

  function startEditEvent(event: CalendarEvent) {
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description || "");
    setSelectedDate(formatDateFromDateTime(event.start_at));
    setEventAllDay(event.all_day);
    setEventColor(event.color || "#3b82f6");

    if (event.all_day) {
      setEventStartTime("09:00");
      setEventEndTime("10:00");
      setIsModalOpen(true);
      return;
    }

    setEventStartTime(formatTime(event.start_at));

    if (event.end_at) {
      setEventEndTime(formatTime(event.end_at));
    } else {
      setEventEndTime(formatTime(event.start_at));
    }

    setIsModalOpen(true);
  }

  function toggleSidebar() {
  setIsSidebarOpen((prev) => !prev);
}

  function selectDate(dateString: string) {
    const date = new Date(dateString);

    setSelectedDate(dateString);
    setCurrentYear(date.getFullYear());
    setCurrentMonth(date.getMonth());
  }

  function moveWeek(offset: number) {
    const date = new Date(selectedDate || todayString);
    date.setDate(date.getDate() + offset);

    selectDate(formatDate(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  function goToPrevWeek() {
    moveWeek(-7);
  }

  function goToNextWeek() {
    moveWeek(7);
  }

  function moveSelectedDate(offset: number) {
    const date = new Date(selectedDate || todayString);
    date.setDate(date.getDate() + offset);

    selectDate(formatDate(date.getFullYear(), date.getMonth(), date.getDate()));
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

  function goToPrevPeriod() {
    if (viewMode === "day") {
      moveSelectedDate(-1);
      return;
    }

    if (viewMode === "fourDays") {
      moveSelectedDate(-4);
      return;
    }

    if (viewMode === "week") {
      goToPrevWeek();
      return;
    }

    if (viewMode === "year") {
      goToPrevYear();
      return;
    }

    goToPrevMonth();
  }

  function goToCurrentPeriod() {
    goToToday();
  }

  function goToNextPeriod() {
    if (viewMode === "day") {
      moveSelectedDate(1);
      return;
    }

    if (viewMode === "fourDays") {
      moveSelectedDate(4);
      return;
    }

    if (viewMode === "week") {
      goToNextWeek();
      return;
    }

    if (viewMode === "year") {
      goToNextYear();
      return;
    }

    goToNextMonth();
  }

  async function createEvent() {
    setErrorMessage("");

    if (submitting) return;

    if (!selectedDate || !eventTitle.trim()) {
      setErrorMessage("日付と予定名を入力してください");
      return;
    }

    if (!eventAllDay && eventEndTime <= eventStartTime) {
      setErrorMessage("終了時刻は開始時刻より後にしてください");
      return;
    }

    const startAt = eventAllDay
      ? `${selectedDate}T00:00:00+09:00`
      : `${selectedDate}T${eventStartTime}:00+09:00`;

    const endAt = eventAllDay
      ? `${selectedDate}T23:59:59+09:00`
      : `${selectedDate}T${eventEndTime}:00+09:00`;

    setSubmitting(true);

    try {
      const newEvent = await createCalendarEvent({
        title: eventTitle,
        description: eventDescription,
        start_at: startAt,
        end_at: endAt,
        all_day: eventAllDay,
        color: eventColor,
      });

      setEvents((prev) => [...prev, newEvent]);
      closeModal();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "予定の作成に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateEvent() {
    setErrorMessage("");

    if (submitting) return;
    if (!editingEventId) return;

    if (!selectedDate || !eventTitle.trim()) {
      setErrorMessage("日付と予定名を入力してください");
      return;
    }

    if (!eventAllDay && eventEndTime <= eventStartTime) {
      setErrorMessage("終了時刻は開始時刻より後にしてください");
      return;
    }

    const startAt = eventAllDay
      ? `${selectedDate}T00:00:00+09:00`
      : `${selectedDate}T${eventStartTime}:00+09:00`;

    const endAt = eventAllDay
      ? `${selectedDate}T23:59:59+09:00`
      : `${selectedDate}T${eventEndTime}:00+09:00`;

    setSubmitting(true);

    try {
      const updatedEvent = await updateCalendarEvent(editingEventId, {
        title: eventTitle,
        description: eventDescription,
        start_at: startAt,
        end_at: endAt,
        all_day: eventAllDay,
        color: eventColor,
      });

      setEvents((prev) =>
        prev.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );

      closeModal();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "予定の更新に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id: number) {
    const ok = confirm("この予定を削除しますか？");

    if (!ok) return;
    if (deleting) return;

    setErrorMessage("");
    setDeleting(true);

    try {
      await deleteCalendarEvent(id);

      setEvents((prev) => prev.filter((event) => event.id !== id));

      if (editingEventId === id) {
        closeModal();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "予定の削除に失敗しました"));
    } finally {
      setDeleting(false);
    }
  }

  const weekLikeDayCount =
    viewMode === "day" ? 1 : viewMode === "fourDays" ? 4 : 7;

  const yearMonths = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthEvents = sortedEvents.filter((event) => {
      const eventDate = new Date(event.start_at);

      return (
        eventDate.getFullYear() === currentYear &&
        eventDate.getMonth() === monthIndex
      );
    });

    return {
      monthIndex,
      eventCount: monthEvents.length,
    };
  });

  return (
    <>
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header>
        <CalendarHeader
          currentYear={currentYear}
          currentMonth={currentMonth}
          //loading={loadingHolidays || loadingEvents}
          searchKeyword={searchKeyword}
          onChangeKeyword={setSearchKeyword}
          onClearKeyword={() => setSearchKeyword("")}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />


      </header>
      <nav>

      </nav>
      <main className="relative min-h-0 flex-1 overflow-hidden bg-teal-100/80 px-1">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col gap-2 lg:flex-row lg:gap-0 lg:justify-center">
      {isSidebarOpen && (
        <aside className="min-h-0 overflow-auto lg:basis-[30%] lg:shrink-0 lg:border-r lg:border-gray-200">
          <EventSearch
            searchKeyword={searchKeyword}
            totalCount={events.length}
                filteredCount={filteredEvents.length}
            onChangeKeyword={setSearchKeyword}
            onClear={() => setSearchKeyword("")}
          />

          <div className="mt-4">
            <SidebarCalendar
              calendarDays={calendarDays}
              holidayMap={holidayMap}
              todayString={todayString}
              selectedDate={selectedDate}
              onDateClick={selectDate}
            />
          </div>
        </aside>
      )}

            <section className="flex min-h-0 w-full flex-col bg-white p-2 shadow-sm sm:p-3 lg:basis-[70%] lg:shrink-0">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-md border border-gray-300 bg-gray-50 p-1">
              {VIEW_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={`shrink-0 rounded px-3 py-1.5 text-sm ${
                    viewMode === option.value
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevPeriod}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              前
            </button>
            <button
              type="button"
              onClick={goToCurrentPeriod}
              className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
            >
              今日
            </button>
            <button
              type="button"
              onClick={goToNextPeriod}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              次
            </button>
            </div>
          </div>

          {(viewMode === "day" ||
            viewMode === "week" ||
            viewMode === "fourDays") && (
            <WeekCalendarView
              selectedDate={selectedDate}
              dayCount={weekLikeDayCount}
              events={filteredEvents}
              holidayMap={holidayMap}
              todayString={todayString}
              editingEventId={editingEventId}
              onDateClick={openCreateModal}
              onEventClick={startEditEvent}
            />
          )}

          {viewMode === "month" && (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white p-3">
              <CalendarGrid
                calendarDays={calendarDays}
                holidayMap={holidayMap}
                eventMap={eventMap}
                todayString={todayString}
                editingEventId={editingEventId}
                onDateClick={openCreateModal}
                onEventClick={startEditEvent}
                onMoreEventsClick={openDayEventsModal}
              />
            </div>
          )}

          {viewMode === "year" && (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white p-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {yearMonths.map((month) => (
                  <button
                    key={month.monthIndex}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(month.monthIndex);
                      setSelectedDate(formatDate(currentYear, month.monthIndex, 1));
                      setViewMode("month");
                    }}
                    className="rounded-md border border-gray-200 bg-white p-4 text-left hover:bg-gray-50"
                  >
                    <span className="block text-lg font-semibold text-gray-900">
                      {month.monthIndex + 1}月
                    </span>
                    <span className="mt-2 block text-sm text-gray-600">
                      予定 {month.eventCount}件
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {viewMode === "schedule" && (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white">
              {sortedEvents.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  表示できる予定がありません。
                </div>
              ) : (
                <div className="divide-y">
                  {sortedEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => startEditEvent(event)}
                      className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="block text-sm font-semibold text-gray-900">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {event.start_at.slice(0, 10)}{" "}
                        {event.all_day ? "終日" : formatTime(event.start_at)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
            </section>
          </div>
          {/*
          <DayEventsModal
            isOpen={isDayEventsModalOpen}
            dateString={selectedDayEventsDate}
            events={selectedDayEvents}
            onClose={closeDayEventsModal}
            onEventClick={openEventFromDayEventsModal}
          />
          */}

          <EventModal
            isOpen={isModalOpen}
            editingEventId={editingEventId}
            selectedDate={selectedDate}
            eventTitle={eventTitle}
            eventDescription={eventDescription}
            eventStartTime={eventStartTime}
            eventEndTime={eventEndTime}
            eventAllDay={eventAllDay}
            eventColor={eventColor}
            errorMessage={errorMessage}
            submitting={submitting}
            deleting={deleting}
            onClose={closeModal}
            onCreate={createEvent}
            onUpdate={updateEvent}
            onDelete={deleteEvent}
            setSelectedDate={setSelectedDate}
            setEventTitle={setEventTitle}
            setEventDescription={setEventDescription}
            setEventStartTime={setEventStartTime}
            setEventEndTime={setEventEndTime}
            setEventAllDay={setEventAllDay}
            setEventColor={setEventColor}
          />
      </main>
    </div>
    </>
  );
}
