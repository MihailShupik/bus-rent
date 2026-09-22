"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data once on mount and exposes a `reload()` for manual refresh.
 * All state updates happen inside async callbacks (never synchronously in the
 * effect body), which keeps React's "no cascading renders" rule happy.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetcherRef = useRef(fetcher);

  // Keep the latest fetcher without touching refs during render.
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError("");
      return result;
    } catch (e: any) {
      setError(e?.message || "Помилка завантаження");
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          setError("");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Помилка завантаження");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { data, setData, loading, error, reload };
}
