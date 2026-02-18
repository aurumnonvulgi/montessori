"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LESSON_EVENTS_STORAGE_KEY, trackLessonEvent } from "../lib/lessonTelemetry";

const isCompletionStorageKey = (key: string) => /(?:^|-)complete$/i.test(key);

export default function ActivityTelemetryBridge() {
  const pathname = usePathname();
  const currentPageRef = useRef<{ path: string; enteredAt: number } | null>(null);
  const trackedCompletionKeysRef = useRef<Record<string, true>>({});

  useEffect(() => {
    trackLessonEvent({
      lesson: "app:session",
      event: "session_started",
      details: {
        path: typeof window !== "undefined" ? window.location.pathname : "",
      },
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const now = Date.now();
    const previous = currentPageRef.current;

    if (previous) {
      const durationMs = Math.max(now - previous.enteredAt, 0);
      trackLessonEvent({
        lesson: `route:${previous.path}`,
        activity: previous.path,
        event: "page_left",
        details: {
          durationMs,
          durationSeconds: Math.round(durationMs / 1000),
        },
      });
    }

    trackLessonEvent({
      lesson: `route:${pathname}`,
      activity: pathname,
      event: "page_viewed",
    });

    currentPageRef.current = {
      path: pathname,
      enteredAt: now,
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scanCompletionFlags = () => {
      const keysToKeep: Record<string, true> = {};

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key || key === LESSON_EVENTS_STORAGE_KEY) continue;
        if (!isCompletionStorageKey(key)) continue;

        const value = window.localStorage.getItem(key);
        if (value !== "true") continue;

        keysToKeep[key] = true;
        if (trackedCompletionKeysRef.current[key]) continue;
        trackedCompletionKeysRef.current[key] = true;

        trackLessonEvent({
          lesson: "app:completion-flags",
          activity: key,
          event: "completion_flag_set",
          success: true,
          value: key,
          details: {
            currentValue: value,
            path: window.location.pathname,
          },
        });
      }

      Object.keys(trackedCompletionKeysRef.current).forEach((key) => {
        if (!keysToKeep[key]) {
          delete trackedCompletionKeysRef.current[key];
        }
      });
    };

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (!event.key || event.key === LESSON_EVENTS_STORAGE_KEY) return;
      if (!isCompletionStorageKey(event.key)) return;
      if (event.newValue !== "true") {
        delete trackedCompletionKeysRef.current[event.key];
        return;
      }

      if (!trackedCompletionKeysRef.current[event.key]) {
        trackedCompletionKeysRef.current[event.key] = true;
        trackLessonEvent({
          lesson: "app:completion-flags",
          activity: event.key,
          event: "completion_flag_set",
          success: true,
          value: event.key,
          details: {
            currentValue: event.newValue,
            path: window.location.pathname,
          },
        });
      }
    };

    scanCompletionFlags();
    const interval = window.setInterval(scanCompletionFlags, 1200);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", scanCompletionFlags);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", scanCompletionFlags);
    };
  }, []);

  useEffect(() => {
    return () => {
      const current = currentPageRef.current;
      if (!current) return;
      const durationMs = Math.max(Date.now() - current.enteredAt, 0);
      trackLessonEvent({
        lesson: `route:${current.path}`,
        activity: current.path,
        event: "page_left",
        details: {
          durationMs,
          durationSeconds: Math.round(durationMs / 1000),
        },
      });
    };
  }, []);

  return null;
}
