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

  // 画面上部の検索欄、サイドバー表示、表示モードを管理するUI状態
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");

  // カレンダーの日付移動、イベント取得、イベントフォーム、検索結果をそれぞれ専用hookに分離
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

  // サイドバーなどで使うイベント一覧は開始日時順に並べる
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) =>
      a.start_at.localeCompare(b.start_at)
    );
  }, [filteredEvents]);

  const weekLikeDayCount = 7;

  // 年間表示などに使えるよう、月ごとのイベント件数を集計する
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

  // 日付移動時は、編集中のモーダルを閉じてから移動する
  function runNavigation(action: () => void) {
    eventForm.closeModal();
    action();
  }

  // 現在の表示モードに合わせて、前の週または前の月へ移動する
  function goToPrevPeriod() {
    runNavigation(() => {

      if (viewMode === "week") {
        navigation.goToPrevWeek();
        return;
      }


      navigation.goToPrevMonth();
    });
  }

  // 現在の表示モードに合わせて、次の週または次の月へ移動する
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

              {/* サイドバーにはミニカレンダーと直近イベント一覧を表示する */}
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

          <section className="flex min-h-0 w-full flex-col bg-white p-1 shadow-sm sm:p-2 lg:basis-[70%] lg:shrink-0">
            {/* 表示モード切り替えと、前・今日・次の移動ボタン */}
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

            {/* 週表示 */}
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

            {/* 月表示。月表示は内容が大きくなるため、この領域だけスクロールさせる */}
            {viewMode === "month" && (
              <div className="calendar-month-panel">
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

        {/* イベント作成・編集・削除用モーダル */}
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