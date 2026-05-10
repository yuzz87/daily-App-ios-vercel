const EVENT_COLORS = [
  { label: "青", value: "#3b82f6" },
  { label: "緑", value: "#22c55e" },
  { label: "赤", value: "#ef4444" },
  { label: "黄", value: "#eab308" },
  { label: "紫", value: "#8b5cf6" },
  { label: "桃", value: "#ec4899" },
];

type EventModalProps = {
  isOpen: boolean;
  editingEventId: number | null;
  selectedDate: string;
  eventTitle: string;
  eventDescription: string;
  eventStartTime: string;
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
  setEventEndTime,
  setEventAllDay,
  setEventColor,
}: EventModalProps) {
  if (!isOpen) return null;

  const disabled = submitting || deleting;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:items-center sm:p-4">
      <div className="my-4 w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold sm:text-xl">
            {editingEventId ? "予定を編集" : "予定を追加"}
          </h2>

          <button
            onClick={onClose}
            disabled={disabled}
            className="min-h-10 rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            閉じる
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 whitespace-pre-line rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label className="mb-1 block text-sm font-bold">日付</label>
            <input
              type="date"
              value={selectedDate}
              disabled={disabled}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="min-h-11 w-full rounded border px-3 py-2 text-base disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">予定名</label>
            <input
              type="text"
              value={eventTitle}
              disabled={disabled}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="例：授業"
              className="min-h-11 w-full rounded border px-3 py-2 text-base disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          <div className="flex items-end">
            <label className="flex min-h-11 w-full items-center gap-2 rounded border px-3 py-2 sm:w-auto">
              <input
                type="checkbox"
                checked={eventAllDay}
                disabled={disabled}
                onChange={(e) => setEventAllDay(e.target.checked)}
                className="h-5 w-5"
              />
              <span className="text-sm font-bold">終日</span>
            </label>
          </div>

          {!eventAllDay && (
            <>
              <div>
                <label className="mb-1 block text-sm font-bold">開始</label>
                <input
                  type="time"
                  value={eventStartTime}
                  disabled={disabled}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="min-h-11 w-full rounded border px-3 py-2 text-base disabled:bg-gray-100 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">終了</label>
                <input
                  type="time"
                  value={eventEndTime}
                  disabled={disabled}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="min-h-11 w-full rounded border px-3 py-2 text-base disabled:bg-gray-100 sm:text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-bold">メモ</label>
          <textarea
            value={eventDescription}
            disabled={disabled}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="予定の詳細メモ"
            className="h-28 w-full rounded border px-3 py-2 text-base disabled:bg-gray-100 sm:h-24 sm:text-sm"
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-bold">色</label>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {EVENT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                disabled={disabled}
                onClick={() => setEventColor(color.value)}
                className={`min-h-10 rounded border px-3 py-2 text-sm disabled:opacity-50 ${
                  eventColor === color.value ? "ring-2 ring-gray-800" : ""
                }`}
                style={{
                  backgroundColor: color.value,
                  color: "white",
                }}
              >
                {color.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {editingEventId ? (
            <>
              <button
                onClick={onUpdate}
                disabled={disabled}
                className="min-h-11 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              >
                {submitting ? "更新中..." : "更新"}
              </button>

              <button
                onClick={() => onDelete(editingEventId)}
                disabled={disabled}
                className="min-h-11 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>

              <button
                onClick={onClose}
                disabled={disabled}
                className="min-h-11 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
              >
                キャンセル
              </button>
            </>
          ) : (
            <button
              onClick={onCreate}
              disabled={disabled}
              className="min-h-11 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "追加中..." : "追加"}
            </button>
          )}
        </div>

        {selectedDate && (
          <p className="mt-3 text-sm text-gray-700">
            選択中の日付：<span className="font-bold">{selectedDate}</span>
          </p>
        )}
      </div>
    </div>
  );
}