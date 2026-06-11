import { useEffect, useState } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** True when the API call failed and `data` is the demo fallback. */
  isFallback: boolean;
}

/**
 * Runs an async API call on mount.
 *
 * When the request fails (e.g. opened in the design canvas without a token)
 * and a `fallback` is provided, we surface the demo data so the screen still
 * renders instead of showing a blank error state.
 */
export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  fallback?: T
): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
    isFallback: false,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null, isFallback: false });
      })
      .catch((err) => {
        if (!active) return;
        const message = err?.message ?? 'Something went wrong';
        if (fallback !== undefined) {
          setState({ data: fallback, loading: false, error: message, isFallback: true });
        } else {
          setState({ data: null, loading: false, error: message, isFallback: false });
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
