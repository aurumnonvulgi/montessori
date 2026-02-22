"use client";

import { useCallback, useEffect, useState } from "react";

export const BACKGROUND_MUSIC_ENABLED_STORAGE_KEY = "montessori-dashboard-music-enabled";
export const BACKGROUND_MUSIC_VOLUME_STORAGE_KEY = "montessori-dashboard-music-volume";
const BACKGROUND_MUSIC_ENABLED_EVENT = "montessori:background-music-enabled-changed";
const BACKGROUND_MUSIC_VOLUME_EVENT = "montessori:background-music-volume-changed";

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

const parseStoredValue = (value: string | null) => {
  if (value === "false") return false;
  if (value === "true") return true;
  return false;
};

const parseStoredVolume = (value: string | null) => {
  if (value === null) return 0.1;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0.1;
  return clampUnit(parsed);
};

export const getBackgroundMusicEnabled = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return parseStoredValue(window.localStorage.getItem(BACKGROUND_MUSIC_ENABLED_STORAGE_KEY));
};

export const setBackgroundMusicEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(BACKGROUND_MUSIC_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent(BACKGROUND_MUSIC_ENABLED_EVENT, { detail: enabled }));
};

export const getBackgroundMusicVolume = () => {
  if (typeof window === "undefined") {
    return 0.1;
  }
  return parseStoredVolume(window.localStorage.getItem(BACKGROUND_MUSIC_VOLUME_STORAGE_KEY));
};

export const setBackgroundMusicVolume = (volume: number) => {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = clampUnit(volume);
  window.localStorage.setItem(BACKGROUND_MUSIC_VOLUME_STORAGE_KEY, String(normalized));
  window.dispatchEvent(new CustomEvent(BACKGROUND_MUSIC_VOLUME_EVENT, { detail: normalized }));
};

const subscribeToBackgroundMusicEnabled = (listener: (enabled: boolean) => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const notify = () => {
    listener(getBackgroundMusicEnabled());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== BACKGROUND_MUSIC_ENABLED_STORAGE_KEY) {
      return;
    }
    notify();
  };

  const onCustomChange = (event: Event) => {
    const customEvent = event as CustomEvent<boolean>;
    if (typeof customEvent.detail === "boolean") {
      listener(customEvent.detail);
      return;
    }
    notify();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(BACKGROUND_MUSIC_ENABLED_EVENT, onCustomChange as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(BACKGROUND_MUSIC_ENABLED_EVENT, onCustomChange as EventListener);
  };
};

export const useBackgroundMusicEnabled = () => {
  const { backgroundMusicEnabled, setBackgroundMusicEnabled } = useBackgroundMusicSettings();
  return {
    backgroundMusicEnabled,
    setBackgroundMusicEnabled,
  };
};

export const useBackgroundMusicSettings = () => {
  const [backgroundMusicEnabled, setBackgroundMusicEnabledState] = useState(false);
  const [backgroundMusicVolume, setBackgroundMusicVolumeState] = useState(0.1);

  useEffect(() => {
    setBackgroundMusicEnabledState(getBackgroundMusicEnabled());
    setBackgroundMusicVolumeState(getBackgroundMusicVolume());
    const unsubscribeEnabled = subscribeToBackgroundMusicEnabled(setBackgroundMusicEnabledState);
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== BACKGROUND_MUSIC_VOLUME_STORAGE_KEY) {
        return;
      }
      setBackgroundMusicVolumeState(getBackgroundMusicVolume());
    };
    const onVolumeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setBackgroundMusicVolumeState(clampUnit(customEvent.detail));
        return;
      }
      setBackgroundMusicVolumeState(getBackgroundMusicVolume());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(BACKGROUND_MUSIC_VOLUME_EVENT, onVolumeChanged as EventListener);
    return () => {
      unsubscribeEnabled();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BACKGROUND_MUSIC_VOLUME_EVENT, onVolumeChanged as EventListener);
    };
  }, []);

  const updateBackgroundMusicEnabled = useCallback((enabled: boolean) => {
    setBackgroundMusicEnabled(enabled);
  }, []);

  const updateBackgroundMusicVolume = useCallback((volume: number) => {
    setBackgroundMusicVolume(volume);
  }, []);

  return {
    backgroundMusicEnabled,
    setBackgroundMusicEnabled: updateBackgroundMusicEnabled,
    backgroundMusicVolume,
    setBackgroundMusicVolume: updateBackgroundMusicVolume,
  };
};
