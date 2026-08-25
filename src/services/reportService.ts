/**
 * Demo report store. Reports live in localStorage; nothing is ever sent
 * to NCRP or any real system.
 *
 * The accountability layer is simulated here: every report gets a named
 * officer, a next-update deadline from its category's case plan, a mock
 * SMS/email update log, and an escalation state the reporter can raise
 * through the matrix (level 5 = public social escalation, non-anonymous
 * only). Demo controls let a presenter simulate an officer update or a
 * missed deadline.
 */
import { loadJSON, saveJSON, KEYS } from '@/lib/storage';
import { makeRefNumber, uid } from '@/lib/id';
import { casePlanFor, ESCALATION_MATRIX, entitledLevel } from '@/content/casePlans';
import { assignAuthority, toCaseOfficer } from '@/content/authorityRoster';
import type { CaseOfficer, CaseUpdate, DraftReport, Report, TechnicalInfo, User } from '@/lib/types';

export function getAllReports(): Report[] {
  return loadJSON<Report[]>(KEYS.reports, []);
}

export function saveAllReports(reports: Report[]): void {
  saveJSON(KEYS.reports, reports);
}

export function listReports(userId: string): Report[] {
  return getAllReports()
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getReport(id: string): Report | null {
  return getAllReports().find((r) => r.id === id || r.refNumber === id) ?? null;
}

/** Look a report up by reference number (public "track my report"). */
export function trackReport(refNumber: string): Report | null {
  const ref = refNumber.trim().toUpperCase();
  return getAllReports().find((r) => r.refNumber.toUpperCase() === ref) ?? null;
}

/**
 * Officers come from the fixed roster (authorityRoster.ts) rather than being
 * invented per report, so the officer named to the reporter is the same person
 * who can sign in to the admin portal and see the ticket.
 */
function assignOfficer(report: Pick<Report, 'refNumber' | 'category'>): CaseOfficer {
  return toCaseOfficer(assignAuthority(report.refNumber, report.category));
}

function hoursFrom(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600_000).toISOString();
}
function daysFrom(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86400_000).toISOString();
}

export function submitReport(
  draft: DraftReport,
  user: User | null,
  technical: TechnicalInfo | undefined,
  lang: string,
): Report {
  const now = new Date();
  const received = new Date(now.getTime() + 60_000);
  const category = draft.category ?? 'other';
  const plan = casePlanFor(category);
  const refNumber = makeRefNumber(now);
  const officer = assignOfficer({ refNumber, category });
  const financial = ['financial-fraud', 'investment-job-fraud', 'crypto-fraud', 'romance-scam'].includes(category);
  const updates: CaseUpdate[] = [
    { at: now.toISOString(), channel: 'sms', textKey: 'plan.updates.registered' },
    ...(financial ? [{ at: received.toISOString(), channel: 'sms' as const, textKey: 'plan.updates.freezeStarted' }] : []),
    { at: hoursFrom(now.toISOString(), plan.ackHours), channel: 'email', textKey: 'plan.updates.assigned' },
  ];
  const report: Report = {
    id: uid(),
    refNumber,
    ...(user ? { userId: user.id } : { anonymous: true }),
    category,
    priority: draft.priority ?? 'standard',
    submittedAt: now.toISOString(),
    status: 'received',
    timeline: [
      { status: 'submitted', at: now.toISOString() },
      { status: 'received', at: received.toISOString() },
      { status: 'assigned', at: hoursFrom(now.toISOString(), plan.ackHours) },
    ],
    location: draft.location,
    identity: draft.identity,
    answers: draft.answers,
    description: draft.description,
    platforms: draft.platforms,
    incidentDetails: draft.incidentDetails,
    evidence: draft.evidence,
    extraNotes: draft.extraNotes,
    technical,
    lang,
    officer,
    // First mandatory contact from the officer is the first deadline.
    nextUpdateDue: hoursFrom(now.toISOString(), plan.firstContactHours),
    updates,
    escalationLevel: 1,
    escalations: [],
    verificationStatus: 'pending',
    piiRequests: [],
    audit: [
      { at: now.toISOString(), actor: officer.name, actorKind: 'system', actionKey: 'admin.audit.assigned' },
    ],
  };
  saveAllReports([...getAllReports(), report]);
  return report;
}

/** Shared write path: merge a patch into one stored report. */
export function patchReport(id: string, patch: Partial<Report>): Report | null {
  const all = getAllReports();
  const i = all.findIndex((r) => r.id === id || r.refNumber === id);
  if (i < 0) return null;
  const next = { ...all[i], ...patch };
  all[i] = next;
  saveAllReports(all);
  return next;
}

/**
 * Raise the case one level up the escalation matrix (only when the current
 * deadline is actually missed). Resets the update clock: the new owner owes
 * the reporter a response within 48 hours.
 */
export function escalateReport(id: string): Report | null {
  const report = getAllReports().find((r) => r.id === id || r.refNumber === id);
  if (!report) return null;
  const current = report.escalationLevel ?? 1;
  const target = entitledLevel(report);
  if (target <= current) return report;
  const level = Math.min(current + 1, ESCALATION_MATRIX.length);
  const now = new Date().toISOString();
  return patchReport(id, {
    escalationLevel: level,
    escalations: [...(report.escalations ?? []), { level, at: now }],
    nextUpdateDue: hoursFrom(now, 48),
    updates: [
      ...(report.updates ?? []),
      { at: now, channel: 'portal', textKey: `plan.updates.escalated${level}` },
    ],
    timeline: [...report.timeline, { status: report.status, at: now, note: `escalated-l${level}` }],
  });
}

/** DEMO control: pretend the officer posted a progress update on time. */
export function simulateOfficerUpdate(id: string): Report | null {
  const report = getAllReports().find((r) => r.id === id || r.refNumber === id);
  if (!report) return null;
  const plan = casePlanFor(report.category);
  const now = new Date().toISOString();
  const progressed = report.status === 'received' || report.status === 'submitted'
    ? 'under-review'
    : report.status === 'under-review'
      ? 'assigned'
      : 'investigation';
  return patchReport(id, {
    status: progressed,
    nextUpdateDue: daysFrom(now, plan.updateEveryDays),
    updates: [...(report.updates ?? []), { at: now, channel: 'sms', textKey: 'plan.updates.progress' }],
    timeline: [...report.timeline, { status: progressed, at: now }],
  });
}

/** DEMO control: pretend the deadline was missed long ago, so every level of
 * the matrix can be walked one step at a time during a presentation. */
export function simulateMissedDeadline(id: string): Report | null {
  return patchReport(id, { nextUpdateDue: daysFrom(new Date().toISOString(), -30) });
}

/**
 * Level-5 public escalation: a ready-to-post social message tagging the
 * accountable authorities, plus a share intent URL. Drafted only; the
 * reporter decides whether to post it.
 */
export function socialPostDraft(report: Report): { text: string; intentUrl: string } {
  const state = report.location?.address.state;
  const stateTag = state ? `@${state.replace(/\s+/g, '')}Police` : '@DGPOffice';
  const days = Math.max(
    1,
    Math.round((Date.now() - new Date(report.submittedAt).getTime()) / 86400000),
  );
  const text =
    `Cybercrime complaint ${report.refNumber} has had no mandated update for ${days}+ days despite the published service promise. ` +
    `Requesting immediate review. @Cyberdost @IndianCERT ${stateTag} #CyberSahayata (demo)`;
  return {
    text,
    intentUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  };
}
