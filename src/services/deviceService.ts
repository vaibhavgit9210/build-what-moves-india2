/**
 * Simulated technical/audit information. The device and browser are read
 * coarsely from the user agent; the IP is a fixed documentation-range value.
 * No fingerprinting. Everything here is labeled demo data in the UI.
 */
import { loadJSON, saveJSON, KEYS } from '@/lib/storage';
import { makeSessionId } from '@/lib/id';
import type { TechnicalInfo } from '@/lib/types';

export function getTechnicalInfo(consented: boolean): TechnicalInfo {
  const ua = navigator.userAgent;
  const device = /Android/i.test(ua)
    ? 'Android phone'
    : /iPhone|iPad/i.test(ua)
      ? 'iPhone / iPad'
      : /Mac/i.test(ua)
        ? 'Mac computer'
        : /Windows/i.test(ua)
          ? 'Windows computer'
          : 'Computer';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';

  let sessionId = loadJSON<string | null>(KEYS.sessionId, null);
  if (!sessionId) {
    sessionId = makeSessionId();
    saveJSON(KEYS.sessionId, sessionId);
  }

  return {
    device,
    browser,
    approxIp: '203.0.113.42', // TEST-NET-3 documentation range — obviously fake
    sessionId,
    consented,
  };
}
