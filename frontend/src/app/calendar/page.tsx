"use client";

import { useMemo, useState } from "react";

import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation";
import { useEventForm } from "./hooks/useEventForm";
import { useFilteredEvents } from "./hooks/useFilteredEvents";
import EventModal from "./components/modals/EventModal";
import CalendarGrid from "./components/month/CalendarGrid";
import CalendarHeader from "./components/navigation/CalendarHeader";
import SidebarCalendar from "./components/navigation/SidebarCalendar";
import SidebarUpcomingEvents from "./components/navigation/SidebarUpcomingEvents";
import WeekCalendarView from "./components/week/WeekCalendarView";

type CalendarViewMode = "week" | "month";

const VIEW_MODE_OPTIONS: { label: string; value: CalendarViewMode }[] = [
  { label: "週", value: "week" },
  { label: "月", value: "month" },
];

export default function CalendarPage() {
  const today = new Date();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");

  const navigation = useCalendarNavigation(today);
  const { events, setEvents, holidayMap } = useCalendarEvents(
    navigation.currentYear,
    navigation.currentMonth
  );
  const eventForm = useEventForm({
    selectedDate: navigation.selectedDate,
    setSelectedDate: navigation.setSelectedDate,
    setEvents,
  });
  const filteredEvents = useFilteredEvents(events, searchKeyword);
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) =>
      a.start_at.localeCompare(b.start_at)
    );
  }, [filteredEvents]);

  const weekLikeDayCount = 7;
  const yearMonths = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthEvents = sortedEvents.filter((event) => {
      const eventDate = new Date(event.start_at);

      return (
        eventDate.getFullYear() === navigation.currentYear &&
        eventDate.getMonth() === monthIndex
      );
    });

    return {
      monthIndex,
      eventCount: monthEvents.length,
    };
  });

  function runNavigation(action: () => void) {
    eventForm.closeModal();
    action();
  }

  function goToPrevPeriod() {
    runNavigation(() => {

      if (viewMode === "week") {
        navigation.goToPrevWeek();
        return;
      }


      navigation.goToPrevMonth();
    });
  }

  function goToNextPeriod() {
    runNavigation(() => {

      if (viewMode === "week") {
        navigation.goToNextWeek();
        return;
      }


      navigation.goToNextMonth();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header>
        <CalendarHeader
          currentYear={navigation.currentYear}
          currentMonth={navigation.currentMonth}
          searchKeyword={searchKeyword}
          onChangeKeyword={setSearchKeyword}
          onClearKeyword={() => setSearchKeyword("")}
          onPrevMonth={() => runNavigation(navigation.goToPrevMonth)}
          onNextMonth={() => runNavigation(navigation.goToNextMonth)}
          onToday={() => runNavigation(navigation.goToToday)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onCreateEvent={() => eventForm.openCreateModal(navigation.selectedDate)}
        />
      </header>

      <main className="calendar-main">
        <div className="calendar-layout">
          {isSidebarOpen && (
            <aside className="min-h-0 overflow-auto lg:basis-[30%] lg:shrink-0 lg:border-r lg:border-gray-200">

              <div className="mt-4">
                <SidebarCalendar
                  calendarDays={navigation.calendarDays}
                  events={events}
                  holidayMap={holidayMap}
                  todayString={navigation.todayString}
                  selectedDate={navigation.selectedDate}
                  onDateClick={navigation.selectDate}
                />
              </div>
              <div className="mt-3">
                <SidebarUpcomingEvents
                  events={events}
                  todayString={navigation.todayString}
                  onEventClick={eventForm.startEditEvent}
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
                  onClick={() => runNavigation(navigation.goToToday)}
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

            {(viewMode === "week") && (
              <WeekCalendarView
                selectedDate={navigation.selectedDate}
                dayCount={weekLikeDayCount}
                events={filteredEvents}
                holidayMap={holidayMap}
                todayString={navigation.todayString}
                editingEventId={eventForm.editingEventId}
                onDateClick={eventForm.openCreateModal}
                onEventClick={eventForm.startEditEvent}
              />
            )}

            {viewMode === "month" && (
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-white p-3">
                <CalendarGrid
                  calendarDays={navigation.calendarDays}
                  holidayMap={holidayMap}
                  events={filteredEvents}
                  todayString={navigation.todayString}
                  editingEventId={eventForm.editingEventId}
                  onDateClick={eventForm.openCreateModal}
                  onEventClick={eventForm.startEditEvent}
                />
              </div>
            )}


          </section>
        </div>

        <EventModal
          isOpen={eventForm.isModalOpen}
          editingEventId={eventForm.editingEventId}
          selectedDate={navigation.selectedDate}
          eventTitle={eventForm.eventTitle}
          eventDescription={eventForm.eventDescription}
          eventStartTime={eventForm.eventStartTime}
          eventEndDate={eventForm.eventEndDate}
          eventEndTime={eventForm.eventEndTime}
          eventAllDay={eventForm.eventAllDay}
          eventColor={eventForm.eventColor}
          errorMessage={eventForm.errorMessage}
          submitting={eventForm.submitting}
          deleting={eventForm.deleting}
          onClose={eventForm.closeModal}
          onCreate={eventForm.createEvent}
          onUpdate={eventForm.updateEvent}
          onDelete={eventForm.deleteEvent}
          setSelectedDate={navigation.setSelectedDate}
          setEventTitle={eventForm.setEventTitle}
          setEventDescription={eventForm.setEventDescription}
          setEventStartTime={eventForm.setEventStartTime}
          setEventEndDate={eventForm.setEventEndDate}
          setEventEndTime={eventForm.setEventEndTime}
          setEventAllDay={eventForm.setEventAllDay}
          setEventColor={eventForm.setEventColor}
        />
      </main>
    </div>
  );
}
