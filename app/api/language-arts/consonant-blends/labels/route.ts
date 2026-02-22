import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const directory = path.join(
    process.cwd(),
    "public",
    "assets",
    "language_arts",
    "consonant_blend",
    "consonant_blend_word_labels",
  );

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json(
      { files },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { files: [] as string[] },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

