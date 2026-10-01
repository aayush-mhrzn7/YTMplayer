import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");

function copyStatic() {
  mkdirSync(join(dist, "content"), { recursive: true });
  mkdirSync(join(dist, "icons"), { recursive: true });
  cpSync(join(root, "manifest.json"), join(dist, "manifest.json"));
  cpSync(join(root, "popup.html"), join(dist, "popup.html"));
  cpSync(join(root, "src/popup/popup.css"), join(dist, "popup.css"));
  cpSync(join(root, "icons"), join(dist, "icons"), { recursive: true });
}

const shared = {
  bundle: true,
  sourcemap: true,
  target: "es2022",
  logLevel: "info",
};

const builds = [
  {
    ...shared,
    entryPoints: [join(root, "src/background.ts")],
    outfile: join(dist, "background.js"),
    format: "esm",
  },
  {
    ...shared,
    entryPoints: [join(root, "src/content/ytm.ts")],
    outfile: join(dist, "content/ytm.js"),
    format: "iife",
  },
  {
    ...shared,
    entryPoints: [join(root, "src/content/overlay.ts")],
    outfile: join(dist, "content/overlay.js"),
    format: "iife",
    loader: { ".css": "text" },
  },
  {
    ...shared,
    entryPoints: [join(root, "src/popup/popup.ts")],
    outfile: join(dist, "popup.js"),
    format: "iife",
  },
];

async function run() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  copyStatic();

  if (watch) {
    const contexts = await Promise.all(builds.map((o) => esbuild.context(o)));
    await Promise.all(contexts.map((c) => c.watch()));
    console.log("Watching… reload the extension in chrome://extensions after rebuilds.");
  } else {
    await Promise.all(builds.map((o) => esbuild.build(o)));
    console.log("Build complete → dist/");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
