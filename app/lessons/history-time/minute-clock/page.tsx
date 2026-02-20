import HistoryTimeTrackHub from "../../../components/HistoryTimeTrackHub";

export default function MinuteClockHubPage() {
  return (
    <HistoryTimeTrackHub
      title="Minute Clock"
      subtitle="Open minute-track activities with 5-minute then 1-minute work."
      activityLabel="Minute Clock Activities"
      activityHref="/lessons/history-time/minutes"
      badge="Minute"
      mode="minutes"
      value={{ h: 12, m: 25 }}
    />
  );
}
