import { getVoiceEnabled, getVoiceVolume } from "./voicePreferences";

type SpeechOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  interrupt?: boolean;
};

const NATURAL_VOICE_PATTERNS = [
  /Google US English/i,
  /Google UK English (Female|Male)/i,
  /Google (Australian|Indian|Irish|South African) English/i,
  /Siri/i,
  /Samantha/i,
  /Alex/i,
  /Karen/i,
  /Moira/i,
  /Tessa/i,
  /Microsoft (Aria|Jenny|Guy|Amber|Ana|Neural|Natural|Online)/i,
];

const getVoices = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};

export const primeSpeechVoices = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) {
    return;
  }
  const handleVoicesChanged = () => {
    synth.getVoices();
    if (typeof synth.removeEventListener === "function") {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
    } else {
      synth.onvoiceschanged = null;
    }
  };
  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", handleVoicesChanged);
  } else {
    synth.onvoiceschanged = handleVoicesChanged;
  }
  synth.getVoices();
};

export const getPreferredVoice = (lang = "en-US") => {
  const voices = getVoices();
  if (!voices.length) {
    return null;
  }
  const langPrefix = lang.split("-")[0]?.toLowerCase();
  const languageMatches = voices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith(langPrefix),
  );
  const pool = languageMatches.length > 0 ? languageMatches : voices;
  for (const pattern of NATURAL_VOICE_PATTERNS) {
    const match = pool.find((voice) => pattern.test(voice.name));
    if (match) {
      return match;
    }
  }
  const defaultVoice = pool.find((voice) => voice.default);
  return defaultVoice ?? pool[0] ?? null;
};

export const speakWithPreferredVoice = (text: string, options: SpeechOptions = {}) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  if (!getVoiceEnabled()) {
    return;
  }
  const masterVoiceVolume = getVoiceVolume();
  if (masterVoiceVolume <= 0) {
    return;
  }
  const phrase = text.trim();
  if (!phrase) {
    return;
  }
  primeSpeechVoices();
  const synth = window.speechSynthesis;
  if (typeof synth.resume === "function") {
    try {
      synth.resume();
    } catch {
      // Some browsers can throw if resume is called in unsupported states.
    }
  }

  const buildUtterance = (withPreferredVoice: boolean) => {
    const utterance = new SpeechSynthesisUtterance(phrase);
    if (withPreferredVoice) {
      const voice = getPreferredVoice(options.lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || options.lang || "en-US";
      } else if (options.lang) {
        utterance.lang = options.lang;
      }
    } else if (options.lang) {
      utterance.lang = options.lang;
    }
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 0.95;
    utterance.volume = Math.max(0, Math.min(1, (options.volume ?? 0.85) * masterVoiceVolume));
    return utterance;
  };

  if ((options.interrupt ?? true) && (synth.speaking || synth.pending)) {
    synth.cancel();
  }
  try {
    synth.speak(buildUtterance(true));
  } catch {
    try {
      synth.speak(buildUtterance(false));
    } catch {
      return;
    }
  }

  window.setTimeout(() => {
    if (!synth.speaking && !synth.pending) {
      try {
        synth.speak(buildUtterance(false));
      } catch {
        // Best effort: no further fallback available.
      }
    }
  }, 160);
};
