#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".vercel",
  ".turbo",
  "node_modules",
  "coverage",
  "dist",
  "build",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif", ".gif", ".bmp", ".ico"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg", ".aac", ".flac", ".webm"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".avi", ".webm"]);

const normalizePath = (value) => value.split(path.sep).join("/");

const shouldSkipDirectory = (name) => {
  if (IGNORED_DIRECTORIES.has(name)) return true;
  return name.startsWith(".");
};

const toCreatedTimestamp = (birthtimeMs, mtimeMs) => {
  if (Number.isFinite(birthtimeMs) && birthtimeMs > 0) return birthtimeMs;
  return mtimeMs;
};

const incrementMap = (map, key, amount = 1) => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

const sortByCount = (map) =>
  [...map.entries()].sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]));

const oldest = (items) => {
  if (!items.length) return null;
  return items.reduce((current, next) => (next.createdMs < current.createdMs ? next : current));
};

const newest = (items) => {
  if (!items.length) return null;
  return items.reduce((current, next) => (next.createdMs > current.createdMs ? next : current));
};

const isImageFile = (item) => IMAGE_EXTENSIONS.has(item.extension);
const isAudioFile = (item) => AUDIO_EXTENSIONS.has(item.extension);
const isVideoFile = (item) => VIDEO_EXTENSIONS.has(item.extension);

async function collectFiles(baseDirectory, relativeDirectory = "") {
  const targetDirectory = relativeDirectory
    ? path.join(baseDirectory, relativeDirectory)
    : baseDirectory;

  const entries = await fs.readdir(targetDirectory, { withFileTypes: true }).catch(() => null);
  if (!entries) return [];

  const snapshots = [];

  for (const entry of entries) {
    const relPath = relativeDirectory
      ? normalizePath(path.join(relativeDirectory, entry.name))
      : entry.name;
    const absolutePath = path.join(targetDirectory, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name)) continue;
      snapshots.push(...(await collectFiles(baseDirectory, relPath)));
      continue;
    }

    if (!entry.isFile()) continue;

    try {
      const stats = await fs.stat(absolutePath);
      snapshots.push({
        relPath,
        extension: path.extname(entry.name).toLowerCase(),
        size: stats.size,
        createdMs: toCreatedTimestamp(stats.birthtimeMs, stats.mtimeMs),
        modifiedMs: stats.mtimeMs,
      });
    } catch {
      // Skip files that cannot be read while scanning.
    }
  }

  return snapshots;
}

async function writeJson(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const projectRoot = process.cwd();
  const files = await collectFiles(projectRoot);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const pageFiles = files.filter(
    (file) => file.relPath.startsWith("app/") && file.relPath.endsWith("/page.tsx"),
  );
  const lessonPageFiles = files.filter(
    (file) => file.relPath.startsWith("app/lessons/") && file.relPath.endsWith("/page.tsx"),
  );
  const dynamicLessonRoutes = lessonPageFiles.filter((file) => file.relPath.includes("/[")).length;
  const apiRouteFiles = files.filter(
    (file) => file.relPath.startsWith("app/api/") && file.relPath.endsWith("/route.ts"),
  );
  const componentFiles = files.filter(
    (file) => file.relPath.startsWith("app/components/") && file.extension === ".tsx",
  );

  const publicAssetFiles = files.filter((file) => file.relPath.startsWith("public/assets/"));
  const masterAssetFiles = files.filter((file) => file.relPath.startsWith("assets_master/"));

  const publicAudioFiles = files.filter(
    (file) =>
      (file.relPath.startsWith("public/assets/") || file.relPath.startsWith("public/audio/")) &&
      isAudioFile(file),
  );
  const masterAudioFiles = files.filter(
    (file) => file.relPath.startsWith("assets_master/") && isAudioFile(file),
  );
  const publicImageFiles = files.filter(
    (file) => file.relPath.startsWith("public/assets/") && isImageFile(file),
  );
  const masterImageFiles = files.filter(
    (file) => file.relPath.startsWith("assets_master/") && isImageFile(file),
  );
  const allAudioFiles = files.filter(isAudioFile);
  const allImageFiles = files.filter(isImageFile);
  const allVideoFiles = files.filter(isVideoFile);

  const topLevelCounts = new Map();
  const extensionCounts = new Map();
  const lessonSubjectCounts = new Map();

  files.forEach((file) => {
    const [topLevel] = file.relPath.split("/");
    incrementMap(topLevelCounts, topLevel || "(root)");
    incrementMap(extensionCounts, file.extension || "(no ext)");
  });

  lessonPageFiles.forEach((file) => {
    const parts = file.relPath.split("/");
    incrementMap(lessonSubjectCounts, parts[2] ?? "(root lessons)");
  });

  const topTopLevel = sortByCount(topLevelCounts).slice(0, 10);
  const topExtensions = sortByCount(extensionCounts).slice(0, 14);
  const lessonSubjects = sortByCount(lessonSubjectCounts);
  const largestFiles = [...files]
    .sort((a, b) => (a.size === b.size ? a.relPath.localeCompare(b.relPath) : b.size - a.size))
    .slice(0, 12);

  const snapshot = {
    generatedAtISO: new Date().toISOString(),
    totals: {
      files: files.length,
      sizeBytes: totalSize,
    },
    pages: {
      total: pageFiles.length,
      lesson: lessonPageFiles.length,
      dynamicLesson: dynamicLessonRoutes,
    },
    components: {
      total: componentFiles.length,
      apiRoutes: apiRouteFiles.length,
    },
    media: {
      total: allImageFiles.length + allAudioFiles.length + allVideoFiles.length,
      images: allImageFiles.length,
      audio: allAudioFiles.length,
      video: allVideoFiles.length,
    },
    assets: {
      total: publicAssetFiles.length + masterAssetFiles.length,
      public: publicAssetFiles.length,
      master: masterAssetFiles.length,
      publicMedia: {
        total: publicImageFiles.length + publicAudioFiles.length,
        images: publicImageFiles.length,
        audio: publicAudioFiles.length,
      },
      masterMedia: {
        total: masterImageFiles.length + masterAudioFiles.length,
        images: masterImageFiles.length,
        audio: masterAudioFiles.length,
      },
    },
    moments: {
      oldestPage: oldest(pageFiles),
      newestPage: newest(pageFiles),
      oldestLessonPage: oldest(lessonPageFiles),
      newestLessonPage: newest(lessonPageFiles),
      oldestFile: oldest(files),
      newestFile: newest(files),
    },
    lessonSubjects: lessonSubjects.map(([name, count]) => ({ name, count })),
    topLevels: topTopLevel.map(([name, count]) => ({ name, count })),
    extensions: topExtensions.map(([name, count]) => ({ name, count })),
    largestFiles,
  };

  const appDataPath = path.join(projectRoot, "app", "data", "app-stats.json");
  const publicDataPath = path.join(projectRoot, "public", "stats", "app-stats.json");

  await writeJson(appDataPath, snapshot);
  await writeJson(publicDataPath, snapshot);

  console.log("[generate-app-stats] Snapshot written.");
  console.log(`  ${normalizePath(path.relative(projectRoot, appDataPath))}`);
  console.log(`  ${normalizePath(path.relative(projectRoot, publicDataPath))}`);
  console.log(`  Files scanned: ${snapshot.totals.files}`);
}

await main();
