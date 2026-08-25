/**
 * Authority-side case operations: which tickets an officer can see, moving a
 * ticket through verification, posting updates the reporter reads on their own
 * pages, and the PII request/grant gate.
 *
 * Two rules hold this together:
 *  - the reporter's view is the same array the authority writes to. A status
 *    update from this portal lands in `report.updates`, the list the tracking
 *    and dashboard pages already render. There is no second channel.
 *  - nothing here ever unmasks identity by itself. `piiUnlocked()` is the only
 *    reader of that gate, and it only returns true once the reporter has
 *    granted this specific authority access on this specific ticket.
 *
 * Every write appends to `report.audit`, which is what makes the gate
 * trustworthy rather than decorative.
 */
import { getAllReports, getReport, patchReport } from '@/services/reportService';
import { authorityById, toCaseOfficer, type Authority } from '@/content/authorityRoster';
import { casePlanFor } from '@/content/casePlans';
import { uid } from '@/lib/id';
import type {
  AuditEntry,
  PiiAccessRequest,
  Report,
  VerificationStatus,
} from '@/lib/types';

/** Tickets assigned to this authority, newest first. */
export function listOwnTickets(authority: Authority): Report[] {
  return getAllReports()
    .filter((r) => r.officer?.id === authority.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Everything in the unit. Only meaningful for the in-charge rank, who already
 * sits above the investigating officer on the escalation matrix.
 */
export function listUnitTickets(authority: Authority): Report[] {
  return getAllReports()
    .filter((r) => r.officer && authorityById(r.officer.id)?.unit === authority.unit)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/** What this authority is allowed to open: own tickets, plus the unit if in-charge. */
export function listVisibleTickets(authority: Authority): Report[] {
  return authority.rank === 'in-charge' ? listUnitTickets(authority) : listOwnTickets(authority);
}

export function canOpen(authority: Authority, report: Report): boolean {
  if (report.officer?.id === authority.id) return true;
  if (authority.rank !== 'in-charge') return false;
  return authorityById(report.officer?.id)?.unit === authority.unit;
}

/** Reuses the report model's own deadline; no parallel SLA clock. */
export function isOverdue(report: Report, now = new Date()): boolean {
  return report.nextUpdateDue ? new Date(report.nextUpdateDue) < now : false;
}

export function verificationOf(report: Report): VerificationStatus {
  return report.verificationStatus ?? 'pending';
}

function withAudit(report: Report, entry: AuditEntry): AuditEntry[] {
  return [...(report.audit ?? []), entry];
}

/**
 * Set verification and leave a note. The reporter is told: the same entry goes
 * into `updates`, so it shows up on their tracking page and dashboard.
 */
export function setVerification(
  reportId: string,
  authority: Authority,
  status: VerificationStatus,
  note: string,
): Report | null {
  const report = getReport(reportId);
  if (!report || !canOpen(authority, report)) return null;
  const now = new Date().toISOString();
  const trimmed = note.trim();
  return patchReport(report.id, {
    verificationStatus: status,
    verificationNotes: trimmed || undefined,
    verifiedAt: status === 'verified' ? now : undefined,
    updates: [
      ...(report.updates ?? []),
      {
        at: now,
        channel: 'portal',
        textKey: `admin.updates.verification.${status}`,
        note: trimmed || undefined,
        actor: authority.name,
      },
    ],
    audit: withAudit(report, {
      at: now,
      actor: authority.name,
      actorKind: 'authority',
      actionKey: `admin.audit.verification.${status}`,
      detail: trimmed || undefined,
    }),
  });
}

/** A message the officer writes themselves. Lands in the reporter's update log. */
export function addManualUpdate(
  reportId: string,
  authority: Authority,
  message: string,
): Report | null {
  const report = getReport(reportId);
  const text = message.trim();
  if (!report || !text || !canOpen(authority, report)) return null;
  const plan = casePlanFor(report.category);
  const now = new Date();
  return patchReport(report.id, {
    // Posting an update resets the cadence clock, exactly as an on-time
    // officer update from the demo controls does.
    nextUpdateDue: new Date(now.getTime() + plan.updateEveryDays * 86400_000).toISOString(),
    updates: [
      ...(report.updates ?? []),
      { at: now.toISOString(), channel: 'portal', text, actor: authority.name },
    ],
    audit: withAudit(report, {
      at: now.toISOString(),
      actor: authority.name,
      actorKind: 'authority',
      actionKey: 'admin.audit.update',
      detail: text,
    }),
  });
}

/** In-charge only: hand the ticket to another officer in the same unit. */
export function reassignTicket(
  reportId: string,
  authority: Authority,
  toAuthorityId: string,
): Report | null {
  const report = getReport(reportId);
  const target = authorityById(toAuthorityId);
  if (!report || !target || authority.rank !== 'in-charge') return null;
  if (!canOpen(authority, report) || target.unit !== authority.unit) return null;
  const now = new Date().toISOString();
  return patchReport(report.id, {
    officer: toCaseOfficer(target),
    updates: [
      ...(report.updates ?? []),
      { at: now, channel: 'portal', textKey: 'admin.updates.reassigned', actor: target.name },
    ],
    audit: withAudit(report, {
      at: now,
      actor: authority.name,
      actorKind: 'authority',
      actionKey: 'admin.audit.reassigned',
      detail: target.name,
    }),
  });
}

/** Generating a prep pack is an action on the case, so it is logged too. */
export function logFirGenerated(reportId: string, authority: Authority): Report | null {
  const report = getReport(reportId);
  if (!report || !canOpen(authority, report)) return null;
  return patchReport(report.id, {
    audit: withAudit(report, {
      at: new Date().toISOString(),
      actor: authority.name,
      actorKind: 'authority',
      actionKey: 'admin.audit.firGenerated',
    }),
  });
}

/* ---------------------------------------------------------------- PII gate */

/**
 * PII is everything captured at the identity step, plus the reporter's account
 * contact details. Incident evidence (transaction ids, UPI handles, scammer
 * handles, screenshots) is NOT PII: it is what the officer is investigating,
 * and it stays visible.
 */
export function hasPii(report: Report): boolean {
  return !report.anonymous && Boolean(report.identity || report.userId);
}

export function pendingPiiRequest(report: Report): PiiAccessRequest | null {
  return (report.piiRequests ?? []).find((r) => r.status === 'pending') ?? null;
}

/** True only once the reporter has granted THIS authority access to THIS ticket. */
export function piiUnlocked(report: Report, authorityId: string | undefined): boolean {
  if (!authorityId) return false;
  return (report.piiRequests ?? []).some(
    (r) => r.status === 'granted' && r.requestedBy === authorityId,
  );
}

/** The grant that unlocked this ticket, for the timestamp on the FIR pack. */
export function grantedRequest(
  report: Report,
  authorityId: string | undefined,
): PiiAccessRequest | null {
  if (!authorityId) return null;
  return (
    (report.piiRequests ?? []).find(
      (r) => r.status === 'granted' && r.requestedBy === authorityId,
    ) ?? null
  );
}

export function requestPii(
  reportId: string,
  authority: Authority,
  reason: string,
): Report | null {
  const report = getReport(reportId);
  const trimmed = reason.trim();
  if (!report || !trimmed || !canOpen(authority, report)) return null;
  // Anonymous reports have no identity to release; the UI hides the action.
  if (!hasPii(report) || pendingPiiRequest(report)) return null;
  const now = new Date().toISOString();
  const request: PiiAccessRequest = {
    id: uid(),
    requestedBy: authority.id,
    requestedByName: authority.name,
    requestedAt: now,
    reason: trimmed,
    status: 'pending',
  };
  return patchReport(report.id, {
    piiRequests: [...(report.piiRequests ?? []), request],
    updates: [
      ...(report.updates ?? []),
      { at: now, channel: 'portal', textKey: 'admin.updates.piiRequested', actor: authority.name },
    ],
    audit: withAudit(report, {
      at: now,
      actor: authority.name,
      actorKind: 'authority',
      actionKey: 'admin.audit.piiRequested',
      detail: trimmed,
    }),
  });
}

/** Called from the REPORTER's pages, never from the admin portal. */
export function decidePiiRequest(
  reportId: string,
  requestId: string,
  decision: 'granted' | 'denied',
  reporterName: string,
): Report | null {
  const report = getReport(reportId);
  if (!report) return null;
  const request = (report.piiRequests ?? []).find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return null;
  const now = new Date().toISOString();
  return patchReport(report.id, {
    piiRequests: (report.piiRequests ?? []).map((r) =>
      r.id === requestId ? { ...r, status: decision, decidedAt: now } : r,
    ),
    audit: withAudit(report, {
      at: now,
      actor: reporterName,
      actorKind: 'reporter',
      actionKey: `admin.audit.pii.${decision}`,
      detail: request.requestedByName,
    }),
  });
}

/** Redacted placeholder shown wherever a PII value would sit. */
export const PII_MASK = '••••••••';

export function maskPii(value: string | undefined, unlocked: boolean): string | null {
  if (!value) return null;
  return unlocked ? value : PII_MASK;
}
