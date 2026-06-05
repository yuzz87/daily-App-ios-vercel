import { apiFetch } from "@/lib/auth";
import type { CalendarEvent, Holiday } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// NEXT_PUBLIC_API_BASE_URL 未設定のときはローカル確認用のモックモード
const IS_MOCK_MODE = !API_BASE_URL;

type EventPayload = {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: string;
};

async function handleApiError(
  res: Response,
  fallbackMessage: string
): Promise<never> {
  try {
    const data = await res.json();

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors.join("\n"));
    }

    if (typeof data.error === "string") {
      throw new Error(data.error);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message !== "Unexpected end of JSON input"
    ) {
      throw error;
    }
  }

  throw new Error(fallbackMessage);
}

// === モックストア =====================================================
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function buildLocalDateTime(
  daysFromToday: number,
  hour: number,
  minute = 0
): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(hour)}:${pad2(minute)}:00`
  );
}

let mockNextEventId = 9000;
const mockEvents: CalendarEvent[] = IS_MOCK_MODE
  ? [
      {
        id: mockNextEventId++,
        title: "朝会",
        description: "デイリースクラム",
        start_at: buildLocalDateTime(0, 9, 0),
        end_at: buildLocalDateTime(0, 9, 30),
        all_day: false,
        color: "#3b82f6",
      },
      {
        id: mockNextEventId++,
        title: "ランチ",
        description: null,
        start_at: buildLocalDateTime(0, 12, 0),
        end_at: buildLocalDateTime(0, 13, 0),
        all_day: false,
        color: "#10b981",
      },
      {
        id: mockNextEventId++,
        title: "1on1",
        description: null,
        start_at: buildLocalDateTime(1, 15, 0),
        end_at: buildLocalDateTime(1, 15, 30),
        all_day: false,
        color: "#f59e0b",
      },
      {
        id: mockNextEventId++,
        title: "勉強会",
        description: null,
        start_at: buildLocalDateTime(2, 19, 0),
        end_at: buildLocalDateTime(2, 20, 30),
        all_day: false,
        color: "#8b5cf6",
      },
      {
        id: mockNextEventId++,
        title: "病院",
        description: null,
        start_at: buildLocalDateTime(3, 10, 0),
        end_at: buildLocalDateTime(3, 11, 0),
        all_day: false,
        color: "#ef4444",
      },
    ]
  : [];

function getEventDateString(event: CalendarEvent): string {
  return event.start_at.slice(0, 10);
}

function filterMockEventsByMonth(
  year: number,
  month: number
): CalendarEvent[] {
  const targetPrefix = `${year}-${pad2(month)}`;
  return mockEvents.filter((event) =>
    getEventDateString(event).startsWith(targetPrefix)
  );
}

function logMockMode(action: string): void {
  if (typeof window !== "undefined") {
    console.info(`[calendar:mock] ${action}`);
  }
}
// ====================================================================

export async function fetchHolidays(
  year: number,
  month: number
): Promise<Holiday[]> {
  if (IS_MOCK_MODE) {
    logMockMode(`fetchHolidays ${year}-${pad2(month)}`);
    return [];
  }

  const res = await apiFetch(
    `${API_BASE_URL}/holidays?year=${year}&month=${month}`
  );

  if (!res.ok) {
    await handleApiError(res, "祝日の取得に失敗しました");
  }

  return res.json();
}

export async function fetchEvents(
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  if (IS_MOCK_MODE) {
    logMockMode(`fetchEvents ${year}-${pad2(month)}`);
    return filterMockEventsByMonth(year, month);
  }

  const res = await apiFetch(`${API_BASE_URL}/events?year=${year}&month=${month}`);

  if (!res.ok) {
    await handleApiError(res, "予定の取得に失敗しました");
  }

  return res.json();
}

export async function createCalendarEvent(
  payload: EventPayload
): Promise<CalendarEvent> {
  if (IS_MOCK_MODE) {
    const created: CalendarEvent = {
      id: mockNextEventId++,
      title: payload.title,
      description: payload.description || null,
      start_at: payload.start_at,
      end_at: payload.end_at || null,
      all_day: payload.all_day,
      color: payload.color || null,
    };
    mockEvents.push(created);
    logMockMode(`createCalendarEvent id=${created.id}`);
    return created;
  }

  const res = await apiFetch(`${API_BASE_URL}/events`, {
    method: "POST",
    body: JSON.stringify({
      event: payload,
    }),
  });

  if (!res.ok) {
    await handleApiError(res, "予定の作成に失敗しました");
  }

  return res.json();
}

export async function updateCalendarEvent(
  id: number,
  payload: EventPayload
): Promise<CalendarEvent> {
  if (IS_MOCK_MODE) {
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index < 0) throw new Error("予定が見つかりません");

    const updated: CalendarEvent = {
      id,
      title: payload.title,
      description: payload.description || null,
      start_at: payload.start_at,
      end_at: payload.end_at || null,
      all_day: payload.all_day,
      color: payload.color || null,
    };
    mockEvents[index] = updated;
    logMockMode(`updateCalendarEvent id=${id}`);
    return updated;
  }

  const res = await apiFetch(`${API_BASE_URL}/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      event: payload,
    }),
  });

  if (!res.ok) {
    await handleApiError(res, "予定の更新に失敗しました");
  }

  return res.json();
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  if (IS_MOCK_MODE) {
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index >= 0) mockEvents.splice(index, 1);
    logMockMode(`deleteCalendarEvent id=${id}`);
    return;
  }

  const res = await apiFetch(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    await handleApiError(res, "予定の削除に失敗しました");
  }
}
