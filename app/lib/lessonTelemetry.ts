import { recordLessonActivity } from "./activityTracker";

export const LESSON_EVENTS_STORAGE_KEY = "lesson-activity-events-v1";
const LESSON_EVENTS_SESSION_STORAGE_KEY = "lesson-activity-events-session-v1";

const MAX_STORED_EVENTS = 3000;
let inMemoryEvents: LessonEvent[] = [];

type Primitive = string | number | boolean | null | undefined;

export type LessonEvent = {
  id: string;
  lesson: string;
  activity?: string;
  event: string;
  success?: boolean;
  attempt?: number;
  page?: number;
  totalPages?: number;
  value?: string;
  details?: Record<string, string>;
  recordedAt: string;
};

export type TrackLessonEventPayload = {
  lesson: string;
  activity?: string;
  event: string;
  success?: boolean;
  attempt?: number;
  page?: number;
  totalPages?: number;
  value?: string;
  details?: Record<string, Primitive>;
};

const toStringMetadata = (details?: Record<string, Primitive>): Record<string, string> | undefined => {
  if (!details) return undefined;

  const entries = Object.entries(details).filter(([, value]) => value !== undefined && value !== null);
  if (!entries.length) return undefined;

  return Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
};

const generateEventId = () => {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeEvents = (value: unknown): LessonEvent[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is LessonEvent => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<LessonEvent>;
    return Boolean(candidate.id && candidate.lesson && candidate.event && candidate.recordedAt);
  });
};

const saveLessonEvents = (events: LessonEvent[]) => {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(events);
  try {
    window.localStorage.setItem(LESSON_EVENTS_STORAGE_KEY, serialized);
    return;
  } catch {
    // Continue to fallback storage.
  }
  try {
    window.sessionStorage.setItem(LESSON_EVENTS_SESSION_STORAGE_KEY, serialized);
    return;
  } catch {
    // Continue to in-memory fallback.
  }
  inMemoryEvents = events;
};

export const getLessonEvents = (): LessonEvent[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LESSON_EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return normalizeEvents(parsed);
    }
  } catch {
    // Continue to fallback storage.
  }

  try {
    const raw = window.sessionStorage.getItem(LESSON_EVENTS_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return normalizeEvents(parsed);
    }
  } catch {
    // Continue to in-memory fallback.
  }

  if (inMemoryEvents.length) {
    return normalizeEvents(inMemoryEvents);
  }

  return [];
};

export const clearLessonEvents = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LESSON_EVENTS_STORAGE_KEY);
  } catch {
    // Ignore local storage clear errors.
  }
  try {
    window.sessionStorage.removeItem(LESSON_EVENTS_SESSION_STORAGE_KEY);
  } catch {
    // Ignore session storage clear errors.
  }
  inMemoryEvents = [];
};

export const trackLessonEvent = (payload: TrackLessonEventPayload): LessonEvent | null => {
  if (typeof window === "undefined") return null;

  const details = toStringMetadata(payload.details);
  const event: LessonEvent = {
    id: generateEventId(),
    lesson: payload.lesson,
    activity: payload.activity,
    event: payload.event,
    success: payload.success,
    attempt: payload.attempt,
    page: payload.page,
    totalPages: payload.totalPages,
    value: payload.value,
    details,
    recordedAt: new Date().toISOString(),
  };

  const existing = getLessonEvents();
  const next = [...existing, event];
  const trimmed = next.length > MAX_STORED_EVENTS ? next.slice(next.length - MAX_STORED_EVENTS) : next;
  saveLessonEvents(trimmed);

  const metadata = toStringMetadata({
    activity: event.activity,
    success: event.success,
    attempt: event.attempt,
    page: event.page,
    totalPages: event.totalPages,
    value: event.value,
    ...event.details,
  });

  void recordLessonActivity({
    lesson: event.lesson,
    action: event.event,
    metadata,
  });

  return event;
};
