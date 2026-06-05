type DayHeaderCellVariant = "month" | "week";

type DayHeaderCellProps = {
  dateString: string;
  day: number;
  weekDay: number;
  holidayName?: string;
  todayString: string;
  variant: DayHeaderCellVariant;
  onDateClick: (dateString: string) => void;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function DayHeaderCell({
  dateString,
  day,
  weekDay,
  holidayName,
  todayString,
  variant,
  onDateClick,
}: DayHeaderCellProps) {
  const isSunday = weekDay === 0;
  const isSaturday = weekDay === 6;
  const isHoliday = Boolean(holidayName);
  const isToday = dateString === todayString;
  const dayColorClass =
    isSunday || isHoliday
      ? "text-red-500"
      : isSaturday
        ? "text-blue-500"
        : "text-gray-800";

  if (variant === "week") {
    return (
      <button
        type="button"
        onClick={() => onDateClick(dateString)}
        className={`h-full rounded px-1 py-1 text-center hover:bg-[#9e9eff]/30 ${
          isToday ? "bg-blue-50" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-start gap-0.5">
          <span className={`text-[11px] font-medium ${dayColorClass}`}>
            {WEEK_LABELS[weekDay]}
          </span>
          <span
            className={`block text-base font-semibold leading-none ${
              isToday ? "text-blue-700" : dayColorClass
            }`}
          >
            {day}
          </span>
        </div>

        {holidayName && (
          <div className="truncate text-xs text-red-600" title={holidayName}>
            {holidayName}
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onDateClick(dateString)}
      className={`relative min-h-28 border-b border-r text-center hover:bg-[#9e9eff]/30 ${
        isHoliday ? "bg-red-50" : "bg-white"
      } ${isToday ? "ring-2 ring-inset ring-blue-400" : ""}`}
    >
      <div className="absolute left-0 top-0 flex w-full flex-col items-center px-1">
        <span
          className={`block leading-none text-xs font-bold sm:text-base ${dayColorClass}`}
        >
          {day}
        </span>

        {holidayName && (
          <span
            className="mt-0.5 block max-w-full truncate rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-600 sm:text-xs"
            title={holidayName}
          >
            {holidayName}
          </span>
        )}
      </div>
    </button>
  );
}
