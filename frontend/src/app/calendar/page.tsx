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
import DayEventsModal from "./components/DayEventsModal";
import EventModal from "./components/EventModal";
import EventSearch from "./components/EventSearch";
import type { CalendarDay, CalendarEvent, Holiday } from "./types";

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

  const [selectedDate, setSelectedDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventColor, setEventColor] = useState("#3b82f6");

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  

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
      const date = event.start_at.slice(0, 10);

      if (!map.has(date)) {
        map.set(date, []);
      }

      map.get(date)?.push(event);
    });

    return map;
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

  function openDayEventsModal(dateString: string, dayEvents: CalendarEvent[]) {
    setSelectedDayEventsDate(dateString);
    setSelectedDayEvents(dayEvents);
    setIsDayEventsModalOpen(true);
  }

  function closeDayEventsModal() {
    setIsDayEventsModalOpen(false);
    setSelectedDayEventsDate("");
    setSelectedDayEvents([]);
  }

  function openEventFromDayEventsModal(event: CalendarEvent) {
    closeDayEventsModal();
    startEditEvent(event);
  }

  function goToPrevMonth() {
    const newDate = new Date(currentYear, currentMonth - 1, 1);

    setCurrentYear(newDate.getFullYear());
    setCurrentMonth(newDate.getMonth());
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

  return (
    <>
    <header>
      <CalendarHeader
        currentYear={currentYear}
        currentMonth={currentMonth}
        loading={loadingHolidays || loadingEvents}
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
    <main className="min-h-screen bg-slate-100 px-2 py-3 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
      {isSidebarOpen && (
        <aside className="lg:w-64 lg:shrink-0">
          <EventSearch
            searchKeyword={searchKeyword}
            totalCount={events.length}
            filteredCount={filteredEvents.length}
            onChangeKeyword={setSearchKeyword}
            onClear={() => setSearchKeyword("")}
          />
        </aside>
      )}

        <section className="rounded-2xl bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4">
          </div>



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
        </section>

        <DayEventsModal
          isOpen={isDayEventsModalOpen}
          dateString={selectedDayEventsDate}
          events={selectedDayEvents}
          onClose={closeDayEventsModal}
          onEventClick={openEventFromDayEventsModal}
        />

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
      </div>
    </main>
    </>
  );
}