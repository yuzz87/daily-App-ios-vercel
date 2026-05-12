import type { CalendarDay, CalendarEvent } from "../types";

// 画面サイズごとに、カレンダー上に表示する予定の最大件数を設定
const MAX_VISIBLE_EVENTS_DESKTOP = 1;
const MAX_VISIBLE_EVENTS_MOBILE = 1;

// CalendarGrid が親コンポーネントから受け取るデータと関数の型
type CalendarGridProps = {
  calendarDays: CalendarDay[];
  holidayMap: Map<string, string>;
  eventMap: Map<string, CalendarEvent[]>;
  todayString: string;
  editingEventId: number | null;
  onDateClick: (dateString: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onMoreEventsClick: (dateString: string, events: CalendarEvent[]) => void;
};

export default function CalendarGrid({
  calendarDays,
  holidayMap,
  eventMap,
  todayString,
  editingEventId,
  onDateClick,
  onEventClick,
  onMoreEventsClick,
}: CalendarGridProps) {
  return (
    <>
      {/* 曜日ヘッダーを7列で表示 */}
      <div className="grid grid-cols-7">
        {["日", "月", "火", "水", "木", "金", "土"].map((week) => (
          <div
            key={week}
            className="text-center text-xs font-bold "
          >
            {week}
          </div>
        ))}
      </div>

      {/* カレンダーの日付部分を7列のグリッドで表示 */}
      <div className="grid grid-cols-7 border-l border-t">
        {calendarDays.map((calendarDay, index) => {
          // 日付がない場合は、月初・月末の空白マスを表示
          if (!calendarDay.dateString) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-20 border-b"
              />
            );
          }

          // その日の祝日名と予定一覧を取得
          const holidayName = holidayMap.get(calendarDay.dateString);
          const dayEvents = eventMap.get(calendarDay.dateString) || [];

          // スマホ・PCそれぞれで表示する予定を制限
          const visibleEventsMobile = dayEvents.slice(
            0,
            MAX_VISIBLE_EVENTS_MOBILE
          );
          const visibleEventsDesktop = dayEvents.slice(
            0,
            MAX_VISIBLE_EVENTS_DESKTOP
          );

          // 表示しきれない予定の件数を計算
          const hiddenEventCountMobile =
            dayEvents.length - visibleEventsMobile.length;
          const hiddenEventCountDesktop =
            dayEvents.length - visibleEventsDesktop.length;

          // 日曜・土曜・祝日・今日かどうかを判定
          const isSunday = calendarDay.weekDay === 0;
          const isSaturday = calendarDay.weekDay === 6;
          const isHoliday = Boolean(holidayName);
          const isToday = calendarDay.dateString === todayString;

          return (
            <div
              key={calendarDay.dateString}
              onClick={() => onDateClick(calendarDay.dateString!)}
              className={`min-h-20 cursor-pointer border-b p-1 hover:bg-[#9e9eff]/30 sm:min-h-28 ${
                isHoliday ? "bg-red-50" : ""
              } ${isToday ? "ring-2 ring-blue-400" : ""}`}
            >
              {/* 日付の数字を表示し、曜日や祝日に応じて色を変更 */}
              <div
                className={`mb-0.5 text-xs font-bold sm:mb-1 sm:text-base ${
                  isSunday || isHoliday
                    ? "text-red-500"
                    : isSaturday
                      ? "text-blue-500"
                      : "text-gray-800"
                }`}
              >
                {calendarDay.day}
              </div>

              {/* 祝日の場合は祝日名を表示 */}
              {holidayName && (
                <div
                  className="truncate rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-600 sm:px-2 sm:py-1 sm:text-xs"
                  title={holidayName}
                >
                  {holidayName}
                </div>
              )}

              {/* スマホ用の予定表示 */}
              <div className="mt-1 space-y-1 sm:hidden">
                {visibleEventsMobile.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] text-white opacity-90 hover:opacity-100 ${
                      editingEventId === event.id ? "ring-2 ring-gray-800" : ""
                    }`}
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                    title={event.description || "クリックで編集"}
                  >
                    {event.title}
                  </button>
                ))}

                {/* スマホで表示しきれない予定がある場合、残り件数を表示 */}
                {hiddenEventCountMobile > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreEventsClick(calendarDay.dateString!, dayEvents);
                    }}
                    className="block w-full rounded bg-gray-100 px-1 py-0.5 text-left text-[10px] text-gray-600 hover:bg-gray-200"
                  >
                    +{hiddenEventCountMobile}件
                  </button>
                )}
              </div>

              {/* PC・タブレット用の予定表示 */}
              <div className="mt-2 hidden space-y-1 sm:block">
                {visibleEventsDesktop.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs text-white opacity-90 hover:opacity-100 ${
                      editingEventId === event.id ? "ring-2 ring-gray-800" : ""
                    }`}
                    style={{ backgroundColor: event.color || "#3b82f6" }}
                    title={event.description || "クリックで編集"}
                  >
                    {event.title}
                  </button>
                ))}

                {/* PCで表示しきれない予定がある場合、残り件数を表示 */}
                {hiddenEventCountDesktop > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreEventsClick(calendarDay.dateString!, dayEvents);
                    }}
                    className="block w-full rounded bg-gray-100 px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-200"
                  >
                    +{hiddenEventCountDesktop}件
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}