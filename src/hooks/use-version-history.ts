"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { Version, StorageSchema } from "@/lib/types";
import { STORAGE_KEY_VERSIONS } from "@/lib/constants";

const DEFAULT_SCHEMA: StorageSchema = { version: 1, versions: [] };

export function useVersionHistory() {
  const [schema, setSchema, removeSchema] = useLocalStorage<StorageSchema>(
    STORAGE_KEY_VERSIONS,
    DEFAULT_SCHEMA
  );

  const versions = schema.versions;

  const saveVersion = useCallback(
    (version: Version) => {
      setSchema((prev) => {
        const updated = [version, ...prev.versions];
        if (updated.length > 50) updated.length = 50;
        return { ...prev, versions: updated };
      });
    },
    [setSchema]
  );

  const deleteVersion = useCallback(
    (id: string) => {
      setSchema((prev) => ({
        ...prev,
        versions: prev.versions.filter((v) => v.id !== id),
      }));
    },
    [setSchema]
  );

  const getVersion = useCallback(
    (id: string): Version | undefined => {
      return versions.find((v) => v.id === id);
    },
    [versions]
  );

  return {
    versions,
    saveVersion,
    deleteVersion,
    getVersion,
    clearAll: removeSchema,
  };
}
