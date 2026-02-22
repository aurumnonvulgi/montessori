#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};

const projectRoot = process.cwd();
const masterRoot = path.resolve(projectRoot, "assets_master");
const publicAssetsRoot = path.resolve(projectRoot, "public", "assets");

const dryRun = hasFlag("--dry-run");
const force = hasFlag("--force");
const showHelp = hasFlag("--help") || hasFlag("-h");
const scopeArg = getArgValue("--scope");
const scopePath = scopeArg ? scopeArg.replace(/^\/+/, "") : null;
const maxDimensionRaw = process.env.ASSET_MAX_DIM ?? "2048";
const qualityRaw = process.env.ASSET_QUALITY ?? "84";
const maxDimension = Number.isFinite(Number(maxDimensionRaw)) ? Math.max(256, Number(maxDimensionRaw)) : 2048;
const quality = Number.isFinite(Number(qualityRaw)) ? Math.max(30, Math.min(100, Number(qualityRaw))) : 84;

const rasterExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const passthroughExtensions = new Set([".svg", ".json", ".txt", ".md", ".mp3", ".wav", ".ogg", ".m4a", ".webm"]);

const counters = {
  total: 0,
  optimized: 0,
  copied: 0,
  skipped: 0,
  failed: 0,
};

process.stdout.on("error", (error) => {
  if (error?.code === "EPIPE") {
    process.exit(0);
  }
});

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const exists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const walk = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
};

const shouldProcessFile = (relativePath) => {
  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => segment.startsWith("."))) {
    return false;
  }
  if (!scopePath) return true;
  const normalized = relativePath.split(path.sep).join("/");
  return normalized.startsWith(scopePath);
};

const sourceIsNewer = async (sourcePath, outputPath) => {
  if (!(await exists(outputPath))) return true;
  const [sourceStat, outputStat] = await Promise.all([fs.stat(sourcePath), fs.stat(outputPath)]);
  return sourceStat.mtimeMs > outputStat.mtimeMs;
};

const optimizeWithSharp = async (sharp, sourcePath, outputPath, extension) => {
  let pipeline = sharp(sourcePath).rotate().resize({
    width: maxDimension,
    height: maxDimension,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (extension === ".png") {
    pipeline = pipeline.png({ compressionLevel: 9, quality, palette: true, effort: 10 });
  } else if (extension === ".jpg" || extension === ".jpeg") {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
  } else if (extension === ".webp") {
    pipeline = pipeline.webp({ quality, effort: 6 });
  } else if (extension === ".avif") {
    pipeline = pipeline.avif({ quality, effort: 7 });
  }

  await pipeline.toFile(outputPath);
};

const copyFile = async (sourcePath, outputPath) => {
  await fs.copyFile(sourcePath, outputPath);
};

const main = async () => {
  if (showHelp) {
    console.log("Usage: node scripts/sync-master-assets.mjs [--dry-run] [--force] [--scope relative/path]");
    console.log("");
    console.log("Syncs assets from assets_master/ to public/assets/ and optimizes raster files.");
    console.log("Env: ASSET_MAX_DIM (default 2048), ASSET_QUALITY (default 84)");
    return;
  }

  if (!(await exists(masterRoot))) {
    console.error("[assets:optimize] Missing assets_master folder.");
    console.error("Run: npm run assets:master:init");
    process.exit(1);
  }

  const files = await walk(masterRoot);
  if (!files.length) {
    console.log("[assets:optimize] assets_master is empty. Nothing to process.");
    return;
  }

  let sharp = null;
  try {
    const imported = await import("sharp");
    sharp = imported.default;
  } catch {
    console.warn("[assets:optimize] 'sharp' not found. Falling back to plain copy.");
  }

  for (const sourcePath of files) {
    const relativePath = path.relative(masterRoot, sourcePath);
    if (!shouldProcessFile(relativePath)) continue;

    counters.total += 1;

    const outputPath = path.join(publicAssetsRoot, relativePath);
    const outputDir = path.dirname(outputPath);
    const extension = path.extname(sourcePath).toLowerCase();

    try {
      if (!force && !(await sourceIsNewer(sourcePath, outputPath))) {
        counters.skipped += 1;
        continue;
      }

      await ensureDir(outputDir);

      if (dryRun) {
        if (sharp && rasterExtensions.has(extension)) {
          console.log(`[dry-run] optimize ${relativePath}`);
        } else {
          console.log(`[dry-run] copy ${relativePath}`);
        }
        continue;
      }

      if (sharp && rasterExtensions.has(extension)) {
        await optimizeWithSharp(sharp, sourcePath, outputPath, extension);
        counters.optimized += 1;
      } else if (passthroughExtensions.has(extension) || !rasterExtensions.has(extension)) {
        await copyFile(sourcePath, outputPath);
        counters.copied += 1;
      }
    } catch (error) {
      counters.failed += 1;
      console.error(`[assets:optimize] Failed ${relativePath}`);
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  if (dryRun) {
    console.log(`[assets:optimize] Dry run complete. ${counters.total} file(s) would be processed.`);
    return;
  }

  console.log("[assets:optimize] Complete.");
  console.log(`  Processed: ${counters.total}`);
  console.log(`  Optimized: ${counters.optimized}`);
  console.log(`  Copied:    ${counters.copied}`);
  console.log(`  Skipped:   ${counters.skipped}`);
  console.log(`  Failed:    ${counters.failed}`);

  if (counters.failed > 0) {
    process.exitCode = 1;
  }
};

await main();
