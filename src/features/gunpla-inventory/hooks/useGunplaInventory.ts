import { useCallback, useEffect, useMemo, useState } from "react";
import type { GunplaItem } from "../types";
import {
  loadInventory,
  resetInventory,
  saveInventory,
} from "../lib/storage";

/**
 * localStorage-backed inventory store. Seeds from the sheet on first run and
 * persists every mutation.
 */
export function useGunplaInventory() {
  const [items, setItems] = useState<GunplaItem[]>(() => loadInventory());

  useEffect(() => {
    saveInventory(items);
  }, [items]);

  const upsertItem = useCallback((item: GunplaItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.code === item.code);
      if (idx === -1) return [...prev, item];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }, []);

  const removeItem = useCallback((code: string) => {
    setItems((prev) => prev.filter((i) => i.code !== code));
  }, []);

  const reset = useCallback(() => {
    setItems(resetInventory());
  }, []);

  const codes = useMemo(() => new Set(items.map((i) => i.code)), [items]);

  return { items, setItems, upsertItem, removeItem, reset, codes };
}
