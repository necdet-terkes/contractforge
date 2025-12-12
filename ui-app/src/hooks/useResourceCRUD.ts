// Hook for managing CRUD operations on resources

import { useState } from "react";

export interface UseResourceCRUDOptions<T> {
  createFn: (data: any) => Promise<T>;
  updateFn: (id: string, data: any) => Promise<T>;
  deleteFn: (id: string) => Promise<void>;
  onSuccess?: () => void;
}

export function useResourceCRUD<T>({
  createFn,
  updateFn,
  deleteFn,
  onSuccess
}: UseResourceCRUDOptions<T>) {
  const [error, setError] = useState<string | null>(null);

  const create = async (data: any) => {
    setError(null);
    try {
      await createFn(data);
      onSuccess?.();
    } catch (err: any) {
      const message = err.message ?? "Failed to create";
      setError(message);
      throw err;
    }
  };

  const update = async (id: string, data: any) => {
    setError(null);
    try {
      await updateFn(id, data);
      onSuccess?.();
    } catch (err: any) {
      const message = err.message ?? "Failed to update";
      setError(message);
      throw err;
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await deleteFn(id);
      onSuccess?.();
    } catch (err: any) {
      const message = err.message ?? "Failed to delete";
      setError(message);
      throw err;
    }
  };

  return { create, update, remove, error, setError };
}

