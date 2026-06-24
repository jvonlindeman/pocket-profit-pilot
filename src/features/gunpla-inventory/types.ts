// Domain types for the Gunpla inventory feature.
// Mirrors the columns of the personal inventory Google Sheet (first sheet).

export type GunplaStatus = "Backlog" | "Built" | "In Progress";

export interface GunplaItem {
  /** Unique code from the sheet, e.g. "HG-001". Used as the stable id. */
  code: string;
  name: string;
  /** Grade / line, e.g. "HG", "EG", "FM", "Figure-Rise", "Kotobukiya"... */
  grade: string;
  /** Whether the kit includes / needs third-party decals or waterslides. */
  thirdPartyDecals: boolean;
  /** "P-Bandai", "Limited Item", "No", etc. (from "Peebs or Limited"). */
  peebsLimited: string;
  /** Where the kit physically lives: Display, House, Storage, House Storage... */
  location: string;
  quantity: number | null;
  /** Price paid in USD. Null when unknown. */
  paid: number | null;
  /** Where it was bought. */
  source: string;
  status: GunplaStatus | string;
  /** Marked for sale. */
  sell: boolean;
  /** Delpi / third-party decal search link. */
  delpiLink: string;
  /** Free-form notes. */
  review: string;
}

export interface InventoryFilters {
  search: string;
  grade: string; // "" = all
  status: string; // "" = all
  location: string; // "" = all
  sellOnly: boolean;
}

export interface InventoryStats {
  totalKits: number;
  totalQuantity: number;
  totalSpent: number;
  built: number;
  backlog: number;
  forSale: number;
}

/** Aggregated metrics for one group (e.g. a single grade or location). */
export interface Breakdown {
  key: string;
  count: number;
  spent: number;
  built: number;
  backlog: number;
}
