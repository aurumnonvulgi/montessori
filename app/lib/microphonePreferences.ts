"use client";

import { useCallback, useEffect, useState } from "react";

export const MICROPHONE_ENABLED_STORAGE_KEY = "montessori-microphone-enabled";
const MICROPHONE_ENABLED_EVENT = "montessori:microphone-enabled-changed";

const toStoredValue = (enabled: boolean) => (enabled ? "true" : "false");

const parseStoredValue = (value: string | null) => {
  if (value === "false") return false;
  if (value === "true") return true;
  return false;
};

export const getMicrophoneEnabled = () => {
  if (typeof window === "undefined") {
    return false;
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

const getEnableConfirmationMessage = () =>
  [
    "Turn microphone ON?",
    "",
    "This will allow lessons to request microphone access for speech checks.",
    "Activities can listen for spoken answers and mark speech-based tasks complete.",
  ].join("\n");

const getDisableConfirmationMessage = () =>
  [
    "Turn microphone OFF?",
    "",
    "This will disable microphone requests across lessons.",
    "Speech-listening interactions will be skipped or use non-mic fallback behavior when available.",
  ].join("\n");

export const confirmMicrophonePreferenceChange = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return true;
  }
  const message = enabled ? getEnableConfirmationMessage() : getDisableConfirmationMessage();
  return window.confirm(message);
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
  const [microphoneEnabled, setMicrophoneEnabledState] = useState(false);

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
