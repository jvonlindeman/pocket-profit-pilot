import express from "express";
import cors from "cors";
import {
  getItems,
  getItem,
  upsertItem,
  deleteItem,
  itemCount,
  resetToSeed,
  seedIfEmpty,
  DB_PATH,
} from "./db.mjs";

const PORT = Number(process.env.GUNPLA_PORT || 4787);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Seed on first boot if the DB is empty.
const seeded = seedIfEmpty();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, count: itemCount(), db: DB_PATH });
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

app.listen(PORT, () => {
  console.log(`\n🤖 Gunpla inventory API running`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → DB: ${DB_PATH}`);
  if (seeded) console.log(`   → Seeded database from seed.json`);
  console.log(`   → ${itemCount()} kits loaded\n`);
});
