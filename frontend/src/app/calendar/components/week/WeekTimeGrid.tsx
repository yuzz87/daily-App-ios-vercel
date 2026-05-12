import { DAY_HEIGHT, HOUR_HEIGHT } from "./timeGrid";

type WeekTimeGridProps = {
  labels: string[];
};

export default function WeekTimeGrid({ labels }: WeekTimeGridProps) {
  return (
    <div style={{ minHeight: DAY_HEIGHT }}>
      {labels.map((time) => (
        <div
          key={time}
          className="border-b px-2 pt-0.5 text-right text-[11px] text-gray-500"
          style={{ height: HOUR_HEIGHT }}
        >
          {time}
        </div>
      ))}
    </div>
  );
}
