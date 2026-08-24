/** ID and reference-number generation (all clearly demo-marked). */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * 14-digit acknowledgement number, matching the shape the real NCRP issues
 * (year + month + 8 random digits). Demo-marked by the UI copy around it,
 * not by the number itself, so the artifact users learn to expect is real.
 */
export function makeRefNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const n = String(10000000 + Math.floor(Math.random() * 90000000));
  return `${y}${m}${n}`;
}

export function makeSessionId(): string {
  return 'DEMO-' + String(100000 + Math.floor(Math.random() * 900000));
}
