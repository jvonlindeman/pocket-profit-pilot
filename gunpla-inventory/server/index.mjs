import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getItems,
  getItem,
  upsertItem,
  deleteItem,
  itemCount,
  resetToSeed,
  seedIfEmpty,
  DATA_FILE,
} from "./db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");

const PORT = Number(process.env.GUNPLA_PORT || 4787);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Seed from seed.json on the very first run (no data file yet).
const seeded = seedIfEmpty();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, count: itemCount(), file: DATA_FILE });
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

// In the packaged app we also serve the built frontend from this same server,
// so the whole thing runs as ONE process on ONE origin (no Vite, no proxy).
// In dev this folder doesn't exist and Vite serves the app instead — harmless.
const servingApp = existsSync(DIST_DIR);
if (servingApp) {
  app.use(express.static(DIST_DIR));
  // SPA fallback: anything that isn't an /api route returns index.html.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\n🤖 Gunpla inventory running`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Data file: ${DATA_FILE}`);
  console.log(`   → ${servingApp ? "Serving app + API" : "API only"}`);
  if (seeded) console.log(`   → Seeded from seed.json (first run)`);
  console.log(`   → ${itemCount()} kits loaded\n`);
});
