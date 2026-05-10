import type { CalendarEvent, Holiday } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

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

export async function fetchHolidays(
  year: number,
  month: number
): Promise<Holiday[]> {
  const res = await fetch(
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
  const res = await fetch(`${API_BASE_URL}/events?year=${year}&month=${month}`);

  if (!res.ok) {
    await handleApiError(res, "予定の取得に失敗しました");
  }

  return res.json();
}

export async function createCalendarEvent(
  payload: EventPayload
): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
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
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    await handleApiError(res, "予定の削除に失敗しました");
  }
}