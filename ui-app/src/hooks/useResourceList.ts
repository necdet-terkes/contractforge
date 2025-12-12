// Hook for managing resource list state and loading

import { useState, useEffect } from "react";

export interface UseResourceListOptions<T> {
  fetchFn: () => Promise<T[]>;
  transform?: (data: any[]) => T[];
}

export function useResourceList<T>({
  fetchFn,
  transform
}: UseResourceListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn();
      const transformed = transform ? transform(data) : data;
      setItems(transformed);
    } catch (err: any) {
      setError(err.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { items, loading, error, reload: load };
}

