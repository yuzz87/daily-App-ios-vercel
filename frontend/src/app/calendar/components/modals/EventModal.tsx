import EventColorPicker from "./EventColorPicker";
import EventDateFields from "./EventDateFields";

type EventModalProps = {
  isOpen: boolean;
  editingEventId: number | null;
  selectedDate: string;
  eventTitle: string;
  eventDescription: string;
  eventStartTime: string;
  eventEndDate: string;
  eventEndTime: string;
  eventAllDay: boolean;
  eventColor: string;
  errorMessage: string;
  submitting: boolean;
  deleting: boolean;
  onClose: () => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
  setSelectedDate: (value: string) => void;
  setEventTitle: (value: string) => void;
  setEventDescription: (value: string) => void;
  setEventStartTime: (value: string) => void;
  setEventEndDate: (value: string) => void;
  setEventEndTime: (value: string) => void;
  setEventAllDay: (value: boolean) => void;
  setEventColor: (value: string) => void;
};

export default function EventModal({
  isOpen,
  editingEventId,
  selectedDate,
  eventTitle,
  eventDescription,
  eventStartTime,
  eventEndDate,
  eventEndTime,
  eventAllDay,
  eventColor,
  errorMessage,
  submitting,
  deleting,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  setSelectedDate,
  setEventTitle,
  setEventDescription,
  setEventStartTime,
  setEventEndDate,
  setEventEndTime,
  setEventAllDay,
  setEventColor,
}: EventModalProps) {
  if (!isOpen) return null;

  const disabled = submitting || deleting;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-3 sm:items-center">
      <div className="my-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold text-gray-800">
            {editingEventId ? "予定を編集" : "予定を追加"}
          </h2>

          <button
            onClick={onClose}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            x
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {errorMessage && (
            <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <input
            type="text"
            value={eventTitle}
            disabled={disabled}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="タイトルを追加"
            className="w-full border-b px-1 py-2 text-xl outline-none placeholder:text-gray-400 focus:border-blue-500 disabled:bg-white disabled:opacity-60"
          />

          <EventDateFields
            selectedDate={selectedDate}
            eventStartTime={eventStartTime}
            eventEndDate={eventEndDate}
            eventEndTime={eventEndTime}
            eventAllDay={eventAllDay}
            disabled={disabled}
            setSelectedDate={setSelectedDate}
            setEventStartTime={setEventStartTime}
            setEventEndDate={setEventEndDate}
            setEventEndTime={setEventEndTime}
            setEventAllDay={setEventAllDay}
          />

          <EventColorPicker
            eventColor={eventColor}
            disabled={disabled}
            setEventColor={setEventColor}
          />

          <textarea
            value={eventDescription}
            disabled={disabled}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="説明を追加"
            className="h-28 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <div>
            {editingEventId && (
              <button
                onClick={() => onDelete(editingEventId)}
                disabled={disabled}
                className="rounded-md px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={disabled}
              className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              キャンセル
            </button>

            <button
              onClick={editingEventId ? onUpdate : onCreate}
              disabled={disabled}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
