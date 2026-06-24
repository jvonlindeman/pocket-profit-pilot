import type {
  GunplaItem,
  InventoryFilters,
  InventoryStats,
} from "../types";

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

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
