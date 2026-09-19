import { useCallback, useEffect, useState } from "react";

/**
 * Generic loader for service calls: `useAsyncData(getLedgerSummary)`.
 * `fetcher` must be a stable function that accepts `{ signal }`.
 * Returns { data, error, loading, reload }.
 */
export function useAsyncData(fetcher) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher({ signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
  }, [fetcher, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
