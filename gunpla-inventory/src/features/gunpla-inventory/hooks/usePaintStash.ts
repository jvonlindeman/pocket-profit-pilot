import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { StashPaint } from "../types";
import { loadPaintStash, savePaintStash } from "../lib/storage";
import { fetchPaints, pingApi, savePaintsApi } from "../lib/api";

/**
 * Paint-stash store backed by the local server's paints.json, mirroring the
 * useGunplaInventory pattern: server when reachable (with a localStorage
 * offline mirror), localStorage alone otherwise. Mutations replace the whole
 * array — fine at personal scale.
 */
export function usePaintStash() {
  const [paints, setPaints] = useState<StashPaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reachable = await pingApi();
      if (cancelled) return;
      if (reachable) {
        try {
          const data = await fetchPaints();
          if (cancelled) return;
          setOnline(true);
          setPaints(data);
          savePaintStash(data);
          setLoading(false);
          return;
        } catch {
          /* fall through to offline */
        }
      }
      if (cancelled) return;
      setOnline(false);
      setPaints(loadPaintStash());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAll = useCallback(
    (next: StashPaint[]) => {
      // Optimistic local update is the source of truth for the UI. We do NOT
      // re-apply the server's response afterwards — doing so would clobber any
      // edit made while the PUT was in flight (lost-update bug).
      setPaints(next);
      savePaintStash(next);
      if (online) {
        savePaintsApi(next).catch((err) => {
          toast.error(`Could not save paints: ${(err as Error).message}`);
        });
      }
    },
    [online]
  );

  const addPaint = useCallback(
    (p: Omit<StashPaint, "id">) =>
      applyAll([...paints, { ...p, id: crypto.randomUUID() }]),
    [paints, applyAll]
  );

  const updatePaint = useCallback(
    (p: StashPaint) =>
      applyAll(paints.map((x) => (x.id === p.id ? p : x))),
    [paints, applyAll]
  );

  const removePaint = useCallback(
    (id: string) => applyAll(paints.filter((x) => x.id !== id)),
    [paints, applyAll]
  );

  return { paints, loading, online, addPaint, updatePaint, removePaint };
}
