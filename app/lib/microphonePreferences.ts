"use client";

import { useCallback, useEffect, useState } from "react";

export const MICROPHONE_ENABLED_STORAGE_KEY = "montessori-microphone-enabled";
const MICROPHONE_ENABLED_EVENT = "montessori:microphone-enabled-changed";

const toStoredValue = (enabled: boolean) => (enabled ? "true" : "false");

const parseStoredValue = (value: string | null) => {
  if (value === "false") return false;
  if (value === "true") return true;
  return true;
};

export const getMicrophoneEnabled = () => {
  if (typeof window === "undefined") {
    return true;
  }
  return parseStoredValue(window.localStorage.getItem(MICROPHONE_ENABLED_STORAGE_KEY));
};

export const setMicrophoneEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MICROPHONE_ENABLED_STORAGE_KEY, toStoredValue(enabled));
  window.dispatchEvent(new CustomEvent(MICROPHONE_ENABLED_EVENT, { detail: enabled }));
};

const subscribeToMicrophoneEnabled = (listener: (enabled: boolean) => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => {
    listener(getMicrophoneEnabled());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== MICROPHONE_ENABLED_STORAGE_KEY) {
      return;
    }
    notify();
  };

  const onChange = (event: Event) => {
    const customEvent = event as CustomEvent<boolean>;
    if (typeof customEvent.detail === "boolean") {
      listener(customEvent.detail);
      return;
    }
    notify();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(MICROPHONE_ENABLED_EVENT, onChange as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MICROPHONE_ENABLED_EVENT, onChange as EventListener);
  };
};

export const useMicrophoneEnabled = () => {
  const [microphoneEnabled, setMicrophoneEnabledState] = useState(true);

  useEffect(() => {
    setMicrophoneEnabledState(getMicrophoneEnabled());
    return subscribeToMicrophoneEnabled(setMicrophoneEnabledState);
  }, []);

  const updateMicrophoneEnabled = useCallback((enabled: boolean) => {
    setMicrophoneEnabled(enabled);
  }, []);

  return {
    microphoneEnabled,
    setMicrophoneEnabled: updateMicrophoneEnabled,
  };
};
