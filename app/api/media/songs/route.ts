import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]);

export const dynamic = "force-dynamic";

export async function GET() {
  const songsDirectory = path.join(process.cwd(), "public", "assets", "media", "songs");

  try {
    const entries = await fs.readdir(songsDirectory, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => AUDIO_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/assets/media/songs/${encodeURIComponent(name)}`);

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
