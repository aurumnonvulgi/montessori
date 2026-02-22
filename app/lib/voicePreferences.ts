"use client";

import { useCallback, useEffect, useState } from "react";

export const VOICE_ENABLED_STORAGE_KEY = "montessori-voice-enabled";
export const VOICE_VOLUME_STORAGE_KEY = "montessori-voice-volume";
const VOICE_ENABLED_EVENT = "montessori:voice-enabled-changed";
const VOICE_VOLUME_EVENT = "montessori:voice-volume-changed";

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

const parseStoredEnabled = (value: string | null) => {
  if (value === "false") return false;
  if (value === "true") return true;
  return true;
};

const parseStoredVolume = (value: string | null) => {
  if (value === null) return 1;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return clampUnit(parsed);
};

export const getVoiceEnabled = () => {
  if (typeof window === "undefined") {
    return true;
  }
  return parseStoredEnabled(window.localStorage.getItem(VOICE_ENABLED_STORAGE_KEY));
};

export const setVoiceEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
  if (!enabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  window.dispatchEvent(new CustomEvent(VOICE_ENABLED_EVENT, { detail: enabled }));
};

export const getVoiceVolume = () => {
  if (typeof window === "undefined") {
    return 1;
  }
  return parseStoredVolume(window.localStorage.getItem(VOICE_VOLUME_STORAGE_KEY));
};

export const setVoiceVolume = (volume: number) => {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = clampUnit(volume);
  window.localStorage.setItem(VOICE_VOLUME_STORAGE_KEY, String(normalized));
  window.dispatchEvent(new CustomEvent(VOICE_VOLUME_EVENT, { detail: normalized }));
};

export const useVoiceSettings = () => {
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [voiceVolume, setVoiceVolumeState] = useState(1);

  useEffect(() => {
    setVoiceEnabledState(getVoiceEnabled());
    setVoiceVolumeState(getVoiceVolume());

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== VOICE_ENABLED_STORAGE_KEY && event.key !== VOICE_VOLUME_STORAGE_KEY) {
        return;
      }
      setVoiceEnabledState(getVoiceEnabled());
      setVoiceVolumeState(getVoiceVolume());
    };

    const onEnabledChanged = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      if (typeof customEvent.detail === "boolean") {
        setVoiceEnabledState(customEvent.detail);
        return;
      }
      setVoiceEnabledState(getVoiceEnabled());
    };

    const onVolumeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setVoiceVolumeState(clampUnit(customEvent.detail));
        return;
      }
      setVoiceVolumeState(getVoiceVolume());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(VOICE_ENABLED_EVENT, onEnabledChanged as EventListener);
    window.addEventListener(VOICE_VOLUME_EVENT, onVolumeChanged as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VOICE_ENABLED_EVENT, onEnabledChanged as EventListener);
      window.removeEventListener(VOICE_VOLUME_EVENT, onVolumeChanged as EventListener);
    };
  }, []);

  const updateVoiceEnabled = useCallback((enabled: boolean) => {
    setVoiceEnabled(enabled);
  }, []);

  const updateVoiceVolume = useCallback((volume: number) => {
    setVoiceVolume(volume);
  }, []);

  return {
    voiceEnabled,
    setVoiceEnabled: updateVoiceEnabled,
    voiceVolume,
    setVoiceVolume: updateVoiceVolume,
  };
};
