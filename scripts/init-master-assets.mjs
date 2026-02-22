#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const overwrite = hasFlag("--overwrite");
const showHelp = hasFlag("--help") || hasFlag("-h");

const projectRoot = process.cwd();
const sourceRoot = path.resolve(projectRoot, "public", "assets");
const masterRoot = path.resolve(projectRoot, "assets_master");

const counters = {
  copied: 0,
  skipped: 0,
  failed: 0,
};

process.stdout.on("error", (error) => {
  if (error?.code === "EPIPE") {
    process.exit(0);
  }
});

const exists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
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

const main = async () => {
  if (showHelp) {
    console.log("Usage: node scripts/init-master-assets.mjs [--overwrite]");
    console.log("");
    console.log("Copies current public/assets/ into assets_master/ for high-resolution source management.");
    return;
  }

  if (!(await exists(sourceRoot))) {
    console.error("[assets:master:init] Missing public/assets. Nothing to initialize.");
    process.exit(1);
  }

  await ensureDir(masterRoot);

  const files = await walk(sourceRoot);
  for (const sourceFile of files) {
    const relativePath = path.relative(sourceRoot, sourceFile);
    if (relativePath.split(path.sep).some((segment) => segment.startsWith("."))) {
      continue;
    }
    const targetFile = path.join(masterRoot, relativePath);
    const targetDir = path.dirname(targetFile);

    try {
      await ensureDir(targetDir);

      if (!overwrite && (await exists(targetFile))) {
        counters.skipped += 1;
        continue;
      }

      await fs.copyFile(sourceFile, targetFile);
      counters.copied += 1;
    } catch (error) {
      counters.failed += 1;
      console.error(`[assets:master:init] Failed ${relativePath}`);
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  console.log("[assets:master:init] Complete.");
  console.log(`  Copied:  ${counters.copied}`);
  console.log(`  Skipped: ${counters.skipped}`);
  console.log(`  Failed:  ${counters.failed}`);

  if (counters.failed > 0) {
    process.exitCode = 1;
  }
};

await main();
