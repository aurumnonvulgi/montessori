import HistoryTimeTrackHub from "../../../components/HistoryTimeTrackHub";

export default function HourClockHubPage() {
  return (
    <HistoryTimeTrackHub
      title="Hour Clock"
      subtitle="Open hour-only activities before moving to minute work."
      activityLabel="Hour Clock"
      activityHref="/lessons/history-time/hours"
      badge="Hour"
      activityKind="interactive-activity"
      activityCardPosition="last"
      mode="hours"
      value={{ h: 3, m: 0 }}
      materials={[
        {
          label: "Hour Clock",
          href: "/lessons/history-time/hour-clock/three-part-cards",
          badge: "Material",
          activityKind: "tcp-picture-to-picture",
          mode: "hours",
          value: { h: 8, m: 0 },
          ctaLabel: "Open material",
          note: "12 hour cards across 4 pages.",
        },
        {
          label: "Hour Clock",
          href: "/lessons/history-time/hour-clock/three-part-cards-labels",
          badge: "Material",
          activityKind: "tcp-label-to-picture",
          mode: "hours",
          value: { h: 10, m: 0 },
          ctaLabel: "Open material",
          note: "Pictures and full cards are pre-matched; match only the labels.",
        },
        {
          label: "Hour Clock",
          href: "/lessons/history-time/hour-clock/three-part-cards-pictures-labels",
          badge: "Material",
          activityKind: "tcp-picture-and-label-to-picture",
          mode: "hours",
          value: { h: 4, m: 0 },
          ctaLabel: "Open material",
          note: "Match picture and label cards to each hour card.",
        },
      ]}
    />
  );
}
