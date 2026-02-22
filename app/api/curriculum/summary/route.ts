import { NextResponse } from "next/server";

export const dynamic = "force-static";

type CurriculumRow = {
  subject: string;
  lesson: string;
  activities: number;
};

const ROWS: CurriculumRow[] = [
  { subject: "Language Arts", lesson: "Phonics | Pink Series", activities: 30 },
  { subject: "Language Arts", lesson: "Consonant Blends | Blue Series", activities: 120 },
  { subject: "Language Arts", lesson: "Initial Sound", activities: 130 },
  { subject: "Language Arts", lesson: "Lilac", activities: 30 },
  { subject: "Language Arts", lesson: "Concept Development", activities: 4 },
  { subject: "Mathematics", lesson: "Number Rods", activities: 4 },
  { subject: "Mathematics", lesson: "Sandpaper Numerals", activities: 3 },
  { subject: "Mathematics", lesson: "Spindle Boxes", activities: 2 },
  { subject: "Mathematics", lesson: "Numerals & Counters", activities: 4 },
  { subject: "Mathematics", lesson: "Short Bead Stair", activities: 1 },
  { subject: "Mathematics", lesson: "Teen Board Quantities", activities: 1 },
  { subject: "Mathematics", lesson: "Teen Board Symbols", activities: 1 },
  { subject: "Mathematics", lesson: "Hundred Board", activities: 10 },
  { subject: "History & Time", lesson: "Hour Clock", activities: 15 },
  { subject: "History & Time", lesson: "Minute Clock", activities: 39 },
  { subject: "History & Time", lesson: "Clock", activities: 3 },
  { subject: "Geometry", lesson: "Geometry Cabinet | First Tray", activities: 1 },
];

export function GET() {
  const totals = {
    subjects: new Set(ROWS.map((row) => row.subject)).size,
    lessons: ROWS.length,
    activities: ROWS.reduce((sum, row) => sum + row.activities, 0),
  };

  return NextResponse.json(
    {
      generatedAtISO: new Date().toISOString(),
      totals,
      rows: ROWS,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
