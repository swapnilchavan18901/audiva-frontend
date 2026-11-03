// Remembered preferences are optional; blocked storage must not break API access.
export function readPreference(
  key: string,
  legacyKeys: readonly string[] = [],
): string | null {
  if (typeof window === "undefined") return null;
  for (const candidate of [key, ...legacyKeys]) {
    try {
      const value = window.localStorage.getItem(candidate);
      if (value) return value;
    } catch {
      // A browser policy may deny access to storage for this origin.
    }
  }
  return null;
}

export function writePreference(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Continue with the in-memory selection when storage is unavailable or full.
  }
}
