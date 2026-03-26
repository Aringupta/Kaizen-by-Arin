const PREFIX = "kaizen:";

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // fail silently
  }
}
