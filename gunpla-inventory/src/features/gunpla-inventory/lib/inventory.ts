import type {
  Breakdown,
  GunplaItem,
  InventoryFilters,
  InventoryStats,
} from "../types";

/**
 * Group kits by a string field and aggregate count + spend + status mix.
 * Sorted by count (desc), then by spend (desc).
 */
export function groupBy(
  items: GunplaItem[],
  key: keyof GunplaItem
): Breakdown[] {
  const map = new Map<string, Breakdown>();
  for (const item of items) {
    const raw = item[key];
    const bucket = (typeof raw === "string" && raw.trim()) || "—";
    let row = map.get(bucket);
    if (!row) {
      row = { key: bucket, count: 0, spent: 0, built: 0, backlog: 0 };
      map.set(bucket, row);
    }
    row.count += 1;
    row.spent += item.paid ?? 0;
    if (item.status === "Built") row.built += 1;
    if (item.status === "Backlog") row.backlog += 1;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || b.spent - a.spent
  );
}

/** Compute aggregate stats over a list of kits. */
export function computeStats(items: GunplaItem[]): InventoryStats {
  return items.reduce<InventoryStats>(
    (acc, item) => {
      const qty = item.quantity ?? 1;
      acc.totalKits += 1;
      acc.totalQuantity += qty;
      acc.totalSpent += item.paid ?? 0;
      if (item.status === "Built") acc.built += 1;
      if (item.status === "Backlog") acc.backlog += 1;
      if (item.sell) acc.forSale += 1;
      return acc;
    },
    {
      totalKits: 0,
      totalQuantity: 0,
      totalSpent: 0,
      built: 0,
      backlog: 0,
      forSale: 0,
    }
  );
}

/** Apply search + facet filters. */
export function filterItems(
  items: GunplaItem[],
  filters: InventoryFilters
): GunplaItem[] {
  const search = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.grade && item.grade !== filters.grade) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.location && item.location !== filters.location) return false;
    if (filters.sellOnly && !item.sell) return false;
    if (search) {
      const haystack = [
        item.name,
        item.code,
        item.grade,
        item.source,
        item.peebsLimited,
        item.location,
        item.review,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Distinct, sorted values of a string field — for filter dropdowns. */
export function distinctValues(
  items: GunplaItem[],
  key: keyof GunplaItem
): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) set.add(value.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Generate the next sequential code for a grade prefix, e.g. "HG-140". */
export function nextCode(items: GunplaItem[], prefix: string): string {
  const safePrefix = prefix.trim().toUpperCase() || "ITEM";
  let max = 0;
  const re = new RegExp(`^${safePrefix}-(\\d+)$`, "i");
  for (const item of items) {
    const m = item.code.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${safePrefix}-${String(max + 1).padStart(3, "0")}`;
}

export type SortKey =
  | "code"
  | "name"
  | "grade"
  | "status"
  | "location"
  | "paid";
export type SortDir = "asc" | "desc";
export interface SortState {
  key: SortKey;
  dir: SortDir;
}

/** Return a new array sorted by the given column/direction. */
export function sortItems(
  items: GunplaItem[],
  sort: SortState
): GunplaItem[] {
  const mult = sort.dir === "asc" ? 1 : -1;
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort.key === "paid") {
      const av = a.paid ?? -Infinity;
      const bv = b.paid ?? -Infinity;
      return (av - bv) * mult;
    }
    const av = String(a[sort.key] ?? "");
    const bv = String(b[sort.key] ?? "");
    // numeric-aware so codes sort HG-2 < HG-10 and names read naturally
    return av.localeCompare(bv, undefined, { numeric: true }) * mult;
  });
  return copy;
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
