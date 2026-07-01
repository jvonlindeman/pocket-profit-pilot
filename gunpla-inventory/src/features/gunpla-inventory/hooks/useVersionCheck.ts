import { useEffect, useRef, useState } from "react";
import { fetchHealth } from "../lib/api";

/**
 * Keeps an eye on the running server version so the UI can react to updates:
 * - `version`: the server's git short SHA (null on tarball installs / offline).
 * - `serverChanged`: the server restarted on a different version while this
 *   page was open → the page is stale, offer a reload.
 * - `updateAvailable`: the server sees a newer version upstream → tell the
 *   user to quit & reopen the app icon (which pulls and restarts).
 * Re-checks every 5 minutes and whenever the window regains focus. All checks
 * are silent best-effort — errors change nothing.
 */
export function useVersionCheck(enabled: boolean) {
  const [version, setVersion] = useState<string | null>(null);
  const [serverChanged, setServerChanged] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const firstSeen = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const check = async () => {
      const health = await fetchHealth();
      if (cancelled || !health) return;
      const v = health.version ?? null;
      if (v) {
        if (firstSeen.current === null) firstSeen.current = v;
        setVersion(v);
        setServerChanged(v !== firstSeen.current);
      }
      setUpdateAvailable(!!health.updateAvailable);
    };

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled]);

  return { version, serverChanged, updateAvailable };
}
