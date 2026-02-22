import Link from "next/link";

type TopicStat = {
  label: string;
  materials: number;
  activities: number;
  colorClass: string;
};

type SubjectStat = {
  label: string;
  materials: number;
  activities: number;
  colorClass: string;
  topics: TopicStat[];
};

type CategoryProgress = {
  label: string;
  percent: number;
  status: string;
  detail: string;
  color: string;
};

type RecentEvent = {
  lesson: string;
  activity: string;
  result: "Success" | "Retry";
  attempts: number;
  when: string;
};

const SUBJECTS: SubjectStat[] = [
  {
    label: "Language Arts",
    materials: 27,
    activities: 192,
    colorClass: "from-violet-50 to-indigo-50",
    topics: [
      { label: "Phonics | Pink", materials: 6, activities: 60, colorClass: "bg-sky-500" },
      { label: "Consonant Blends", materials: 5, activities: 84, colorClass: "bg-blue-500" },
      { label: "Initial Sound", materials: 8, activities: 24, colorClass: "bg-fuchsia-500" },
      { label: "Concept Dev", materials: 4, activities: 12, colorClass: "bg-amber-500" },
      { label: "Lilac Lists", materials: 4, activities: 12, colorClass: "bg-violet-500" },
    ],
  },
  {
    label: "Mathematics",
    materials: 8,
    activities: 58,
    colorClass: "from-emerald-50 to-green-50",
    topics: [
      { label: "Number Rods", materials: 1, activities: 10, colorClass: "bg-rose-500" },
      { label: "Teen Boards", materials: 2, activities: 14, colorClass: "bg-indigo-500" },
      { label: "Core Materials", materials: 5, activities: 34, colorClass: "bg-emerald-500" },
    ],
  },
  {
    label: "History & Time",
    materials: 6,
    activities: 81,
    colorClass: "from-cyan-50 to-sky-50",
    topics: [
      { label: "Hour Clock", materials: 3, activities: 30, colorClass: "bg-cyan-500" },
      { label: "Minute Clock", materials: 3, activities: 48, colorClass: "bg-sky-500" },
      { label: "Clock Mixed", materials: 1, activities: 3, colorClass: "bg-teal-500" },
    ],
  },
  {
    label: "Geometry",
    materials: 1,
    activities: 12,
    colorClass: "from-blue-50 to-cyan-50",
    topics: [{ label: "Geometry Cabinet", materials: 1, activities: 12, colorClass: "bg-blue-500" }],
  },
];

const CATEGORY_PROGRESS: CategoryProgress[] = [
  {
    label: "Language",
    percent: 74,
    status: "74% in progress",
    detail: "Strong repetition in Pink + Initial Sound",
    color: "#7c3aed",
  },
  {
    label: "History & Time",
    percent: 57,
    status: "57% in progress",
    detail: "Minute chunk groups still in progress",
    color: "#0891b2",
  },
  {
    label: "Math",
    percent: 82,
    status: "82% in progress",
    detail: "Core counting flow mostly complete",
    color: "#16a34a",
  },
  {
    label: "Geometry",
    percent: 21,
    status: "21% in progress",
    detail: "First tray exploration started",
    color: "#2563eb",
  },
  {
    label: "Cultural",
    percent: 0,
    status: "Not started",
    detail: "Tracking ready once lessons are added",
    color: "#f59e0b",
  },
  {
    label: "Sensorial",
    percent: 0,
    status: "Not started",
    detail: "Tracking ready once lessons are added",
    color: "#db2777",
  },
];

const RECENT_EVENTS: RecentEvent[] = [
  {
    lesson: "Moveable Alphabet",
    activity: "Vowel E · Stage 3",
    result: "Success",
    attempts: 12,
    when: "Today 7:42 PM",
  },
  {
    lesson: "Blue Booklet",
    activity: "Blend CL · Quiz",
    result: "Retry",
    attempts: 6,
    when: "Today 6:28 PM",
  },
  {
    lesson: "Hour Clock",
    activity: "Set the Clock",
    result: "Success",
    attempts: 9,
    when: "Today 5:56 PM",
  },
  {
    lesson: "Number Rods",
    activity: "Stage 1",
    result: "Success",
    attempts: 4,
    when: "Today 5:10 PM",
  },
];

const totalSubjects = SUBJECTS.length;
const totalMaterials = SUBJECTS.reduce((sum, subject) => sum + subject.materials, 0);
const totalActivities = SUBJECTS.reduce((sum, subject) => sum + subject.activities, 0);

export default function DashboardLandingDemo() {
  return (
    <div className="space-y-5 rounded-3xl border border-stone-200 bg-white/95 p-4 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.65)] sm:p-5">
      <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Dashboard Preview</p>
            <p className="mt-1 text-sm text-stone-600">Demo data only. Real dashboard updates from live activity tracking.</p>
          </div>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700">
            Fake Progress Data
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-700">Subjects</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-900">{totalSubjects}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sky-700">Materials</p>
            <p className="mt-1 text-2xl font-semibold text-sky-900">{totalMaterials}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-700">Activities</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">{totalActivities}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {SUBJECTS.map((subject) => {
          const maxActivities = Math.max(...subject.topics.map((topic) => topic.activities), 1);
          return (
            <article key={subject.label} className={`rounded-2xl border border-stone-200 bg-gradient-to-br ${subject.colorClass} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-stone-900">{subject.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-600">
                    {subject.materials} materials · {subject.activities} activities
                  </p>
                </div>
                <div className="flex h-12 items-end gap-1 rounded-lg border border-white/80 bg-white/70 px-2 py-1">
                  {subject.topics.map((topic) => {
                    const height = Math.max(14, Math.round((topic.activities / maxActivities) * 38));
                    return <span key={`${subject.label}-${topic.label}`} className={`w-2 rounded-t ${topic.colorClass}`} style={{ height }} />;
                  })}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {subject.topics.map((topic) => {
                  const width = Math.max(8, Math.round((topic.activities / Math.max(subject.activities, 1)) * 100));
                  return (
                    <div key={`${subject.label}-${topic.label}-row`} className="rounded-xl border border-white/80 bg-white/75 p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-stone-800">{topic.label}</p>
                        <p className="text-[11px] text-stone-600">
                          {topic.materials} materials · {topic.activities} activities
                        </p>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/80">
                        <div className={`h-full rounded-full ${topic.colorClass}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">Tracked Events</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">438</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">Attempts</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">1,982</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-500">Success Rate</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">86%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-700">Category Progress</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700"
          >
            Open Real Dashboard
          </Link>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {CATEGORY_PROGRESS.map((item) => (
            <div key={item.label} className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-stone-900">{item.label}</p>
                <p className="text-xs font-semibold" style={{ color: item.color }}>
                  {item.status}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
              </div>
              <p className="mt-1 text-[11px] text-stone-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-stone-700">Recent Activity (Sample)</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-[11px] uppercase tracking-[0.2em] text-stone-500">
                <th className="px-2 py-2 font-semibold">Lesson</th>
                <th className="px-2 py-2 font-semibold">Activity</th>
                <th className="px-2 py-2 font-semibold">Result</th>
                <th className="px-2 py-2 font-semibold">Attempts</th>
                <th className="px-2 py-2 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_EVENTS.map((event) => (
                <tr key={`${event.lesson}-${event.activity}-${event.when}`} className="border-b border-stone-100 text-stone-700">
                  <td className="px-2 py-2 font-medium">{event.lesson}</td>
                  <td className="px-2 py-2">{event.activity}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        event.result === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {event.result}
                    </span>
                  </td>
                  <td className="px-2 py-2">{event.attempts}</td>
                  <td className="px-2 py-2 text-stone-500">{event.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
