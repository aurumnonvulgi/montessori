"use client";

export const USER_FEEDBACK_STORAGE_KEY = "user-feedback-entries-v1";
export const USER_FEEDBACK_ALIAS_KEY = "user-feedback-anon-alias-v1";
export const USER_FEEDBACK_UPDATED_EVENT = "user-feedback-updated";

const MAX_FEEDBACK_ENTRIES = 80;

export type UserFeedbackEntry = {
  id: string;
  alias: string;
  url: string;
  comment: string;
  screenshotDataUrl?: string;
  createdAt: string;
};

const isEntry = (value: unknown): value is UserFeedbackEntry => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<UserFeedbackEntry>;
  return (
    typeof maybe.id === "string" &&
    typeof maybe.alias === "string" &&
    typeof maybe.url === "string" &&
    typeof maybe.comment === "string" &&
    typeof maybe.createdAt === "string"
  );
};

const emitFeedbackUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_FEEDBACK_UPDATED_EVENT));
};

const readEntries = (): UserFeedbackEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USER_FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
};

const writeEntries = (entries: UserFeedbackEntry[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
  emitFeedbackUpdated();
};

export const getUserFeedbackEntries = () => readEntries();

export const clearUserFeedbackEntries = () => writeEntries([]);

export const getOrCreateFeedbackAlias = () => {
  if (typeof window === "undefined") return "Learner";
  const existing = window.localStorage.getItem(USER_FEEDBACK_ALIAS_KEY);
  if (existing) return existing;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const next = `Learner ${suffix}`;
  window.localStorage.setItem(USER_FEEDBACK_ALIAS_KEY, next);
  return next;
};

export const addUserFeedbackEntry = ({
  url,
  comment,
  screenshotDataUrl,
}: {
  url: string;
  comment: string;
  screenshotDataUrl?: string;
}) => {
  const entry: UserFeedbackEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    alias: getOrCreateFeedbackAlias(),
    url,
    comment,
    screenshotDataUrl,
    createdAt: new Date().toISOString(),
  };
  const previous = readEntries();
  const next = [entry, ...previous].slice(0, MAX_FEEDBACK_ENTRIES);
  writeEntries(next);
  return entry;
};
