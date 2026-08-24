/**
 * The accountability layer: for every category, exactly what happens after a
 * report is registered, on what clock, owned by whom, and what the possible
 * endings are. CONTRACT FILE — powers the post-submit clarity packet
 * (CasePlanPanel), the report detail page, the Track page and the public
 * Service promise page.
 *
 * Design rules, drawn from the failure analysis of the current NCRP and the
 * best of IC3/ScamShield/politie.nl/ECRM:
 *  - every case has a named owner from minute one (no orphan reports);
 *  - every stage has a deadline the reporter can see;
 *  - a missed deadline ARMS escalation instead of asking the victim to beg;
 *  - every case ENDS: either resolved, or closed with a written reason and a
 *    right to reopen (no eternal "Under process");
 *  - all timings here are the DEMO service standard, not statutory claims.
 *
 * All human-readable strings live in the i18n `plan` namespace.
 */
import type { CategoryId, Priority, Report } from '@/lib/types';

/** One legal provision backing the category. `ref` is a literal citation. */
export interface Statute {
  ref: string;
  gistKey: string;
}

export interface CasePlan {
  statutes: Statute[];
  /** i18n key: which unit owns the investigation. */
  ownerKey: string;
  /** Officer assigned and acknowledgement sent within this many hours. */
  ackHours: number;
  /** The officer must contact the reporter within this many hours. */
  firstContactHours: number;
  /** After that, a mandatory progress update at least every N days. */
  updateEveryDays: number;
  /** Target for resolution or a written closure reason. */
  resolveDays: number;
  /** Category-specific service promises (freeze attempt, takedown clock…). */
  specialKeys: string[];
  /** Possible endings of the case. */
  outcomeKeys: string[];
  /** What the law provides if the accused is convicted. */
  guiltyKey: string;
}

/**
 * The escalation matrix, common to all categories. `afterDaysOverdue` is how
 * long the mandatory update can be missed before the reporter may raise the
 * case to this level. Level 5 (public escalation) is available only on
 * non-anonymous reports and only with the reporter's explicit consent: the
 * portal drafts a public social post tagging the accountable authorities.
 */
export interface EscalationLevel {
  level: number;
  roleKey: string;
  descKey: string;
  afterDaysOverdue: number;
}

export const ESCALATION_MATRIX: EscalationLevel[] = [
  { level: 1, roleKey: 'plan.roles.io', descKey: 'plan.matrix.l1', afterDaysOverdue: 0 },
  { level: 2, roleKey: 'plan.roles.sho', descKey: 'plan.matrix.l2', afterDaysOverdue: 0 },
  { level: 3, roleKey: 'plan.roles.district', descKey: 'plan.matrix.l3', afterDaysOverdue: 7 },
  { level: 4, roleKey: 'plan.roles.state', descKey: 'plan.matrix.l4', afterDaysOverdue: 14 },
  { level: 5, roleKey: 'plan.roles.public', descKey: 'plan.matrix.l5', afterDaysOverdue: 21 },
];

const s = (ref: string, gist: string): Statute => ({ ref, gistKey: `plan.gists.${gist}` });

/** Shared building blocks so category plans stay consistent. */
const FIN = {
  ownerKey: 'plan.owners.financial',
  ackHours: 1,
  firstContactHours: 24,
  updateEveryDays: 7,
  resolveDays: 60,
  specialKeys: ['plan.specials.freeze', 'plan.specials.mrm'],
};

export const casePlanByCategory: Record<CategoryId, CasePlan> = {
  'financial-fraud': {
    ...FIN,
    statutes: [s('BNS 2023 s.318 (cheating)', 'cheating'), s('IT Act 2000 s.66D', 'personation'), s('BNS 2023 s.316', 'breachTrust')],
    outcomeKeys: ['plan.outcomes.frozen', 'plan.outcomes.restored', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.cheating',
  },
  'investment-job-fraud': {
    ...FIN,
    statutes: [s('BNS 2023 s.318 (cheating)', 'cheating'), s('BUDS Act 2019 s.3', 'buds'), s('IT Act 2000 s.66D', 'personation')],
    outcomeKeys: ['plan.outcomes.frozen', 'plan.outcomes.restored', 'plan.outcomes.fir', 'plan.outcomes.platformDown', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.buds',
  },
  'crypto-fraud': {
    ...FIN,
    updateEveryDays: 10,
    resolveDays: 90,
    specialKeys: ['plan.specials.freeze', 'plan.specials.exchange'],
    statutes: [s('BNS 2023 s.318 (cheating)', 'cheating'), s('IT Act 2000 s.66D', 'personation')],
    outcomeKeys: ['plan.outcomes.frozen', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.cheating',
  },
  'loan-app-abuse': {
    ownerKey: 'plan.owners.financial',
    ackHours: 4,
    firstContactHours: 48,
    updateEveryDays: 7,
    resolveDays: 45,
    specialKeys: ['plan.specials.appTakedown', 'plan.specials.rbi'],
    statutes: [s('BNS 2023 s.308 (extortion)', 'extortion'), s('BNS 2023 s.351 (criminal intimidation)', 'intimidation'), s('IT Act 2000 s.66E', 'privacy')],
    outcomeKeys: ['plan.outcomes.appBlocked', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.extortion',
  },
  'romance-scam': {
    ...FIN,
    firstContactHours: 48,
    statutes: [s('BNS 2023 s.318 (cheating)', 'cheating'), s('BNS 2023 s.319 (cheating by personation)', 'personation')],
    outcomeKeys: ['plan.outcomes.frozen', 'plan.outcomes.restored', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.cheating',
  },
  sextortion: {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 1,
    firstContactHours: 12,
    updateEveryDays: 5,
    resolveDays: 45,
    specialKeys: ['plan.specials.takedown24', 'plan.specials.noBlamePay'],
    statutes: [s('BNS 2023 s.308 (extortion)', 'extortion'), s('IT Act 2000 s.67', 'obscene'), s('IT Act 2000 s.66E', 'privacy')],
    outcomeKeys: ['plan.outcomes.takedown', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.extortion',
  },
  'account-hacking': {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 4,
    firstContactHours: 48,
    updateEveryDays: 10,
    resolveDays: 60,
    specialKeys: ['plan.specials.recovery'],
    statutes: [s('IT Act 2000 s.66', 'hacking'), s('IT Act 2000 s.66C', 'identity')],
    outcomeKeys: ['plan.outcomes.accountBack', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.hacking',
  },
  'identity-theft': {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 4,
    firstContactHours: 48,
    updateEveryDays: 10,
    resolveDays: 60,
    specialKeys: ['plan.specials.idBlock'],
    statutes: [s('IT Act 2000 s.66C', 'identity'), s('BNS 2023 s.319', 'personation')],
    outcomeKeys: ['plan.outcomes.idSecured', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.identity',
  },
  impersonation: {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 4,
    firstContactHours: 48,
    updateEveryDays: 10,
    resolveDays: 45,
    specialKeys: ['plan.specials.profileDown'],
    statutes: [s('IT Act 2000 s.66D', 'personation'), s('IT Act 2000 s.66C', 'identity')],
    outcomeKeys: ['plan.outcomes.takedown', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.identity',
  },
  phishing: {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 4,
    firstContactHours: 72,
    updateEveryDays: 15,
    resolveDays: 45,
    specialKeys: ['plan.specials.blocklist'],
    statutes: [s('IT Act 2000 s.66D', 'personation'), s('BNS 2023 s.319', 'personation')],
    outcomeKeys: ['plan.outcomes.siteDown', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.cheating',
  },
  harassment: {
    ownerKey: 'plan.owners.womenChild',
    ackHours: 2,
    firstContactHours: 24,
    updateEveryDays: 7,
    resolveDays: 45,
    specialKeys: ['plan.specials.protect'],
    statutes: [s('BNS 2023 s.78 (stalking)', 'stalking'), s('BNS 2023 s.351 (criminal intimidation)', 'intimidation'), s('BNS 2023 s.79', 'modesty')],
    outcomeKeys: ['plan.outcomes.takedown', 'plan.outcomes.fir', 'plan.outcomes.warning', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.stalking',
  },
  'social-media-abuse': {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 4,
    firstContactHours: 72,
    updateEveryDays: 15,
    resolveDays: 45,
    specialKeys: ['plan.specials.itRules'],
    statutes: [s('BNS 2023 s.356 (defamation)', 'defamation'), s('IT Rules 2021 r.3(2)', 'itRules')],
    outcomeKeys: ['plan.outcomes.takedown', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.defamation',
  },
  ransomware: {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 2,
    firstContactHours: 24,
    updateEveryDays: 10,
    resolveDays: 90,
    specialKeys: ['plan.specials.certIn', 'plan.specials.noPayRansom'],
    statutes: [s('IT Act 2000 s.66', 'hacking'), s('BNS 2023 s.308 (extortion)', 'extortion')],
    outcomeKeys: ['plan.outcomes.contained', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.hacking',
  },
  'data-breach': {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 24,
    firstContactHours: 72,
    updateEveryDays: 15,
    resolveDays: 90,
    specialKeys: ['plan.specials.dpdp'],
    statutes: [s('DPDP Act 2023 s.33', 'dpdp'), s('IT Act 2000 s.72A', 'disclosure')],
    outcomeKeys: ['plan.outcomes.orgNotified', 'plan.outcomes.penalty', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.dpdp',
  },
  'sensitive-content': {
    ownerKey: 'plan.owners.womenChild',
    ackHours: 1,
    firstContactHours: 12,
    updateEveryDays: 5,
    resolveDays: 30,
    specialKeys: ['plan.specials.takedown24', 'plan.specials.dignity'],
    statutes: [s('IT Act 2000 s.66E', 'privacy'), s('IT Act 2000 s.67/67A', 'obscene'), s('BNS 2023 s.77 (voyeurism)', 'voyeurism')],
    outcomeKeys: ['plan.outcomes.takedown', 'plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.ncii',
  },
  'child-safety': {
    ownerKey: 'plan.owners.womenChild',
    ackHours: 1,
    firstContactHours: 6,
    updateEveryDays: 3,
    resolveDays: 30,
    specialKeys: ['plan.specials.takedown24', 'plan.specials.childSupport'],
    statutes: [s('POCSO Act 2012 s.13-15', 'pocso'), s('IT Act 2000 s.67B', 'csam')],
    outcomeKeys: ['plan.outcomes.takedown', 'plan.outcomes.fir', 'plan.outcomes.childProtected', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.pocso',
  },
  other: {
    ownerKey: 'plan.owners.cyberCell',
    ackHours: 24,
    firstContactHours: 72,
    updateEveryDays: 15,
    resolveDays: 60,
    specialKeys: ['plan.specials.reclassify'],
    statutes: [s('IT Act 2000 / BNS 2023 (as applicable)', 'asApplicable')],
    outcomeKeys: ['plan.outcomes.fir', 'plan.outcomes.closedReason'],
    guiltyKey: 'plan.guilty.asApplicable',
  },
};

export function casePlanFor(category: CategoryId): CasePlan {
  return casePlanByCategory[category] ?? casePlanByCategory.other;
}

/** Escalation level the reporter is entitled to right now, given overdue-ness. */
export function entitledLevel(report: Report, now = new Date()): number {
  const current = report.escalationLevel ?? 1;
  if (!report.nextUpdateDue) return current;
  const overdueDays = (now.getTime() - new Date(report.nextUpdateDue).getTime()) / 86400000;
  if (overdueDays <= 0) return current;
  let entitled = current;
  for (const l of ESCALATION_MATRIX) {
    if (l.level > current && overdueDays >= l.afterDaysOverdue) entitled = l.level;
  }
  // One step at a time: you may always raise to the next level once overdue.
  return Math.max(Math.min(entitled, current + 1), current);
}

/** Emergency-lane categories always show the danger helplines first. */
export function isEmergencyLane(category: CategoryId, priority?: Priority): boolean {
  return priority === 'emergency' || category === 'child-safety' || category === 'sensitive-content';
}
