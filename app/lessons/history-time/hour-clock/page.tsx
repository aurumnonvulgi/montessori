import HistoryTimeTrackHub from "../../../components/HistoryTimeTrackHub";

export default function HourClockHubPage() {
  return (
    <HistoryTimeTrackHub
      title="Hour Clock"
      subtitle="Open hour-only activities before moving to minute work."
      activityLabel="Hour Clock Activities"
      activityHref="/lessons/history-time/hours"
      badge="Hour"
      mode="hours"
      value={{ h: 3, m: 0 }}
    />
  );
}
