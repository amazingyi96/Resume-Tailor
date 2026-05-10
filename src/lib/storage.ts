import type { Version, StorageSchema } from "./types";
import { STORAGE_KEY_VERSIONS, STORAGE_KEY_LAST_SESSION } from "./constants";

const DEFAULT_SCHEMA: StorageSchema = { version: 1, versions: [] };

function readStorage(): StorageSchema {
  if (typeof window === "undefined") return DEFAULT_SCHEMA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VERSIONS);
    if (!raw) return DEFAULT_SCHEMA;
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1 && Array.isArray(parsed.versions)) {
      return parsed as StorageSchema;
    }
    return DEFAULT_SCHEMA;
  } catch {
    return DEFAULT_SCHEMA;
  }
}

function writeStorage(schema: StorageSchema): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(schema));
}

export function loadVersions(): Version[] {
  return readStorage().versions;
}

export function saveVersion(version: Version): void {
  const schema = readStorage();
  schema.versions.unshift(version);
  if (schema.versions.length > 50) {
    schema.versions = schema.versions.slice(0, 50);
  }
  writeStorage(schema);
}

export function deleteVersion(id: string): void {
  const schema = readStorage();
  schema.versions = schema.versions.filter((v) => v.id !== id);
  writeStorage(schema);
}

export function getVersion(id: string): Version | undefined {
  return readStorage().versions.find((v) => v.id === id);
}

export function clearAllVersions(): void {
  writeStorage(DEFAULT_SCHEMA);
}

export function saveLastSession(jd: string, resume: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY_LAST_SESSION,
      JSON.stringify({ jobDescription: jd, resume })
    );
  } catch {
    // storage full, ignore
  }
}

export function loadLastSession(): {
  jobDescription: string;
  resume: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
