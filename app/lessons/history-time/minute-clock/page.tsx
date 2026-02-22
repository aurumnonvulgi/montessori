import HistoryTimeTrackHub from "../../../components/HistoryTimeTrackHub";

export default function MinuteClockHubPage() {
  return (
    <HistoryTimeTrackHub
      title="Minute Clock"
      subtitle="Open minute-track activities with 5-minute then 1-minute work."
      activityLabel="Minute Clock"
      activityHref="/lessons/history-time/minutes"
      badge="Minute"
      activityKind="interactive-activity"
      activityCardPosition="last"
      mode="minutes"
      value={{ h: 12, m: 25 }}
      materials={[
        {
          label: "Minute Clock",
          href: "/lessons/history-time/minute-clock/three-part-cards",
          badge: "Material",
          activityKind: "tcp-picture-to-picture",
          mode: "minutes",
          value: { h: 1, m: 25 },
          ctaLabel: "Open material",
          note: "Choose a 10-minute range, then match 10 cards in 3-card layout pages.",
        },
        {
          label: "Minute Clock",
          href: "/lessons/history-time/minute-clock/three-part-cards-labels",
          badge: "Material",
          activityKind: "tcp-label-to-picture",
          mode: "minutes",
          value: { h: 1, m: 50 },
          ctaLabel: "Open material",
          note: "Choose a 10-minute range; pictures/full cards are pre-matched and only labels are draggable.",
        },
        {
          label: "Minute Clock",
          href: "/lessons/history-time/minute-clock/three-part-cards-pictures-labels",
          badge: "Material",
          activityKind: "tcp-picture-and-label-to-picture",
          mode: "minutes",
          value: { h: 1, m: 5 },
          ctaLabel: "Open material",
          note: "Choose a 10-minute range, then match both picture and label cards.",
        },
      ]}
    />
  );
}
