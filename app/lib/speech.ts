type SpeechOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
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
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice(options.lang);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 0.95;
  utterance.volume = options.volume ?? 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};
