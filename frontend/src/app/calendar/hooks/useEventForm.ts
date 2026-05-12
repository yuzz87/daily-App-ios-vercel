import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "../api";
import type { CalendarEvent } from "../types";
import { formatDateFromDateTime, formatTime } from "../utils/date";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

type UseEventFormProps = {
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
};

export function useEventForm({
  selectedDate,
  setSelectedDate,
  setEvents,
}: UseEventFormProps) {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndDate, setEventEndDate] = useState(selectedDate);
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventColor, setEventColor] = useState("#3b82f6");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function resetEventForm(dateString = selectedDate) {
    setEditingEventId(null);
    setEventTitle("");
    setEventDescription("");
    setEventStartTime("09:00");
    setEventEndDate(dateString);
    setEventEndTime("10:00");
    setEventAllDay(false);
    setEventColor("#aecbfa");
  }

  function closeModal() {
    setIsModalOpen(false);
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    resetEventForm();
  }

  function openCreateModal(dateString: string) {
    resetEventForm(dateString);
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setSelectedDate(dateString);
    setEventEndDate(dateString);
    setIsModalOpen(true);
  }

  function startEditEvent(event: CalendarEvent) {
    setErrorMessage("");
    setSubmitting(false);
    setDeleting(false);
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description || "");
    setSelectedDate(formatDateFromDateTime(event.start_at));
    setEventEndDate(formatDateFromDateTime(event.end_at || event.start_at));
    setEventAllDay(event.all_day);
    setEventColor(event.color || "#3b82f6");

    if (event.all_day) {
      setEventStartTime("09:00");
      setEventEndTime("10:00");
      setIsModalOpen(true);
      return;
    }

    setEventStartTime(formatTime(event.start_at));
    setEventEndTime(event.end_at ? formatTime(event.end_at) : formatTime(event.start_at));
    setIsModalOpen(true);
  }

  function validateEventForm() {
    if (!selectedDate || !eventEndDate || !eventTitle.trim()) {
      setErrorMessage("日付と予定名を入力してください");
      return false;
    }

    if (
      (eventAllDay && eventEndDate < selectedDate) ||
      (!eventAllDay &&
        `${eventEndDate}T${eventEndTime}` <= `${selectedDate}T${eventStartTime}`)
    ) {
      setErrorMessage("終了時刻は開始時刻より後にしてください");
      return false;
    }

    return true;
  }

  function buildPayload() {
    const startAt = eventAllDay
      ? `${selectedDate}T00:00:00+09:00`
      : `${selectedDate}T${eventStartTime}:00+09:00`;
    const endAt = eventAllDay
      ? `${eventEndDate}T23:59:59+09:00`
      : `${eventEndDate}T${eventEndTime}:00+09:00`;

    return {
      title: eventTitle,
      description: eventDescription,
      start_at: startAt,
      end_at: endAt,
      all_day: eventAllDay,
      color: eventColor,
    };
  }

  async function createEvent() {
    setErrorMessage("");

    if (submitting || !validateEventForm()) return;

    setSubmitting(true);

    try {
      const newEvent = await createCalendarEvent(buildPayload());
      setEvents((prev) => [...prev, newEvent]);
      closeModal();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "予定の作成に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateEvent() {
    setErrorMessage("");

    if (submitting || !editingEventId || !validateEventForm()) return;

    setSubmitting(true);

    try {
      const updatedEvent = await updateCalendarEvent(editingEventId, buildPayload());
      setEvents((prev) =>
        prev.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      closeModal();
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "予定の更新に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id: number) {
    const ok = confirm("この予定を削除しますか？");

    if (!ok || deleting) return;

    setErrorMessage("");
    setDeleting(true);

    try {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));

      if (editingEventId === id) {
        closeModal();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error, "予定の削除に失敗しました"));
    } finally {
      setDeleting(false);
    }
  }

  return {
    eventTitle,
    eventDescription,
    eventStartTime,
    eventEndDate,
    eventEndTime,
    eventAllDay,
    eventColor,
    editingEventId,
    isModalOpen,
    errorMessage,
    submitting,
    deleting,
    setEventTitle,
    setEventDescription,
    setEventStartTime,
    setEventEndDate,
    setEventEndTime,
    setEventAllDay,
    setEventColor,
    closeModal,
    openCreateModal,
    startEditEvent,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
