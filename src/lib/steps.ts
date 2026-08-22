/**
 * The report journey. Routes are grouped into the five visible progress
 * steps. Pages navigate with nextPath()/prevPath() so the order lives in
 * exactly one place.
 */
import type { StepGroup } from '@/lib/types';

export const STEP_GROUPS: { id: StepGroup; labelKey: string }[] = [
  { id: 'location', labelKey: 'steps.location' },
  { id: 'identity', labelKey: 'steps.identity' },
  { id: 'incident', labelKey: 'steps.incident' },
  { id: 'evidence', labelKey: 'steps.evidence' },
  { id: 'review', labelKey: 'steps.review' },
];

export const ROUTE_SEQUENCE: { path: string; group: StepGroup }[] = [
  { path: '/report/location', group: 'location' },
  { path: '/report/identity', group: 'identity' },
  { path: '/report/questions', group: 'incident' },
  { path: '/report/category', group: 'incident' },
  { path: '/report/guidance', group: 'incident' },
  { path: '/report/description', group: 'incident' },
  { path: '/report/details', group: 'incident' },
  { path: '/report/evidence', group: 'evidence' },
  { path: '/report/review', group: 'review' },
];

export function groupOf(path: string): StepGroup | null {
  return ROUTE_SEQUENCE.find((r) => r.path === path)?.group ?? null;
}

export function nextPath(path: string): string | null {
  const i = ROUTE_SEQUENCE.findIndex((r) => r.path === path);
  return i >= 0 && i < ROUTE_SEQUENCE.length - 1 ? ROUTE_SEQUENCE[i + 1].path : null;
}

export function prevPath(path: string): string | null {
  const i = ROUTE_SEQUENCE.findIndex((r) => r.path === path);
  return i > 0 ? ROUTE_SEQUENCE[i - 1].path : null;
}
