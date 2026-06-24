import type { GunplaItem } from "../types";
import { seedItems } from "../data/seedData";

const STORAGE_KEY = "gunpla-inventory:v1";

/** Load the inventory from localStorage, seeding it on first run. */
export function loadInventory(): GunplaItem[] {
  if (typeof window === "undefined") return [...seedItems];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedItems));
      return [...seedItems];
    }
    const parsed = JSON.parse(raw) as GunplaItem[];
    if (!Array.isArray(parsed)) return [...seedItems];
    return parsed;
  } catch {
    return [...seedItems];
  }
}

export function saveInventory(items: GunplaItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / serialization errors */
  }
}

/** Reset back to the original seed data from the sheet. */
export function resetInventory(): GunplaItem[] {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedItems));
  }
  return [...seedItems];
}
