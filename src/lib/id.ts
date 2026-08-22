/** ID and reference-number generation (all clearly demo-marked). */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** e.g. NCRP-DEMO-20260822-48291 */
export function makeRefNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const n = String(10000 + Math.floor(Math.random() * 90000));
  return `NCRP-DEMO-${y}${m}${d}-${n}`;
}

export function makeSessionId(): string {
  return 'DEMO-' + String(100000 + Math.floor(Math.random() * 900000));
}
