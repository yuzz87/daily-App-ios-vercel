type EventDateFieldsProps = {
  selectedDate: string;
  eventStartTime: string;
  eventEndDate: string;
  eventEndTime: string;
  eventAllDay: boolean;
  disabled: boolean;
  setSelectedDate: (value: string) => void;
  setEventStartTime: (value: string) => void;
  setEventEndDate: (value: string) => void;
  setEventEndTime: (value: string) => void;
  setEventAllDay: (value: boolean) => void;
};

export default function EventDateFields({
  selectedDate,
  eventStartTime,
  eventEndDate,
  eventEndTime,
  eventAllDay,
  disabled,
  setSelectedDate,
  setEventStartTime,
  setEventEndDate,
  setEventEndTime,
  setEventAllDay,
}: EventDateFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="date"
          value={selectedDate}
          disabled={disabled}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            if (eventEndDate < e.target.value) {
              setEventEndDate(e.target.value);
            }
          }}
          className="min-h-10 rounded-md border px-3 py-2 text-sm disabled:bg-gray-100"
        />

        {eventAllDay && (
          <>
            <span className="hidden text-gray-500 sm:inline">-</span>

            <input
              type="date"
              value={eventEndDate}
              disabled={disabled}
              min={selectedDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              className="min-h-10 rounded-md border px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </>
        )}

        {!eventAllDay && (
          <>
            <input
              type="time"
              value={eventStartTime}
              disabled={disabled}
              onChange={(e) => setEventStartTime(e.target.value)}
              className="min-h-10 rounded-md border px-3 py-2 text-sm disabled:bg-gray-100"
            />

            <span className="hidden text-gray-500 sm:inline">〜</span>

            <input
              type="date"
              value={eventEndDate}
              disabled={disabled}
              min={selectedDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              className="min-h-10 rounded-md border px-3 py-2 text-sm disabled:bg-gray-100"
            />

            <input
              type="time"
              value={eventEndTime}
              disabled={disabled}
              onChange={(e) => setEventEndTime(e.target.value)}
              className="min-h-10 rounded-md border px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </>
        )}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={eventAllDay}
          disabled={disabled}
          onChange={(e) => setEventAllDay(e.target.checked)}
          className="h-4 w-4"
        />
        終日
      </label>
    </div>
  );
}
