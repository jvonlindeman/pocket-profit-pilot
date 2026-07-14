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
 * Is a recipe paint already in the stash? Matches only on a SPECIFIC token so a
 * bare brand ("Tamiya") doesn't mark every Tamiya paint as owned:
 *  - the stash entry's code appears in the recipe (codes are identifying: X-7, C33), or
 *  - the stash entry's name matches the recipe (min length so short/generic
 *    names don't match everything).
 * Erring toward NOT-covered is safe: at worst you see a paint you already own on
 * the list; the dangerous direction (hiding a paint you need) is what this avoids.
 */
export function stashCovers(stash: StashPaint[], recipeText: string): boolean {
  const r = normalizePaintText(recipeText);
  if (!r) return true; // nothing to buy for an empty recipe line
  for (const p of stash) {
    const code = normalizePaintText(p.code);
    if (code.length >= 2 && r.includes(code)) return true;
    const name = normalizePaintText(p.name);
    if (name.length >= 4 && (r.includes(name) || name.includes(r))) return true;
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
