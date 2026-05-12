const EVENT_COLORS = [
  { label: "レッド", value: "#f28b82" },
  { label: "ピンク", value: "#fdcfe8" },
  { label: "パープル", value: "#d7aefb" },
  { label: "ブルー", value: "#aecbfa" },
  { label: "スカイブルー", value: "#cbf0f8" },
  { label: "グリーン", value: "#ccff90" },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-3 sm:items-center">
      <div className="my-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold text-gray-800">
            {editingEventId ? "予定を編集" : "予定を追加"}
          </h2>

          <button
            onClick={onClose}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* 本文 */}
        <div className="space-y-5 px-5 py-5">
          {errorMessage && (
            <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* 予定名 */}
          <input
            type="text"
            value={eventTitle}
            disabled={disabled}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="タイトルを追加"
            className="w-full border-b px-1 py-2 text-xl outline-none placeholder:text-gray-400 focus:border-blue-500 disabled:bg-white disabled:opacity-60"
          />

          {/* 日付・時間 */}
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={selectedDate}
                disabled={disabled}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="min-h-10 rounded-md border px-3 py-2 text-sm disabled:bg-gray-100"
              />

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

          {/* 色 */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">色</p>

            <div className="flex flex-wrap gap-3">
              {EVENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  disabled={disabled}
                  onClick={() => setEventColor(color.value)}
                  className={`h-7 w-7 rounded-full border-2 disabled:opacity-50 ${
                    eventColor === color.value
                      ? "border-gray-900 ring-2 ring-gray-300"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          {/* メモ */}
          <textarea
            value={eventDescription}
            disabled={disabled}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="説明を追加"
            className="h-28 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* フッター */}
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
              {editingEventId
                ? submitting
                  ? "保存中..."
                  : "保存"
                : submitting
                  ? "追加中..."
                  : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}