import HistoryTimeTrackHub from "../../../components/HistoryTimeTrackHub";

export default function ClockHubPage() {
  return (
    <HistoryTimeTrackHub
      title="Clock"
      subtitle="Open full clock activities combining hours and minutes."
      activityLabel="Clock Activities"
      activityHref="/lessons/history-time/both"
      badge="Full"
      mode="both"
      value={{ h: 4, m: 25 }}
    />
  );
}
