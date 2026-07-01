// Pure paint-stash logic: matching recipe paints against the stash and building
// the shopping list of what's missing for the builds currently on the bench.

import type { GunplaItem, StashPaint } from "../types";

/** Suggested values for the free-text paint type field. */
export const PAINT_TYPE_SUGGESTIONS = [
  "Lacquer",
  "Acrylic",
  "Enamel",
  "Primer",
  "Topcoat",
  "Other",
] as const;

/** Normalize free text for fuzzy paint matching. */
export function normalizePaintText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * A recipe text is covered when some stash entry's "brand code" or name is a
 * substring of it (or vice versa), case/whitespace-insensitive — so a stash
 * entry "Tamiya X-7" covers the recipe "tamiya x-7 red gloss".
 */
export function stashCovers(stash: StashPaint[], recipeText: string): boolean {
  const r = normalizePaintText(recipeText);
  if (!r) return true; // nothing to buy for an empty entry
  for (const p of stash) {
    const candidates = [
      normalizePaintText(`${p.brand} ${p.code}`),
      normalizePaintText(p.name),
    ];
    for (const c of candidates) {
      if (c && (c.includes(r) || r.includes(c))) return true;
    }
  }
  return false;
}

export interface ShoppingRow {
  /** The recipe paint text as first written. */
  paintText: string;
  /** Codes of the active builds that need it. */
  kits: string[];
}

/** Recipe paints of In-Progress builds that no stash entry covers. */
export function buildShoppingList(
  items: GunplaItem[],
  stash: StashPaint[]
): ShoppingRow[] {
  const rows = new Map<string, ShoppingRow>();
  for (const item of items) {
    if (item.status !== "In Progress") continue;
    for (const recipe of item.paints ?? []) {
      const text = recipe.paint.trim();
      if (!text || stashCovers(stash, text)) continue;
      const key = normalizePaintText(text);
      const row = rows.get(key) ?? { paintText: text, kits: [] };
      if (!row.kits.includes(item.code)) row.kits.push(item.code);
      rows.set(key, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.kits.length - a.kits.length);
}
