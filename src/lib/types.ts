/** Core shared types. Every feature module builds against these. */

export type Lang = 'en' | 'hi';

export type DocType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'driving-licence'
  | 'voter-id'
  | 'ration-card'
  | 'other';

/** Identifier the account was created with. */
export type IdMethod = DocType | 'other-gov-id' | 'email' | 'mobile';

export interface User {
  id: string;
  name: string;
  idMethod: IdMethod;
  /** The (synthetic) identifier value, e.g. "demo@example.com" or "XXXX XXXX 1234". */
  identifier: string;
  email?: string;
  mobile?: string;
  passwordHash: string;
  state?: string;
  createdAt: string;
  isDemo?: boolean;
}

export type CategoryId =
  | 'financial-fraud'
  | 'investment-job-fraud'
  | 'loan-app-abuse'
  | 'romance-scam'
  | 'sextortion'
  | 'account-hacking'
  | 'phishing'
  | 'harassment'
  | 'impersonation'
  | 'social-media-abuse'
  | 'ransomware'
  | 'crypto-fraud'
  | 'identity-theft'
  | 'data-breach'
  | 'sensitive-content'
  | 'child-safety'
  | 'other';

/**
 * emergency  = someone is in immediate danger (show 112 first)
 * immediate  = act now (e.g. financial fraud → 1930)
 * standard   = normal reporting flow
 */
export type Priority = 'emergency' | 'immediate' | 'standard';

/**
 * anonymous = no account, no identity step; the report cannot be tracked
 *             or followed up. tracked = signed in, saved to the account.
 */
export type ReportMode = 'anonymous' | 'tracked';

export type Answer = 'yes' | 'no' | 'unsure';
/** Keyed by decision-tree question id. */
export type DecisionAnswers = Record<string, Answer>;

export interface Address {
  house: string;
  street: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pin: string;
}

export interface LocationInfo {
  /** auto = browser geolocation, map = pin chosen on the map, manual = typed. */
  method: 'auto' | 'manual' | 'map';
  address: Address;
  lat?: number;
  lon?: number;
}

export interface IdentityInfo {
  method: 'upload' | 'photo' | 'manual';
  docType: DocType;
  name: string;
  /** Always masked / synthetic, e.g. "XXXX XXXX 1234". */
  idNumber: string;
  dob?: string;
  fileName?: string;
}

/** One entry of the multi-select "where did it happen" picker. */
export interface PlatformEntry {
  id: string;
  /** Optional link or username on that platform. */
  handle?: string;
}

export type EvidenceKind = 'screenshot' | 'chat' | 'document' | 'url' | 'video' | 'other';

export interface EvidenceMeta {
  id: string;
  kind: EvidenceKind;
  name: string;
  size?: number;
  mime?: string;
  /** For kind === 'url'. */
  url?: string;
  note?: string;
}

export interface DescriptionInfo {
  mode: 'typed' | 'voice';
  /** Final (possibly edited / translated) text that goes into the report. */
  text: string;
  /** Language the final text is in ('en' | 'hi' | free label). */
  language: string;
  /** Raw transcript before edits, when mode === 'voice'. */
  originalTranscript?: string;
  audioDurationSec?: number;
  transcriptProvider?: 'whisper' | 'demo';
}

export interface TechnicalInfo {
  device: string;
  browser: string;
  approxIp: string;
  sessionId: string;
  consented: boolean;
}

export type StepGroup = 'location' | 'identity' | 'incident' | 'evidence' | 'review';

export interface DraftReport {
  startedAt: string;
  /** Last route the user was on, for "continue where you left off". */
  lastPath: string;
  /** Absent on drafts from before the chooser existed; treat as 'tracked'. */
  mode?: ReportMode;
  /** User chose "I already know the category" instead of the questions. */
  triageSkipped?: boolean;
  consent: { location?: boolean; technical?: boolean };
  location?: LocationInfo;
  identity?: IdentityInfo;
  answers: DecisionAnswers;
  /** Suggested (or user-overridden) category. */
  category?: CategoryId;
  categoryOverridden?: boolean;
  priority?: Priority;
  guidanceAcknowledged?: boolean;
  description?: DescriptionInfo;
  /** Platforms where the incident occurred (categories with a platforms field). */
  platforms?: PlatformEntry[];
  /** Answers to the category-specific incident form, keyed by field id. */
  incidentDetails: Record<string, string>;
  evidence: EvidenceMeta[];
  extraNotes?: string;
}

export type ReportStatus =
  | 'submitted'
  | 'received'
  | 'under-review'
  | 'assigned'
  | 'investigation'
  | 'resolved';

export const STATUS_ORDER: ReportStatus[] = [
  'submitted',
  'received',
  'under-review',
  'assigned',
  'investigation',
  'resolved',
];

export interface TimelineEvent {
  status: ReportStatus;
  at: string; // ISO
  note?: string;
}

/** The (synthetic) officer accountable for a report right now. */
export interface CaseOfficer {
  /** Roster id (authorityRoster.ts). Matches the admin portal login. */
  id: string;
  name: string;
  /** i18n key for the rank/role, e.g. plan.roles.io */
  rankKey: string;
  unit: string;
  /** Masked demo contact, e.g. "+91 98XXX XX210". */
  phoneMasked: string;
}

/** One entry of the update log (mock SMS / email / portal messages). */
export interface CaseUpdate {
  at: string; // ISO
  channel: 'sms' | 'email' | 'portal';
  /** i18n key under plan.updates.*; {ref}, {officer}, {date} interpolated. */
  textKey?: string;
  /** Verbatim message written by an authority in the admin portal. */
  text?: string;
  /** The officer's own words alongside a templated `textKey` sentence. */
  note?: string;
  /** Who sent it, for authority-authored updates. */
  actor?: string;
}

/**
 * Where the authority has got to on checking the report is real and
 * actionable. Distinct from ReportStatus, which is the investigation stage.
 */
export type VerificationStatus = 'pending' | 'verified' | 'needs-more-info' | 'rejected';

/**
 * An authority asking the reporter to release their identity details for one
 * ticket. Nothing unmasks until the reporter grants it from their own pages.
 */
export interface PiiAccessRequest {
  id: string;
  /** Roster id of the requesting authority. */
  requestedBy: string;
  requestedByName: string;
  requestedAt: string; // ISO
  reason: string;
  status: 'pending' | 'granted' | 'denied';
  decidedAt?: string; // ISO
}

/** One line of the per-ticket accountability log. */
export interface AuditEntry {
  at: string; // ISO
  /** Display name of whoever acted. */
  actor: string;
  actorKind: 'authority' | 'reporter' | 'system';
  /** i18n key under admin.audit.*; params interpolated. */
  actionKey: string;
  /** Free text the actor themselves typed (a note or a reason). */
  detail?: string;
}

/** One escalation the reporter has raised. */
export interface EscalationEvent {
  level: number; // 1-5 (matrix level escalated TO)
  at: string; // ISO
}

export interface Report {
  id: string;
  refNumber: string;
  /** Absent on anonymous reports. */
  userId?: string;
  /** Submitted without an account; cannot be tracked or followed up. */
  anonymous?: boolean;
  category: CategoryId;
  priority: Priority;
  submittedAt: string; // ISO
  status: ReportStatus;
  timeline: TimelineEvent[];
  location?: LocationInfo;
  identity?: IdentityInfo;
  answers: DecisionAnswers;
  description?: DescriptionInfo;
  platforms?: PlatformEntry[];
  incidentDetails: Record<string, string>;
  evidence: EvidenceMeta[];
  extraNotes?: string;
  technical?: TechnicalInfo;
  /** Language the report was filed in. */
  lang: string;
  /** Accountability layer (absent on reports from before the revamp). */
  officer?: CaseOfficer;
  /** When the next mandatory update is due; past due arms escalation. */
  nextUpdateDue?: string; // ISO
  updates?: CaseUpdate[];
  /** Current escalation-matrix level (1 = investigating officer). */
  escalationLevel?: number;
  escalations?: EscalationEvent[];
  /** Authority-portal layer (absent on reports filed before it existed). */
  verificationStatus?: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string; // ISO
  piiRequests?: PiiAccessRequest[];
  audit?: AuditEntry[];
}
