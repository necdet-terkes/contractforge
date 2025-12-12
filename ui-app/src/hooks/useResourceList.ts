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

  // Load only on mount
  // Note: fetchFn and transform are updated in refs, so load() will use the latest versions
  // If you need to refetch when API URLs change (e.g., mock/real mode switch),
  // you should use useMemo to stabilize fetchFn or call reload() manually
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return { items, loading, error, reload: load };
}
