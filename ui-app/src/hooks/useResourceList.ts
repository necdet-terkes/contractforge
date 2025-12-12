// Hook for managing resource list state and loading

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseResourceListOptions<T> {
  fetchFn: () => Promise<T[]>;
  transform?: (data: any[]) => T[];
}

export function useResourceList<T>({ fetchFn, transform }: UseResourceListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to store latest fetchFn and transform to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  const transformRef = useRef(transform);

  // Update refs when they change
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    transformRef.current = transform;
  }, [fetchFn, transform]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFnRef.current();
      const transformed = transformRef.current ? transformRef.current(data) : data;
      setItems(transformed);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - load function uses refs, so it doesn't need to change

  // Load on mount
  useEffect(() => {
    load();
  }, [load]);

  // Reload when fetchFn or transform changes (e.g., when switching between mock/real mode)
  useEffect(() => {
    load();
  }, [fetchFn, transform, load]);

  return { items, loading, error, reload: load };
}
