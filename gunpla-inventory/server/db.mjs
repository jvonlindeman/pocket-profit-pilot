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
} from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, "seed.json");

const DEFAULT_DIR = join(homedir(), "Documents", "Gunpla Inventory");
const DATA_FILE =
  process.env.GUNPLA_DATA_FILE ||
  join(process.env.GUNPLA_DATA_DIR || DEFAULT_DIR, "inventory.json");

mkdirSync(dirname(DATA_FILE), { recursive: true });

/** Coerce an incoming item into the canonical on-disk shape. */
function normalize(item) {
  const num = (v) =>
    v === null || v === undefined || v === "" ? null : Number(v);
  return {
    code: String(item.code || "").trim(),
    name: String(item.name || "").trim(),
    grade: String(item.grade || "").trim(),
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
  const seed = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  replaceAll(seed);
  fileExisted = true;
  return true;
}

/** Force a reset back to the original sheet data in seed.json. */
export function resetToSeed() {
  const seed = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  return replaceAll(seed);
}

export { DATA_FILE };
