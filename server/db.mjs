import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const DB_PATH = process.env.GUNPLA_DB_PATH || join(DATA_DIR, "gunpla.db");

mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    code             TEXT PRIMARY KEY,
    name             TEXT NOT NULL DEFAULT '',
    grade            TEXT NOT NULL DEFAULT '',
    thirdPartyDecals INTEGER NOT NULL DEFAULT 0,
    peebsLimited     TEXT NOT NULL DEFAULT '',
    location         TEXT NOT NULL DEFAULT '',
    quantity         INTEGER,
    paid             REAL,
    source           TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'Backlog',
    sell             INTEGER NOT NULL DEFAULT 0,
    delpiLink        TEXT NOT NULL DEFAULT '',
    review           TEXT NOT NULL DEFAULT '',
    createdAt        TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt        TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/** Convert a DB row (0/1 ints) into the JSON shape the frontend expects. */
function rowToItem(row) {
  return {
    code: row.code,
    name: row.name,
    grade: row.grade,
    thirdPartyDecals: !!row.thirdPartyDecals,
    peebsLimited: row.peebsLimited,
    location: row.location,
    quantity: row.quantity,
    paid: row.paid,
    source: row.source,
    status: row.status,
    sell: !!row.sell,
    delpiLink: row.delpiLink,
    review: row.review,
  };
}

/** Normalize an incoming item into DB-friendly params. */
function itemToParams(item) {
  return {
    code: String(item.code || "").trim(),
    name: String(item.name || "").trim(),
    grade: String(item.grade || "").trim(),
    thirdPartyDecals: item.thirdPartyDecals ? 1 : 0,
    peebsLimited: String(item.peebsLimited || ""),
    location: String(item.location || ""),
    quantity:
      item.quantity === null || item.quantity === undefined
        ? null
        : Number(item.quantity),
    paid:
      item.paid === null || item.paid === undefined ? null : Number(item.paid),
    source: String(item.source || ""),
    status: String(item.status || "Backlog"),
    sell: item.sell ? 1 : 0,
    delpiLink: String(item.delpiLink || ""),
    review: String(item.review || ""),
  };
}

const selectAll = db.prepare("SELECT * FROM items ORDER BY code");
const selectOne = db.prepare("SELECT * FROM items WHERE code = ?");
const upsertStmt = db.prepare(`
  INSERT INTO items
    (code, name, grade, thirdPartyDecals, peebsLimited, location, quantity,
     paid, source, status, sell, delpiLink, review)
  VALUES
    (@code, @name, @grade, @thirdPartyDecals, @peebsLimited, @location, @quantity,
     @paid, @source, @status, @sell, @delpiLink, @review)
  ON CONFLICT(code) DO UPDATE SET
    name=@name, grade=@grade, thirdPartyDecals=@thirdPartyDecals,
    peebsLimited=@peebsLimited, location=@location, quantity=@quantity,
    paid=@paid, source=@source, status=@status, sell=@sell,
    delpiLink=@delpiLink, review=@review, updatedAt=datetime('now')
`);
const deleteStmt = db.prepare("DELETE FROM items WHERE code = ?");
const countStmt = db.prepare("SELECT COUNT(*) AS n FROM items");
const clearStmt = db.prepare("DELETE FROM items");

export function getItems() {
  return selectAll.all().map(rowToItem);
}

export function getItem(code) {
  const row = selectOne.get(code);
  return row ? rowToItem(row) : null;
}

export function upsertItem(item) {
  const params = itemToParams(item);
  if (!params.code) throw new Error("code is required");
  upsertStmt.run(params);
  return getItem(params.code);
}

export function deleteItem(code) {
  return deleteStmt.run(code).changes > 0;
}

export function itemCount() {
  return countStmt.get().n;
}

/** Replace all rows with the given items (used by reset + seed). */
export const replaceAll = db.transaction((items) => {
  clearStmt.run();
  for (const item of items) upsertStmt.run(itemToParams(item));
  return itemCount();
});

/** Seed the table from seed.json only if it is currently empty. */
export function seedIfEmpty() {
  if (itemCount() > 0) return false;
  const seed = JSON.parse(
    readFileSync(join(__dirname, "seed.json"), "utf8")
  );
  replaceAll(seed);
  return true;
}

/** Force a reset back to seed.json. */
export function resetToSeed() {
  const seed = JSON.parse(readFileSync(join(__dirname, "seed.json"), "utf8"));
  return replaceAll(seed);
}

export { DB_PATH };
