"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBackgroundMusicSettings } from "../lib/backgroundMusicPreferences";
import { useVoiceSettings } from "../lib/voicePreferences";

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));
const FALLBACK_TRACKS = ["/assets/media/songs/Gymnop%C3%A9die%20no.%201%20%28for%20Harp%29.mp3"];

type SongListResponse = {
  files?: unknown;
};

const shuffleTracks = (tracks: string[], avoidFirst: string | null) => {
  const shuffled = [...tracks];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  if (avoidFirst && shuffled.length > 1 && shuffled[0] === avoidFirst) {
    const replacementIndex = shuffled.findIndex((track) => track !== avoidFirst);
    if (replacementIndex > 0) {
      [shuffled[0], shuffled[replacementIndex]] = [shuffled[replacementIndex], shuffled[0]];
    }
  }

  return shuffled;
};

export default function BackgroundMusicPlayer() {
  const { backgroundMusicEnabled, backgroundMusicVolume } = useBackgroundMusicSettings();
  const { voiceVolume } = useVoiceSettings();
  const [tracks, setTracks] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const queueIndexRef = useRef(0);
  const currentTrackRef = useRef<string | null>(null);
  const enabledRef = useRef(backgroundMusicEnabled);
  const tracksRef = useRef<string[]>([]);
  const awaitingGestureRetryRef = useRef(false);
  const effectiveMusicVolumeRef = useRef(0.25);

  const effectiveMusicVolume = clampUnit(Math.min(backgroundMusicVolume, voiceVolume * 0.25));

  useEffect(() => {
    enabledRef.current = backgroundMusicEnabled;
  }, [backgroundMusicEnabled]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    effectiveMusicVolumeRef.current = effectiveMusicVolume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveMusicVolume;
    }
  }, [effectiveMusicVolume]);

  const playTrack = useCallback(async (track: string) => {
    const audio = audioRef.current;
    if (!audio) return false;

    audio.volume = effectiveMusicVolumeRef.current;
    audio.src = track;
    currentTrackRef.current = track;
    try {
      await audio.play();
      awaitingGestureRetryRef.current = false;
      return true;
    } catch {
      awaitingGestureRetryRef.current = true;
      return false;
    }
  }, []);

  const getNextTrack = useCallback(() => {
    const availableTracks = tracksRef.current;
    if (!availableTracks.length) {
      return null;
    }

    const queue = queueRef.current;
    if (!queue.length) {
      const shuffled = shuffleTracks(availableTracks, currentTrackRef.current);
      queueRef.current = shuffled;
      queueIndexRef.current = 0;
      return shuffled[0] ?? null;
    }

    const nextIndex = queueIndexRef.current + 1;
    if (nextIndex >= queue.length) {
      const shuffled = shuffleTracks(availableTracks, currentTrackRef.current);
      queueRef.current = shuffled;
      queueIndexRef.current = 0;
      return shuffled[0] ?? null;
    }

    queueIndexRef.current = nextIndex;
    return queue[nextIndex] ?? null;
  }, []);

  const startPlaylist = useCallback(async () => {
    if (!enabledRef.current) return;
    const availableTracks = tracksRef.current;
    if (!availableTracks.length) return;

    const shuffled = shuffleTracks(availableTracks, currentTrackRef.current);
    queueRef.current = shuffled;
    queueIndexRef.current = 0;
    const firstTrack = shuffled[0];
    if (!firstTrack) return;

    await playTrack(firstTrack);
  }, [playTrack]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
    audioRef.current.volume = effectiveMusicVolumeRef.current;
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadTracks = async () => {
      try {
        const response = await fetch("/api/media/songs", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load songs");
        }
        const payload = (await response.json()) as SongListResponse;
        const files = Array.isArray(payload.files)
          ? payload.files.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [];
        if (!active) return;
        setTracks(files.length ? files : FALLBACK_TRACKS);
      } catch {
        if (!active) return;
        setTracks(FALLBACK_TRACKS);
      }
    };
    loadTracks();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (!enabledRef.current) return;
      const nextTrack = getNextTrack();
      if (!nextTrack) return;
      void playTrack(nextTrack);
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [getNextTrack, playTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!backgroundMusicEnabled) {
      audio.pause();
      audio.currentTime = 0;
      currentTrackRef.current = null;
      awaitingGestureRetryRef.current = false;
      return;
    }

    if (!tracks.length) return;
    void startPlaylist();
  }, [backgroundMusicEnabled, startPlaylist, tracks]);

  useEffect(() => {
    const tryResumeOnGesture = () => {
      if (!enabledRef.current || !awaitingGestureRetryRef.current) {
        return;
      }

      const currentTrack = currentTrackRef.current;
      if (currentTrack) {
        void playTrack(currentTrack);
        return;
      }

      const nextTrack = getNextTrack();
      if (nextTrack) {
        void playTrack(nextTrack);
      }
    };

    window.addEventListener("pointerdown", tryResumeOnGesture, { passive: true });
    window.addEventListener("keydown", tryResumeOnGesture);
    return () => {
      window.removeEventListener("pointerdown", tryResumeOnGesture);
      window.removeEventListener("keydown", tryResumeOnGesture);
    };
  }, [getNextTrack, playTrack]);

  return null;
}
