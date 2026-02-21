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
      materials={[
        {
          label: "Hour Clock Three-Part Cards",
          href: "/lessons/history-time/hour-clock/three-part-cards",
          badge: "Material",
          mode: "hours",
          value: { h: 8, m: 0 },
          ctaLabel: "Open material",
          note: "12 hour cards across 4 pages.",
        },
      ]}
    />
  );
}
