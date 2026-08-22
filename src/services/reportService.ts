/**
 * Demo report store. Reports live in localStorage; nothing is ever sent
 * to NCRP or any real system.
 */
import { loadJSON, saveJSON, KEYS } from '@/lib/storage';
import { makeRefNumber, uid } from '@/lib/id';
import type { DraftReport, Report, TechnicalInfo, User } from '@/lib/types';

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

export function submitReport(
  draft: DraftReport,
  user: User,
  technical: TechnicalInfo | undefined,
  lang: string,
): Report {
  const now = new Date();
  const received = new Date(now.getTime() + 60_000);
  const report: Report = {
    id: uid(),
    refNumber: makeRefNumber(now),
    userId: user.id,
    category: draft.category ?? 'other',
    priority: draft.priority ?? 'standard',
    submittedAt: now.toISOString(),
    status: 'received',
    timeline: [
      { status: 'submitted', at: now.toISOString() },
      { status: 'received', at: received.toISOString() },
    ],
    location: draft.location,
    identity: draft.identity,
    answers: draft.answers,
    description: draft.description,
    incidentDetails: draft.incidentDetails,
    evidence: draft.evidence,
    extraNotes: draft.extraNotes,
    technical,
    lang,
  };
  saveAllReports([...getAllReports(), report]);
  return report;
}
