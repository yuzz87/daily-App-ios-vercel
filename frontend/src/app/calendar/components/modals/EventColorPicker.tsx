const EVENT_COLORS = [
  { label: "レッド", value: "#f28b82" },
  { label: "ピンク", value: "#fdcfe8" },
  { label: "パープル", value: "#d7aefb" },
  { label: "ブルー", value: "#aecbfa" },
  { label: "スカイブルー", value: "#cbf0f8" },
  { label: "グリーン", value: "#ccffcc" },
];

type EventColorPickerProps = {
  eventColor: string;
  disabled: boolean;
  setEventColor: (value: string) => void;
};

export default function EventColorPicker({
  eventColor,
  disabled,
  setEventColor,
}: EventColorPickerProps) {
  return (
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
  );
}
