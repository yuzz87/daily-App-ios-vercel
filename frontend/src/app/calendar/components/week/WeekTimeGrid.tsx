type WeekTimeGridProps = {
  labels: string[];
};

export default function WeekTimeGrid({ labels }: WeekTimeGridProps) {
  return (
    <div className="min-h-[1536px]">
      {labels.map((time) => (
        <div
          key={time}
          className="h-16 border-b px-2 pt-1 text-right text-[11px] text-gray-500"
        >
          {time}
        </div>
      ))}
    </div>
  );
}
