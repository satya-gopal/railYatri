import { useState, useCallback } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T, A extends unknown[] = unknown[]>(
  asyncFn: (...args: A) => Promise<{ success: boolean; data?: T; error?: string }>,
  immediate = false
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await asyncFn(...args);
        if (response.success && response.data !== undefined) {
          setState({ data: response.data, loading: false, error: null });
          return response.data;
        } else {
          const err = response.error || 'An unexpected error occurred';
          setState({ data: null, loading: false, error: err });
          return null;
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Network request failed';
        setState({ data: null, loading: false, error: errorMsg });
        return null;
      }
    },
    [asyncFn]
  );

  return { ...state, execute, setData: (data: T | null) => setState((s) => ({ ...s, data })) };
}
