/**
 * The synthetic authority roster behind the admin portal. CONTRACT FILE, the
 * authority-side twin of casePlans.ts: a fixed set of demo officers so that a
 * badge login always resolves to the same set of tickets.
 *
 * Why fixed rather than generated: reportService used to invent an officer per
 * report, which meant no one could ever log in as that officer. Assignment now
 * draws from this roster, deterministically, by category specialisation and
 * then round robin on the acknowledgement number.
 *
 * Everything here is fake. The badge ids, phone numbers and the shared demo
 * password are printed in the UI on purpose, the same way the citizen demo
 * login is.
 */
import type { CaseOfficer, CategoryId } from '@/lib/types';

/**
 * `officer` investigates their own tickets. `in-charge` is the Cyber Cell
 * In-charge who already sits at level 2 of the escalation matrix, so they can
 * see and reassign every ticket in their unit.
 */
export type AuthorityRank = 'officer' | 'in-charge';

export interface Authority {
  id: string;
  name: string;
  /** Login handle, printed on the demo sign-in page. */
  badgeId: string;
  unit: string;
  rank: AuthorityRank;
  /** Categories this officer is drawn for first. Empty = any category. */
  specialisations: CategoryId[];
  /** Masked demo contact shown to the reporter. */
  phoneMasked: string;
}

/** Shared across every demo account, printed in the UI. gitleaks:allow */
export const DEMO_AUTHORITY_PASSWORD = 'Officer@123'; // gitleaks:allow

/** The badge the demo buttons and the ?e2e=adminlogin hook sign in as. */
export const DEMO_AUTHORITY_BADGE = 'KA-CYB-1042';

export const AUTHORITY_ROSTER: Authority[] = [
  {
    id: 'a-meera',
    name: 'SI Meera Nair',
    badgeId: 'KA-CYB-1042',
    unit: 'Bengaluru City Cyber Cell',
    rank: 'officer',
    specialisations: ['financial-fraud', 'investment-job-fraud', 'crypto-fraud', 'loan-app-abuse'],
    phoneMasked: '+91 98XXX XX210',
  },
  {
    id: 'a-arjun',
    name: 'SI Arjun Patil',
    badgeId: 'KA-CYB-1188',
    unit: 'Bengaluru City Cyber Cell',
    rank: 'officer',
    specialisations: ['account-hacking', 'phishing', 'identity-theft', 'data-breach', 'ransomware'],
    phoneMasked: '+91 98XXX XX344',
  },
  {
    id: 'a-lakshmi',
    name: 'Inspector Lakshmi Rao',
    badgeId: 'KA-CYB-2001',
    unit: 'Bengaluru City Cyber Cell',
    rank: 'in-charge',
    specialisations: [],
    phoneMasked: '+91 98XXX XX501',
  },
  {
    id: 'a-kavita',
    name: 'ASI Kavita Reddy',
    badgeId: 'DL-CYB-3307',
    unit: 'Delhi North Cyber Cell',
    rank: 'officer',
    specialisations: ['harassment', 'social-media-abuse', 'sensitive-content', 'child-safety', 'sextortion', 'romance-scam'],
    phoneMasked: '+91 97XXX XX118',
  },
  {
    id: 'a-harpreet',
    name: 'SI Harpreet Gill',
    badgeId: 'DL-CYB-3419',
    unit: 'Delhi North Cyber Cell',
    rank: 'officer',
    specialisations: ['impersonation', 'other'],
    phoneMasked: '+91 97XXX XX276',
  },
  {
    id: 'a-devendra',
    name: 'Inspector Devendra Kumar',
    badgeId: 'DL-CYB-4100',
    unit: 'Delhi North Cyber Cell',
    rank: 'in-charge',
    specialisations: [],
    phoneMasked: '+91 97XXX XX640',
  },
];

export function authorityById(id: string | undefined): Authority | null {
  if (!id) return null;
  return AUTHORITY_ROSTER.find((a) => a.id === id) ?? null;
}

export function authorityByBadge(badgeId: string): Authority | null {
  const b = badgeId.trim().toUpperCase().replace(/\s+/g, '');
  return AUTHORITY_ROSTER.find((a) => a.badgeId.toUpperCase() === b) ?? null;
}

/** Rank to the escalation-matrix role key used everywhere on the citizen side. */
export function rankKeyOf(authority: Authority): string {
  return authority.rank === 'in-charge' ? 'plan.roles.sho' : 'plan.roles.io';
}

/** The shape the report model (and the reporter's pages) already expect. */
export function toCaseOfficer(authority: Authority): CaseOfficer {
  return {
    id: authority.id,
    name: authority.name,
    rankKey: rankKeyOf(authority),
    unit: authority.unit,
    phoneMasked: authority.phoneMasked,
  };
}

/**
 * Deterministic assignment: specialists in the category first, everyone with
 * the `officer` rank otherwise, picked round robin on the acknowledgement
 * number so the same report always lands with the same officer.
 */
export function assignAuthority(refNumber: string, category: CategoryId): Authority {
  const investigators = AUTHORITY_ROSTER.filter((a) => a.rank === 'officer');
  const specialists = investigators.filter((a) => a.specialisations.includes(category));
  const pool = specialists.length > 0 ? specialists : investigators;
  const seed = [...refNumber].reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[seed % pool.length];
}
