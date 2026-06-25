import { useCallback, useEffect, useMemo, useState } from "react";
import type { GunplaItem } from "../types";
import {
  loadInventory,
  resetInventory,
  saveInventory,
} from "../lib/storage";
import {
  createItem,
  deleteItemApi,
  fetchItems,
  pingApi,
  resetItemsApi,
  updateItem,
} from "../lib/api";

/**
 * Inventory store backed by the local JSON-file server.
 *
 * On mount it checks whether the server (npm start) is reachable:
 * - online  → the JSON file in ~/Documents/Gunpla Inventory is the source of
 *             truth; a localStorage copy is kept as a cache/offline mirror.
 * - offline → falls back to the localStorage cache (seeded from the sheet) so the
 *             page still works; changes persist locally until the server is up.
 */
export function useGunplaInventory() {
  const [items, setItems] = useState<GunplaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reachable = await pingApi();
      if (cancelled) return;
      if (reachable) {
        try {
          const data = await fetchItems();
          if (cancelled) return;
          setOnline(true);
          setItems(data);
          saveInventory(data); // keep an offline mirror
          setLoading(false);
          return;
        } catch {
          /* fall through to offline */
        }
      }
      if (cancelled) return;
      setOnline(false);
      setItems(loadInventory());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply an update to local state + offline mirror.
  const applyLocal = useCallback((next: GunplaItem[]) => {
    setItems(next);
    saveInventory(next);
  }, []);

  const upsertItem = useCallback(
    async (item: GunplaItem) => {
      const exists = items.some((i) => i.code === item.code);
      const next = exists
        ? items.map((i) => (i.code === item.code ? item : i))
        : [...items, item];
      applyLocal(next);
      if (online) {
        await (exists ? updateItem(item) : createItem(item));
      }
    },
    [items, online, applyLocal]
  );

  const removeItem = useCallback(
    async (code: string) => {
      applyLocal(items.filter((i) => i.code !== code));
      if (online) await deleteItemApi(code);
    },
    [items, online, applyLocal]
  );

  const reset = useCallback(async () => {
    if (online) {
      const data = await resetItemsApi();
      applyLocal(data);
    } else {
      applyLocal(resetInventory());
    }
  }, [online, applyLocal]);

  const codes = useMemo(() => new Set(items.map((i) => i.code)), [items]);

  return { items, loading, online, upsertItem, removeItem, reset, codes };
}
