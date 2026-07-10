// JSON-file store for the Gunpla inventory.
//
// Your data lives in a plain, human-readable JSON file in your Documents
// folder — OUTSIDE the app bundle — so:
//   • updating the app never touches it,
//   • you can open / read / edit / back it up like any other file,
//   • it syncs with iCloud / Dropbox if that folder is synced.
//
// Default location:  ~/Documents/Gunpla Inventory/inventory.json
// Override with the GUNPLA_DATA_FILE (full path) or GUNPLA_DATA_DIR env vars.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  copyFileSync,
  readdirSync,
  rmSync,
} from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, "seed.json");

const DEFAULT_DIR = join(homedir(), "Documents", "Gunpla Inventory");
const DATA_FILE =
  process.env.GUNPLA_DATA_FILE ||
  join(process.env.GUNPLA_DATA_DIR || DEFAULT_DIR, "inventory.json");

mkdirSync(dirname(DATA_FILE), { recursive: true });

// Progress photos live as real files next to inventory.json, so they show up in
// Finder / iCloud and never bloat the JSON (only filenames are stored on items).
const PHOTOS_DIR = join(dirname(DATA_FILE), "photos");
mkdirSync(PHOTOS_DIR, { recursive: true });

const PRIORITIES = new Set(["high", "medium", "low"]);

/** Coerce an incoming item into the canonical on-disk shape. */
function normalize(item) {
  const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  return {
    code: String(item.code || "").trim(),
    name: String(item.name || "").trim(),
    grade: String(item.grade || "").trim(),
    brand: String(item.brand || "").trim(),
    scale: String(item.scale || "").trim(),
    thirdPartyDecals: !!item.thirdPartyDecals,
    peebsLimited: String(item.peebsLimited || ""),
    location: String(item.location || ""),
    quantity: num(item.quantity),
    paid: num(item.paid),
    source: String(item.source || ""),
    status: String(item.status || "Backlog"),
    sell: !!item.sell,
    delpiLink: String(item.delpiLink || ""),
    review: String(item.review || ""),
    stages: Array.isArray(item.stages)
      ? item.stages.filter((s) => typeof s === "string")
      : [],
    skippedStages: Array.isArray(item.skippedStages)
      ? item.skippedStages.filter((s) => typeof s === "string")
      : [],
    photos: Array.isArray(item.photos)
      ? item.photos.filter((p) => typeof p === "string")
      : [],
    stageNotes:
      item.stageNotes && typeof item.stageNotes === "object"
        ? Object.fromEntries(
            Object.entries(item.stageNotes)
              .filter(([, v]) => typeof v === "string" && v.trim() !== "")
              .map(([k, v]) => [String(k), String(v)])
          )
        : {},
    paints: Array.isArray(item.paints)
      ? item.paints
          .map((p) => ({
            area: String(p?.area || "").trim(),
            paint: String(p?.paint || "").trim(),
          }))
          .filter((p) => p.area || p.paint)
      : [],
    startedAt:
      typeof item.startedAt === "string" && item.startedAt.trim()
        ? item.startedAt.trim()
        : null,
    finishedAt:
      typeof item.finishedAt === "string" && item.finishedAt.trim()
        ? item.finishedAt.trim()
        : null,
    priority: PRIORITIES.has(item.priority) ? item.priority : null,
  };
}

// In-memory copy, keyed by code. The JSON file is the durable source of truth.
let itemsByCode = new Map();
let fileExisted = existsSync(DATA_FILE);

/** Read + parse the data file. Returns null if it doesn't exist yet. */
function readDataFile() {
  if (!existsSync(DATA_FILE)) return null;
  const raw = readFileSync(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Never silently lose data: stash the unreadable file and start empty.
    const backup = `${DATA_FILE}.corrupt-${Date.now()}`;
    try {
      writeFileSync(backup, raw, "utf8");
    } catch {
      /* ignore */
    }
    console.warn(
      `⚠️  ${DATA_FILE} was unreadable; backed it up to ${backup} and started empty.`
    );
    return [];
  }
}

/** Atomically write the current items to disk (write temp, then rename). */
function persist() {
  const arr = [...itemsByCode.values()].sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(arr, null, 2)}\n`, "utf8");
  renameSync(tmp, DATA_FILE);
}

function ingest(items) {
  itemsByCode = new Map();
  for (const it of items) {
    // Skip stray nulls / non-objects from a hand-edited file (don't crash boot).
    if (!it || typeof it !== "object") continue;
    const n = normalize(it);
    if (n.code) itemsByCode.set(n.code, n);
  }
}

// Load whatever is already on disk at boot.
const onDisk = readDataFile();
if (onDisk) ingest(onDisk);

export function getItems() {
  return [...itemsByCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function getItem(code) {
  return itemsByCode.get(code) || null;
}

export function upsertItem(item) {
  const n = normalize(item);
  if (!n.code) throw new Error("code is required");
  itemsByCode.set(n.code, n);
  persist();
  return n;
}

export function deleteItem(code) {
  const existed = itemsByCode.delete(code);
  if (existed) persist();
  return existed;
}

export function itemCount() {
  return itemsByCode.size;
}

/** Replace every item (used by reset + first-run seed). */
export function replaceAll(items) {
  ingest(items);
  persist();
  return itemsByCode.size;
}

/**
 * Seed from seed.json only on a true first run (no data file yet). If the file
 * already exists — even empty, because you deleted everything — we leave it
 * alone so your choices stick across restarts.
 */
export function seedIfEmpty() {
  if (fileExisted || itemsByCode.size > 0) return false;
  try {
    const seed = JSON.parse(readFileSync(SEED_FILE, "utf8"));
    replaceAll(Array.isArray(seed) ? seed : []);
  } catch (err) {
    // A missing/broken seed must not prevent the app from starting empty.
    console.warn(`⚠️  Could not read seed.json: ${err.message}. Starting empty.`);
  }
  fileExisted = true;
  return true;
}

/** Force a reset back to the original sheet data in seed.json. */
export function resetToSeed() {
  const seed = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  return replaceAll(seed);
}

// --- Paint stash: a second, independent store in paints.json -------------------
// Kept fully separate from the kits store so a malformed paints write can never
// touch inventory.json. Same safety patterns: corrupt-file backup + atomic write.

const PAINTS_FILE = join(dirname(DATA_FILE), "paints.json");
const PAINT_STATUSES = new Set(["ok", "low", "out"]);

function normalizePaint(p, i) {
  return {
    id: String(p?.id || "").trim() || `paint-${Date.now()}-${i}`,
    brand: String(p?.brand || "").trim(),
    code: String(p?.code || "").trim(),
    name: String(p?.name || "").trim(),
    type: String(p?.type || "").trim(),
    status: PAINT_STATUSES.has(p?.status) ? p.status : "ok",
  };
}

let paints = [];
if (existsSync(PAINTS_FILE)) {
  const raw = readFileSync(PAINTS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) paints = parsed.map(normalizePaint);
  } catch {
    const backup = `${PAINTS_FILE}.corrupt-${Date.now()}`;
    try {
      writeFileSync(backup, raw, "utf8");
    } catch {
      /* ignore */
    }
    console.warn(
      `⚠️  ${PAINTS_FILE} was unreadable; backed it up to ${backup} and started empty.`
    );
  }
}

function persistPaints() {
  const tmp = `${PAINTS_FILE}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(paints, null, 2)}\n`, "utf8");
  renameSync(tmp, PAINTS_FILE);
}

export function getPaints() {
  return [...paints];
}

/** Replace the whole stash (single-user app: last write wins). */
export function replacePaints(arr) {
  const seen = new Set();
  paints = arr
    .map(normalizePaint)
    .filter((p) => p.brand || p.code || p.name)
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  persistPaints();
  return getPaints();
}

// --- Automatic backups ----------------------------------------------------------
// Dated copies of the two JSON files (the fragile part of the data) next to them:
//   <data dir>/Backups/YYYY-MM-DD/inventory.json + paints.json
// Photos are already one-file-per-photo and are not duplicated. Keeps last 14 days.

const BACKUPS_DIR = join(dirname(DATA_FILE), "Backups");
const KEEP_BACKUPS = 14;

export function backupNow() {
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const dir = join(BACKUPS_DIR, stamp);
    mkdirSync(dir, { recursive: true });
    if (existsSync(DATA_FILE)) copyFileSync(DATA_FILE, join(dir, "inventory.json"));
    if (existsSync(PAINTS_FILE)) copyFileSync(PAINTS_FILE, join(dir, "paints.json"));
    const dated = readdirSync(BACKUPS_DIR)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    for (const d of dated.slice(0, Math.max(0, dated.length - KEEP_BACKUPS))) {
      rmSync(join(BACKUPS_DIR, d), { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    console.warn(`⚠️  Backup failed: ${err.message}`);
    return false;
  }
}

export { DATA_FILE, PHOTOS_DIR, PAINTS_FILE, BACKUPS_DIR };
