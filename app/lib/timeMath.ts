export type ClockMode = "hours" | "minutes" | "both";
export type MinuteStage = "five" | "one";

export type TimeValue = {
  h: number;
  m: number;
};

export type HandAngles = {
  hourAngle: number;
  minuteAngle: number;
};

export type SnappingRules = {
  mode: ClockMode;
  minuteSnap: "locked" | MinuteStage;
  hourSnap: "locked" | "hour" | "drift";
  lockedHour?: number;
  lockedMinute?: number;
};

const HOUR_WORDS = [
  "twelve",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
] as const;

const ONES_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;

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
] as const;

const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty"] as const;

export const normalizeAngle = (angle: number) => {
  const wrapped = angle % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

export const normalizeMinute = (minute: number) => {
  const wrapped = Math.round(minute) % 60;
  return wrapped < 0 ? wrapped + 60 : wrapped;
};

export const normalizeHour = (hour: number) => {
  const wrapped = Math.round(hour) % 12;
  if (wrapped === 0) return 12;
  return wrapped < 0 ? wrapped + 12 : wrapped;
};

const snapToStep = (value: number, step: number) =>
  normalizeAngle(Math.round(value / step) * step);

export const snapHourAngle = (angle: number) => snapToStep(angle, 30);
export const snapMinuteAngleFive = (angle: number) => snapToStep(angle, 30);
export const snapMinuteAngleOne = (angle: number) => snapToStep(angle, 6);

export const timeToHandAngles = ({ h, m }: TimeValue): HandAngles => {
  const hour = normalizeHour(h) % 12;
  const minute = normalizeMinute(m);
  return {
    minuteAngle: normalizeAngle(minute * 6),
    // 30 degrees per hour + minute drift across each hour
    hourAngle: normalizeAngle((hour + minute / 60) * 30),
  };
};

export const minuteFromAngle = (angle: number) => normalizeMinute(normalizeAngle(angle) / 6);

const hourFromDriftAngle = (angle: number, minute: number) => {
  const normalizedHourFloat = normalizeAngle(angle) / 30;
  const baseHour = Math.round(normalizedHourFloat - minute / 60);
  return normalizeHour(baseHour);
};

export const handAnglesToTime = (
  angles: HandAngles,
  rules: SnappingRules
): TimeValue => {
  const minuteAngleSource =
    rules.minuteSnap === "five"
      ? snapMinuteAngleFive(angles.minuteAngle)
      : rules.minuteSnap === "one"
        ? snapMinuteAngleOne(angles.minuteAngle)
        : normalizeAngle(angles.minuteAngle);

  const minute =
    rules.minuteSnap === "locked"
      ? normalizeMinute(rules.lockedMinute ?? 0)
      : minuteFromAngle(minuteAngleSource);

  if (rules.hourSnap === "locked") {
    return {
      h: normalizeHour(rules.lockedHour ?? 12),
      m: minute,
    };
  }

  if (rules.hourSnap === "hour") {
    const snappedHour = normalizeHour(snapHourAngle(angles.hourAngle) / 30);
    return {
      h: snappedHour,
      m: rules.mode === "hours" ? 0 : minute,
    };
  }

  return {
    h: hourFromDriftAngle(angles.hourAngle, minute),
    m: minute,
  };
};

export const minuteToStage = (minute: number, stage: MinuteStage) => {
  const angle = minute * 6;
  const snapped = stage === "five" ? snapMinuteAngleFive(angle) : snapMinuteAngleOne(angle);
  return minuteFromAngle(snapped);
};

export const isTimeMatch = (
  actual: TimeValue,
  target: TimeValue,
  mode: ClockMode,
  minuteStage: MinuteStage
) => {
  const normalizedActual = {
    h: normalizeHour(actual.h),
    m: normalizeMinute(actual.m),
  };
  const normalizedTarget = {
    h: normalizeHour(target.h),
    m: normalizeMinute(target.m),
  };

  if (mode === "hours") {
    return normalizedActual.h === normalizedTarget.h;
  }

  if (mode === "minutes") {
    return minuteToStage(normalizedActual.m, minuteStage) === minuteToStage(normalizedTarget.m, minuteStage);
  }

  return (
    normalizedActual.h === normalizedTarget.h &&
    minuteToStage(normalizedActual.m, minuteStage) === minuteToStage(normalizedTarget.m, minuteStage)
  );
};

const minuteToWords = (minute: number) => {
  const m = normalizeMinute(minute);
  if (m < 10) return ONES_WORDS[m];
  if (m < 20) return TEEN_WORDS[m - 10];
  const tens = Math.floor(m / 10);
  const ones = m % 10;
  if (ones === 0) return TENS_WORDS[tens];
  return `${TENS_WORDS[tens]}-${ONES_WORDS[ones]}`;
};

export const toHourLabel = (hour: number) => `${HOUR_WORDS[normalizeHour(hour) % 12]} o'clock`;

export const toMinuteLabel = (minute: number) => `${normalizeMinute(minute).toString().padStart(2, "0")} minutes`;

export const toDigitalTimeLabel = ({ h, m }: TimeValue) => {
  const hour = normalizeHour(h);
  const minute = normalizeMinute(m);
  return `${hour}:${minute.toString().padStart(2, "0")}`;
};

export const toPhraseTimeLabel = ({ h, m }: TimeValue) => {
  const hour = HOUR_WORDS[normalizeHour(h) % 12];
  const minute = normalizeMinute(m);
  if (minute === 0) return `${hour} o'clock`;
  return `${hour} ${minuteToWords(minute)}`;
};

