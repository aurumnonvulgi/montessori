"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import HomeLink from "./HomeLink";
import TimeClockScene from "./TimeClockScene";
import { trackLessonEvent } from "../lib/lessonTelemetry";
import {
  type ClockMode,
  type MinuteStage,
  type TimeValue,
  isTimeMatch,
  minuteToStage,
  normalizeHour,
  toDigitalTimeLabel,
  toHourLabel,
  toMinuteLabel,
  toPhraseTimeLabel,
} from "../lib/timeMath";

type HistoryTimeLessonProps = {
  mode: ClockMode;
};

type ActivityKey = "set" | "read" | "match" | "skip";

const MODE_TITLES: Record<ClockMode, string> = {
  hours: "Hour Clock Activities",
  minutes: "Minute Clock Activities",
  both: "Clock Activities",
};

const MODE_NOTES: Record<ClockMode, string> = {
  hours: "Isolation of difficulty: only the short hour hand is active.",
  minutes: "Isolation of difficulty: only the long minute hand is active.",
  both: "Combine both hands with truthful hour drift as minutes pass.",
};

const ACTIVITIES: Record<ClockMode, { key: ActivityKey; label: string }[]> = {
  hours: [
    { key: "set", label: "Set the Clock" },
    { key: "read", label: "Read the Clock" },
    { key: "match", label: "Match Cards" },
  ],
  minutes: [
    { key: "set", label: "Set the Minutes" },
    { key: "read", label: "Read the Minutes" },
    { key: "skip", label: "Skip Count Path" },
  ],
  both: [
    { key: "set", label: "Set the Time" },
    { key: "read", label: "Read the Time" },
    { key: "match", label: "Match Cards" },
  ],
};

const PRESENTATION_STEPS: Array<{
  title: string;
  prompt: string;
  highlight: "hour" | "minute" | "track";
}> = [
  {
    title: "Period 1 · Naming",
    prompt: "This is the hour hand. This is the minute hand. This is the minute track.",
    highlight: "hour",
  },
  {
    title: "Period 2 · Recognition",
    prompt: "Show me the minute hand.",
    highlight: "minute",
  },
  {
    title: "Period 3 · Recall",
    prompt: "What is this called?",
    highlight: "track",
  },
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomMinuteByStage = (stage: MinuteStage) => {
  if (stage === "five") return randomInt(0, 11) * 5;
  return randomInt(0, 59);
};

const createTargetTime = (mode: ClockMode, minuteStage: MinuteStage): TimeValue => {
  if (mode === "hours") {
    return { h: randomInt(1, 12), m: 0 };
  }
  if (mode === "minutes") {
    return { h: 12, m: randomMinuteByStage(minuteStage) };
  }
  return {
    h: randomInt(1, 12),
    m: randomMinuteByStage(minuteStage),
  };
};

const createInitialTargetTime = (mode: ClockMode): TimeValue => {
  if (mode === "minutes") return { h: 12, m: 0 };
  return { h: 12, m: 0 };
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const formatForMode = (time: TimeValue, mode: ClockMode) => {
  if (mode === "hours") return toHourLabel(time.h);
  if (mode === "minutes") return toMinuteLabel(time.m);
  return toDigitalTimeLabel(time);
};

const keyForTime = (time: TimeValue) => `${normalizeHour(time.h)}-${time.m}`;

const buildChoices = (target: TimeValue, mode: ClockMode, minuteStage: MinuteStage) => {
  const entries: TimeValue[] = [{ h: target.h, m: target.m }];
  const seen = new Set([keyForTime(target)]);
  while (entries.length < 3) {
    const next = createTargetTime(mode, minuteStage);
    const key = keyForTime(next);
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(next);
  }
  return shuffle(entries);
};

const createStartClock = (mode: ClockMode, minuteStage: MinuteStage, target: TimeValue): TimeValue => {
  if (mode === "hours") {
    const shifted = target.h === 12 ? 11 : target.h + 1;
    return { h: shifted, m: 0 };
  }
  if (mode === "minutes") {
    const shifted = minuteToStage(target.m + (minuteStage === "five" ? 10 : 7), minuteStage);
    return { h: 12, m: shifted };
  }
  return {
    h: target.h === 12 ? 11 : target.h + 1,
    m: minuteToStage(target.m + (minuteStage === "five" ? 10 : 7), minuteStage),
  };
};

const playGentleTone = (enabled: boolean) => {
  if (!enabled || typeof window === "undefined") return;
  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 440;
  gain.gain.value = 0.0001;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.03, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.stop(context.currentTime + 0.2);
  window.setTimeout(() => {
    void context.close();
  }, 260);
};

export default function HistoryTimeLesson({ mode }: HistoryTimeLessonProps) {
  const [minuteStage, setMinuteStage] = useState<MinuteStage>("one");
  const [activity, setActivity] = useState<ActivityKey>(ACTIVITIES[mode][0].key);
  const [targetTime, setTargetTime] = useState<TimeValue>(() => createInitialTargetTime(mode));
  const [clockTime, setClockTime] = useState<TimeValue>(() => createInitialTargetTime(mode));
  const [choices, setChoices] = useState<TimeValue[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCheckOverlay, setShowCheckOverlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationStep, setPresentationStep] = useState(0);
  const [presentationFeedback, setPresentationFeedback] = useState<string | null>(null);
  const [skipTarget, setSkipTarget] = useState(5);
  const completedActivitiesRef = useRef<Set<ActivityKey>>(new Set());
  const lessonStartedRef = useRef(false);
  const lessonCompletedRef = useRef(false);

  const supportsMinuteStage = mode !== "hours";
  const activityOptions = ACTIVITIES[mode];
  const lessonKey = "history-time:clock-activities";
  const modeActivityKey = `mode-${mode}`;
  const activityIndex = activityOptions.findIndex((item) => item.key === activity);
  const activityPage = activityIndex >= 0 ? activityIndex + 1 : 1;
  const totalActivityPages = activityOptions.length;

  const resetChallenge = useCallback(() => {
    setFeedback(null);
    setSelectedChoice(null);
    setShowCheckOverlay(false);
    setPresentationFeedback(null);

    if (activity === "skip") {
      setClockTime({ h: 12, m: 0 });
      setSkipTarget(5);
      setTargetTime({ h: 12, m: 5 });
      setChoices([]);
      return;
    }

    const target = createTargetTime(mode, minuteStage);
    setTargetTime(target);

    if (activity === "set") {
      setClockTime(createStartClock(mode, minuteStage, target));
      setChoices([]);
      return;
    }

    setClockTime(target);
    setChoices(buildChoices(target, mode, minuteStage));
  }, [activity, minuteStage, mode]);

  useEffect(() => {
    setActivity(activityOptions[0].key);
  }, [activityOptions]);

  useEffect(() => {
    resetChallenge();
  }, [activity, minuteStage, mode, resetChallenge]);

  useEffect(() => {
    completedActivitiesRef.current = new Set();
    lessonStartedRef.current = false;
    lessonCompletedRef.current = false;
    trackLessonEvent({
      lesson: lessonKey,
      activity: modeActivityKey,
      event: "lesson_opened",
      totalPages: totalActivityPages,
      details: {
        mode,
      },
    });
  }, [mode, modeActivityKey, totalActivityPages]);

  const instructionText = useMemo(() => {
    if (activity === "set") {
      if (mode === "hours") return `Set the clock to ${toHourLabel(targetTime.h)}.`;
      if (mode === "minutes") return `Set the minute hand to ${toMinuteLabel(targetTime.m)}.`;
      return `Set the clock to ${toDigitalTimeLabel(targetTime)}.`;
    }
    if (activity === "read") {
      if (mode === "hours") return "Read the hour and choose the matching label.";
      if (mode === "minutes") return "Read the minutes and choose the matching value.";
      return "Read the full time and choose the correct digital label.";
    }
    if (activity === "match") {
      return "Match the clock to the correct time card.";
    }
    return `Move the minute hand by fives to ${skipTarget}.`;
  }, [activity, mode, skipTarget, targetTime]);

  const draggable = activity === "set" || activity === "skip";
  const showSliders = activity === "set" || activity === "skip";
  const minuteSliderStep = activity === "skip" ? 5 : minuteStage === "five" ? 5 : 1;

  const presentationHighlight = useMemo(() => {
    if (!presentationMode) return null;
    const step = PRESENTATION_STEPS[presentationStep];
    return step ? step.highlight : null;
  }, [presentationMode, presentationStep]);

  const controlsPanel = (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.8)]">
      <div className="flex flex-wrap items-center gap-2">
        {activityOptions.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setActivity(entry.key)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
              entry.key === activity
                ? "border-amber-300 bg-amber-100 text-amber-800"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-stone-600">
        <label className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={presentationMode}
            onChange={(event) => {
              const next = event.target.checked;
              setPresentationMode(next);
              setPresentationStep(next ? 0 : 0);
              setPresentationFeedback(null);
            }}
          />
          Presentation Mode
        </label>
        <label className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
          />
          Sound
        </label>
        {supportsMinuteStage ? (
          <label className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-2">
            Minute Stage
            <select
              value={minuteStage}
              onChange={(event) => setMinuteStage(event.target.value as MinuteStage)}
              className="rounded border border-stone-300 bg-white px-2 py-1 text-xs uppercase tracking-[0.18em] text-stone-700"
            >
              <option value="five">5-minute</option>
              <option value="one">1-minute</option>
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );

  const checkAnswer = useCallback(() => {
    if (!lessonStartedRef.current) {
      lessonStartedRef.current = true;
      trackLessonEvent({
        lesson: lessonKey,
        activity: modeActivityKey,
        event: "lesson_started",
        page: activityPage,
        totalPages: totalActivityPages,
      });
    }

    const markCompletionForCurrentActivity = () => {
      if (completedActivitiesRef.current.has(activity)) return;
      completedActivitiesRef.current.add(activity);
      trackLessonEvent({
        lesson: lessonKey,
        activity: modeActivityKey,
        event: "activity_completed",
        success: true,
        page: activityPage,
        totalPages: totalActivityPages,
        value: activity,
      });

      if (completedActivitiesRef.current.size >= totalActivityPages && !lessonCompletedRef.current) {
        lessonCompletedRef.current = true;
        trackLessonEvent({
          lesson: lessonKey,
          activity: modeActivityKey,
          event: "lesson_completed",
          success: true,
          page: totalActivityPages,
          totalPages: totalActivityPages,
        });
      }
    };

    if (activity === "skip") {
      const current = minuteToStage(clockTime.m, "five");
      if (current === skipTarget) {
        playGentleTone(soundEnabled);
        trackLessonEvent({
          lesson: lessonKey,
          activity: modeActivityKey,
          event: "attempt_result",
          success: true,
          page: activityPage,
          totalPages: totalActivityPages,
          value: `${activity}:${current}`,
        });
        if (skipTarget >= 55) {
          setFeedback("Path complete. You traced all skip-count marks.");
          markCompletionForCurrentActivity();
          return;
        }
        const next = skipTarget + 5;
        setSkipTarget(next);
        setTargetTime({ h: 12, m: next });
        setFeedback(`Nice. Now move to ${next}.`);
        return;
      }
      trackLessonEvent({
        lesson: lessonKey,
        activity: modeActivityKey,
        event: "attempt_result",
        success: false,
        page: activityPage,
        totalPages: totalActivityPages,
        value: `${activity}:${current}`,
      });
      setFeedback("Try moving the long hand to the next skip-count mark.");
      return;
    }

    if (activity === "set") {
      const success = isTimeMatch(clockTime, targetTime, mode, minuteStage);
      trackLessonEvent({
        lesson: lessonKey,
        activity: modeActivityKey,
        event: "attempt_result",
        success,
        page: activityPage,
        totalPages: totalActivityPages,
        value: `${toDigitalTimeLabel(clockTime)}=>${toDigitalTimeLabel(targetTime)}`,
      });
      if (success) {
        playGentleTone(soundEnabled);
        markCompletionForCurrentActivity();
        setFeedback("That matches. The hands align with the prompt.");
      } else {
        setFeedback("Try again. Use the minute track as your control of error.");
      }
      return;
    }

    if (!selectedChoice) {
      setFeedback("Choose one card first.");
      return;
    }
    const selected = choices.find((entry) => keyForTime(entry) === selectedChoice);
    if (!selected) {
      setFeedback("Choose one card first.");
      return;
    }
    const success = isTimeMatch(selected, targetTime, mode, minuteStage);
    trackLessonEvent({
      lesson: lessonKey,
      activity: modeActivityKey,
      event: "attempt_result",
      success,
      page: activityPage,
      totalPages: totalActivityPages,
      value: `${toDigitalTimeLabel(selected)}=>${toDigitalTimeLabel(targetTime)}`,
    });
    if (success) {
      playGentleTone(soundEnabled);
      markCompletionForCurrentActivity();
      setFeedback("Yes. That card matches the clock.");
    } else {
      setFeedback("Not yet. Compare the hands and try another card.");
    }
  }, [
    activity,
    activityPage,
    choices,
    clockTime,
    lessonKey,
    minuteStage,
    mode,
    modeActivityKey,
    selectedChoice,
    skipTarget,
    soundEnabled,
    targetTime,
    totalActivityPages,
  ]);

  const setHourFromSlider = useCallback(
    (nextHour: number) => {
      const normalized = nextHour <= 0 ? 12 : nextHour;
      if (mode === "minutes") {
        setClockTime((previous) => ({ ...previous, h: 12 }));
        return;
      }
      setClockTime((previous) => ({ ...previous, h: normalized }));
      setFeedback(null);
    },
    [mode]
  );

  const setMinuteFromSlider = useCallback(
    (nextMinute: number) => {
      const snappedMinute = minuteToStage(nextMinute, minuteSliderStep === 5 ? "five" : "one");
      if (mode === "hours") {
        setClockTime((previous) => ({ ...previous, m: 0 }));
        return;
      }
      if (mode === "minutes") {
        setClockTime({ h: 12, m: snappedMinute });
      } else {
        setClockTime((previous) => ({ ...previous, m: snappedMinute }));
      }
      setFeedback(null);
    },
    [minuteSliderStep, mode]
  );

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#fdfbf8_55%,#f7efe4)]">
      <HomeLink />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 sm:px-10">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">History &amp; Time</p>
          <h1 className="font-display text-4xl font-semibold text-stone-900">{MODE_TITLES[mode]}</h1>
          <p className="text-sm text-stone-600">{MODE_NOTES[mode]}</p>
        </header>

        {presentationMode ? (
          <section className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-700">
              {PRESENTATION_STEPS[presentationStep]?.title ?? "Presentation complete"}
            </p>
            <p className="mt-2 text-sm text-sky-900">
              {PRESENTATION_STEPS[presentationStep]?.prompt ?? "Repeat any period whenever the child asks."}
            </p>
            {presentationStep === 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {["hour hand", "minute hand", "minute track"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const success = label === "minute hand";
                      setPresentationFeedback(success ? "Yes, that is the minute hand." : "Try again and look for the long hand.");
                    }}
                    className="rounded-full border border-sky-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-sky-700"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {presentationStep === 2 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {["minute track", "hour hand", "clock face"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const success = label === "minute track";
                      setPresentationFeedback(success ? "Correct. That ring is the minute track." : "Try again. The track is the ring with 60 marks.");
                    }}
                    className="rounded-full border border-sky-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-sky-700"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {presentationFeedback ? (
              <p className="mt-2 text-sm text-sky-800">{presentationFeedback}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPresentationStep((previous) => Math.min(previous + 1, PRESENTATION_STEPS.length))}
                className="rounded-full border border-sky-300 bg-sky-600 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
              >
                Next Period
              </button>
              <button
                type="button"
                onClick={() => {
                  setPresentationStep(0);
                  setPresentationFeedback(null);
                }}
                className="rounded-full border border-sky-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-700"
              >
                Restart Presentation
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <TimeClockScene
              mode={mode}
              value={activity === "read" || activity === "match" ? targetTime : clockTime}
              minuteStage={activity === "skip" ? "five" : minuteStage}
              onChange={(next) => setClockTime(next)}
              draggable={draggable}
              showCheckOverlay={showCheckOverlay}
              checkTime={activity === "set" ? targetTime : activity === "skip" ? { h: 12, m: skipTarget } : null}
              highlightPart={presentationHighlight}
              className="h-[520px]"
            />
          </div>
          <aside className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Lesson Prompt</p>
            <p className="mt-2 text-sm text-stone-800">{instructionText}</p>

            {activity === "read" || activity === "match" ? (
              <div className="mt-4 grid gap-2">
                {choices.map((choice) => {
                  const key = keyForTime(choice);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedChoice(key)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        selectedChoice === key
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-stone-300 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-stone-900">{formatForMode(choice, mode)}</p>
                      {activity === "match" ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{toPhraseTimeLabel(choice)}</p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activity === "set" || activity === "skip" ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Current Hands</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  {toDigitalTimeLabel(clockTime)} · {toPhraseTimeLabel(clockTime)}
                </p>
              </div>
            ) : null}

            {showSliders ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Hand Sliders</p>
                {mode !== "minutes" ? (
                  <div className="mt-2">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-stone-600">Hour</label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      step={1}
                      value={clockTime.h}
                      onChange={(event) => setHourFromSlider(Number(event.target.value))}
                      className="mt-1 w-full accent-amber-600"
                    />
                    <p className="text-xs text-stone-600">{toHourLabel(clockTime.h)}</p>
                  </div>
                ) : null}
                {mode !== "hours" ? (
                  <div className="mt-3">
                    <label className="text-[11px] uppercase tracking-[0.2em] text-stone-600">
                      Minute ({minuteSliderStep}-step)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={59}
                      step={minuteSliderStep}
                      value={clockTime.m}
                      onChange={(event) => setMinuteFromSlider(Number(event.target.value))}
                      className="mt-1 w-full accent-sky-600"
                    />
                    <p className="text-xs text-stone-600">{toMinuteLabel(clockTime.m)}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {(activity === "set" || activity === "skip") ? (
              <label className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600">
                <input
                  type="checkbox"
                  checked={showCheckOverlay}
                  onChange={(event) => setShowCheckOverlay(event.target.checked)}
                />
                Show Check Overlay
              </label>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={checkAnswer}
                className="rounded-full border border-emerald-300 bg-emerald-600 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
              >
                Check
              </button>
              <button
                type="button"
                onClick={resetChallenge}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-700"
              >
                New Card
              </button>
              <Link
                href="/lessons/history-time"
                className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-700"
              >
                Back to Modes
              </Link>
            </div>

            {feedback ? (
              <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {feedback}
              </p>
            ) : null}
          </aside>
        </section>
        {controlsPanel}
      </main>
    </div>
  );
}
