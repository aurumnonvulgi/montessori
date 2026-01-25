import { Howl } from "howler";

let chime: Howl | null = null;

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
