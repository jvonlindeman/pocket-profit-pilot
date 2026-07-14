// Domain types for the Gunpla inventory feature.
// Mirrors the columns of the personal inventory Google Sheet (first sheet).

export type GunplaStatus = "Backlog" | "Built" | "In Progress";

export type BuildPriority = "high" | "medium" | "low";

/** One line of a project's paint recipe: which area got which paint. */
export interface Paint {
  area: string;
  paint: string;
}

export type PaintStatus = "ok" | "low" | "out";

/** A paint you own (or need), tracked in the stash — stored in paints.json. */
export interface StashPaint {
  id: string;
  brand: string;
  code: string;
  name: string;
  type: string;
  status: PaintStatus;
}

export interface GunplaItem {
  /** Unique code from the sheet, e.g. "HG-001". Used as the stable id. */
  code: string;
  name: string;
  /** Grade / line, e.g. "HG", "EG", "FM"… Optional for third-party kits. */
  grade: string;
  /** Manufacturer: "Bandai", "Kotobukiya", "Moxin"… Empty = unspecified. */
  brand?: string;
  /** Kit scale: "1/144", "1/100", "1/60", "Non-scale"… */
  scale?: string;
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
  /** Completed build-stage keys (see BUILD_STAGES in lib/inventory). Optional
   *  so existing/seed items without it stay valid; treated as [] when absent. */
  stages?: string[];
  /** Stage keys marked "skipped" (don't apply to this kit): they don't count
   *  toward progress and don't block Built. */
  skippedStages?: string[];
  /** Progress photo filenames stored on disk under the data dir's photos/. */
  photos?: string[];
  /** Per-stage notes, keyed by stage key (e.g. { priming: "Mr. Surfacer 1500" }). */
  stageNotes?: Record<string, string>;
  /** Structured paint recipe: which area got which paint. */
  paints?: Paint[];
  /** Build start date, "YYYY-MM-DD". */
  startedAt?: string | null;
  /** Build finish date, "YYYY-MM-DD". */
  finishedAt?: string | null;
  /** Priority for ordering active builds. */
  priority?: BuildPriority | null;
}

export interface InventoryFilters {
  search: string;
  grade: string; // "" = all
  brand: string; // "" = all
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
