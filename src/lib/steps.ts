/**
 * The report journey. Routes are grouped into the visible progress steps.
 * Pages navigate with nextPath()/prevPath() so the order lives in exactly
 * one place. Anonymous journeys skip the identity step entirely, so every
 * helper takes an `anonymous` flag (defaults to the tracked journey).
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

export function stepGroups(anonymous = false): { id: StepGroup; labelKey: string }[] {
  return anonymous ? STEP_GROUPS.filter((g) => g.id !== 'identity') : STEP_GROUPS;
}

function routeSequence(anonymous: boolean): { path: string; group: StepGroup }[] {
  return anonymous ? ROUTE_SEQUENCE.filter((r) => r.group !== 'identity') : ROUTE_SEQUENCE;
}

export function groupOf(path: string): StepGroup | null {
  return ROUTE_SEQUENCE.find((r) => r.path === path)?.group ?? null;
}

export function nextPath(path: string, anonymous = false): string | null {
  const seq = routeSequence(anonymous);
  const i = seq.findIndex((r) => r.path === path);
  return i >= 0 && i < seq.length - 1 ? seq[i + 1].path : null;
}

export function prevPath(path: string, anonymous = false): string | null {
  const seq = routeSequence(anonymous);
  const i = seq.findIndex((r) => r.path === path);
  return i > 0 ? seq[i - 1].path : null;
}
