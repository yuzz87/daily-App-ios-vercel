/** 祝日APIから取得する祝日情報 */
export type Holiday = {
  id: number;
  /** YYYY-MM-DD */
  date: string;
  name: string;
};

/** カレンダーに表示・作成・編集する予定情報 */
export type CalendarEvent = {
  id: number;
  title: string;
  description: string | null;
  /** ISO 8601 datetime string */
  start_at: string;
  /** ISO 8601 datetime string. null の場合は start_at と同じ日付として扱う */
  end_at: string | null;
  all_day: boolean;
  color: string | null;
};

/** カレンダーの表示モード（週 / 月） */
export type CalendarViewMode = "week" | "month";

/** 月表示カレンダーの1日セル。月初・月末の空白セルも含む */
export type CalendarDay = {
  /** YYYY-MM-DD。空白セルでは null */
  dateString: string | null;
  day: number | null;
  /** 0 = Sunday, 6 = Saturday。空白セルでは null */
  weekDay: number | null;
};