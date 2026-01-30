import { Howl, Howler } from "howler";

let chime: Howl | null = null;
let audioUnlocked = false;

// Unlock audio context for mobile browsers (must be called on user interaction)
export const unlockAudio = () => {
  if (typeof window === "undefined" || audioUnlocked) {
    return;
  }

  // Create and play a silent sound to unlock the audio context
  const silentSound = new Howl({
    src: ["data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"],
    volume: 0,
    onend: () => {
      audioUnlocked = true;
    },
  });
  silentSound.play();

  // Also try to resume the Howler audio context directly
  if (Howler.ctx && Howler.ctx.state === "suspended") {
    Howler.ctx.resume();
  }
};

// Prime sounds for immediate playback (call on user interaction)
export const primeSounds = () => {
  unlockAudio();

  // Pre-load the chime if not already loaded
  if (!chime && typeof window !== "undefined") {
    chime = new Howl({
      src: ["/audio/chime.wav"],
      volume: 0.4,
      preload: true,
    });
  }
};

export const playChime = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!chime) {
    chime = new Howl({
      src: ["/audio/chime.wav"],
      volume: 0.4,
      preload: true,
    });
  }

  chime.play();
};
