/** Namespaced localStorage wrapper. All demo persistence goes through this. */

const PREFIX = 'ncrpdemo.';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the demo degrades to in-memory state.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearAll(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Storage keys used across the app. */
export const KEYS = {
  users: 'users',
  session: 'session',
  reports: 'reports',
  draft: 'draftReport',
  settings: 'accessibilitySettings',
  lang: 'language',
  seedVersion: 'seedVersion',
  sessionId: 'sessionId',
  chat: 'chatIntake',
  openaiKey: 'openaiKey',
  /** Authority portal session. Deliberately separate from `session`. */
  adminSession: 'admin.session',
} as const;
