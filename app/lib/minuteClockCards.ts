export type MinuteClockPair = {
  id: string;
  minute: number;
  label: string;
  speechLabel: string;
  pictureImage: string;
  labelImage: string;
};

export type MinuteChunk = {
  slug: string;
  startMinute: number;
  endMinute: number;
  label: string;
};

const MINUTE_VALUES = Array.from({ length: 60 }, (_, index) => index);

const DIGIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEEN_WORDS = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty"];

const minuteToWords = (minute: number) => {
  if (minute < 10) return DIGIT_WORDS[minute];
  if (minute < 20) return TEEN_WORDS[minute - 10];
  const tens = Math.floor(minute / 10);
  const ones = minute % 10;
  return ones === 0 ? TENS_WORDS[tens] : `${TENS_WORDS[tens]}-${DIGIT_WORDS[ones]}`;
};

export const ALL_MINUTE_PAIRS: MinuteClockPair[] = MINUTE_VALUES.map((minute) => {
  const paddedMinute = String(minute).padStart(2, "0");
  const minuteSpeech =
    minute === 0
      ? "1 hour"
      : `1 hour and ${minuteToWords(minute)} ${minute === 1 ? "minute" : "minutes"}`;
  return {
    id: `minute-${paddedMinute}`,
    minute,
    label: `1:${paddedMinute}`,
    speechLabel: minuteSpeech,
    pictureImage: `/assets/time/minute_clock/minute_clock_tcp_picture/01-${paddedMinute}-minute_clock_tcp_picture.png`,
    labelImage: `/assets/time/minute_clock/minute_clock_tcp_labels/01-${paddedMinute}-minute_clock_tcp_labels.png`,
  };
});

export const MINUTE_CHUNKS: MinuteChunk[] = Array.from({ length: 6 }, (_, index) => {
  const startMinute = index * 10;
  const endMinute = startMinute + 9;
  const startLabel = String(startMinute).padStart(2, "0");
  const endLabel = String(endMinute).padStart(2, "0");
  return {
    slug: `${startLabel}-${endLabel}`,
    startMinute,
    endMinute,
    label: `1:${startLabel} - 1:${endLabel}`,
  };
});

export const getMinuteChunkBySlug = (slug: string) =>
  MINUTE_CHUNKS.find((chunk) => chunk.slug === slug);

export const getMinutePairsForChunk = (chunk: MinuteChunk) =>
  ALL_MINUTE_PAIRS.filter((pair) => pair.minute >= chunk.startMinute && pair.minute <= chunk.endMinute);
