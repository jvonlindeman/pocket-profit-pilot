import express from "express";
import cors from "cors";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { networkInterfaces } from "node:os";
import {
  getItems,
  getItem,
  upsertItem,
  deleteItem,
  itemCount,
  resetToSeed,
  seedIfEmpty,
  getPaints,
  replacePaints,
  backupNow,
  DATA_FILE,
  PHOTOS_DIR,
  BACKUPS_DIR,
} from "./db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");

const PORT = Number(process.env.GUNPLA_PORT || 4787);

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" })); // headroom for base64 photos (downscaled client-side)

// Seed from seed.json on the very first run (no data file yet).
const seeded = seedIfEmpty();

// Automatic daily backups of the JSON data files (kept 14 days).
backupNow();
setInterval(backupNow, 24 * 60 * 60 * 1000).unref();

// --- Version awareness ---------------------------------------------------------
// Best-effort git probe so the UI can show what's running and whether a newer
// version exists upstream. Must never crash or delay startup: tarball installs
// have no .git (version stays null), and offline fetches simply keep the flag.
const run = promisify(execFile);
const GIT_OPTS = {
  timeout: 15000,
  env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
};
const versionInfo = { version: null, updateAvailable: false };

async function refreshVersionInfo() {
  try {
    const { stdout } = await run(
      "git",
      ["-C", __dirname, "rev-parse", "--short", "HEAD"],
      GIT_OPTS
    );
    versionInfo.version = stdout.trim() || null;
  } catch {
    versionInfo.version = null;
    return;
  }
  try {
    await run("git", ["-C", __dirname, "fetch", "--quiet"], GIT_OPTS);
    const [head, upstream] = await Promise.all([
      run("git", ["-C", __dirname, "rev-parse", "HEAD"], GIT_OPTS),
      run("git", ["-C", __dirname, "rev-parse", "@{u}"], GIT_OPTS),
    ]);
    versionInfo.updateAvailable =
      head.stdout.trim() !== upstream.stdout.trim();
  } catch {
    /* offline / no upstream — leave updateAvailable as-is */
  }
}
refreshVersionInfo();
setInterval(refreshVersionInfo, 30 * 60 * 1000).unref();

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    count: itemCount(),
    file: DATA_FILE,
    version: versionInfo.version,
    updateAvailable: versionInfo.updateAvailable,
  });
});

// LAN addresses where a phone/tablet on the same WiFi can reach this server.
app.get("/api/lan", (_req, res) => {
  const ips = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === "IPv4" && !ni.internal) ips.push(ni.address);
    }
  }
  res.json({ port: PORT, ips });
});

app.get("/api/items", (_req, res) => {
  res.json(getItems());
});

app.get("/api/items/:code", (req, res) => {
  const item = getItem(req.params.code);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// Create or update (upsert by code).
app.post("/api/items", (req, res) => {
  try {
    const saved = upsertItem(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

app.put("/api/items/:code", (req, res) => {
  try {
    const saved = upsertItem({ ...req.body, code: req.params.code });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

app.delete("/api/items/:code", (req, res) => {
  const removed = deleteItem(req.params.code);
  if (!removed) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// Reset to the original sheet data.
app.post("/api/reset", (_req, res) => {
  const count = resetToSeed();
  res.json({ ok: true, count });
});

// --- Paint stash (stored in paints.json, separate from the kits) ---------------
app.get("/api/paints", (_req, res) => {
  res.json(getPaints());
});

// Whole-array replace: simplest correct API at personal scale (last write wins).
app.put("/api/paints", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Expected an array of paints" });
  }
  try {
    res.json(replacePaints(req.body));
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

// --- Progress photos: files saved on disk, served at /photos/<filename> -------
const PHOTO_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);

// Save a base64 image, return its filename. The client owns the item.photos list.
app.post("/api/photos", (req, res) => {
  try {
    const { code, ext, base64 } = req.body || {};
    if (!code || !base64) {
      return res.status(400).json({ error: "code and base64 are required" });
    }
    const safeExt = PHOTO_EXTS.has(String(ext).toLowerCase())
      ? String(ext).toLowerCase()
      : "jpg";
    const buf = Buffer.from(base64, "base64");
    if (!buf.length || buf.length > 12 * 1024 * 1024) {
      return res.status(400).json({ error: "Invalid or oversized image" });
    }
    const safeCode = basename(String(code)).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${safeCode}-${Date.now()}.${safeExt}`;
    writeFileSync(join(PHOTOS_DIR, filename), buf);
    res.status(201).json({ filename });
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

// Delete the file from disk (item array is updated client-side via upsert).
app.delete("/api/photos/:filename", (req, res) => {
  try {
    const file = join(PHOTOS_DIR, basename(req.params.filename));
    if (existsSync(file)) unlinkSync(file);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

// Serve photo files (registered before the SPA catch-all so it isn't intercepted).
app.use("/photos", express.static(PHOTOS_DIR));

// In the packaged app we also serve the built frontend from this same server,
// so the whole thing runs as ONE process on ONE origin (no Vite, no proxy).
// In dev this folder doesn't exist and Vite serves the app instead — harmless.
const servingApp = existsSync(DIST_DIR);
if (servingApp) {
  // index: false so "/" falls through to the fallback below, which serves
  // index.html with no-cache — hashed JS/CSS assets keep normal caching.
  app.use(express.static(DIST_DIR, { index: false }));
  // SPA fallback: anything that isn't an /api route returns index.html.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(DIST_DIR, "index.html"), {
      headers: { "Cache-Control": "no-cache" },
    });
  });
}

app.listen(PORT, () => {
  console.log(`\n🤖 Gunpla inventory running`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Data file: ${DATA_FILE}`);
  console.log(`   → ${servingApp ? "Serving app + API" : "API only"}`);
  console.log(`   → Backups: ${BACKUPS_DIR}`);
  if (seeded) console.log(`   → Seeded from seed.json (first run)`);
  console.log(`   → ${itemCount()} kits loaded\n`);
});
