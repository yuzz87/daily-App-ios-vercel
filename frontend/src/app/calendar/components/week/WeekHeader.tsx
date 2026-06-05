import DayHeaderCell from "../shared/DayHeaderCell";

type WeekDay = {
  dateString: string;
  day: number;
  weekDay: number;
};

type WeekHeaderProps = {
  weekDays: WeekDay[];
  holidayMap: Map<string, string>;
  todayString: string;
  dayCount: number;
  onDateClick: (dateString: string) => void;
};

export default function WeekHeader({
  weekDays,
  holidayMap,
  todayString,
  dayCount,
  onDateClick,
}: WeekHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-white pb-2">
      <div
        className="grid gap-x-1"
        style={{
          gridTemplateColumns: `repeat(${dayCount}, minmax(96px, 1fr))`,
        }}
      >
        {weekDays.map((weekDay) => (
          <DayHeaderCell
            key={weekDay.dateString}
            dateString={weekDay.dateString}
            day={weekDay.day}
            weekDay={weekDay.weekDay}
            holidayName={holidayMap.get(weekDay.dateString)}
            todayString={todayString}
            variant="week"
            onDateClick={onDateClick}
          />
        ))}
      </div>
    </div>
  );
}
