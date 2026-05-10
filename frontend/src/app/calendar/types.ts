export type Holiday = {
  id: number;
  date: string;
  name: string;
};

export type CalendarEvent = {
  id: number;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  color: string | null;
};

export type CalendarDay = {
  dateString: string | null;
  day: number | null;
  weekDay: number | null;
};