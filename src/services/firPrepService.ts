/**
 * FIR preparation seam.
 *
 * Two halves, deliberately split:
 *  - buildFirPayload() assembles the case facts the model is allowed to see.
 *    It is built from the report record and casePlans.ts only, and it NEVER
 *    includes reporter PII: no name, no contact details, no identity document,
 *    no OCR output. Incident evidence (amounts, UPI ids, transaction ids,
 *    scammer handles) does go, because that is the evidentiary substance of
 *    the case. Same firewall the /ask assistant has, drawn one step further
 *    out: /fir-prep sees the case, never the person.
 *  - requestFirPrep() calls the worker's /fir-prep route, which follows the
 *    same provider chain as /ask (Groq when GROQ_API_KEY is set, keyless
 *    Workers AI otherwise). On any failure the caller falls back to the canned
 *    checklist in the `admin` i18n namespace, clearly labeled as such.
 *
 * The rest of the pack (statutes, dates, complainant block, evidence list) is
 * assembled client side from the record, so the model can only contribute the
 * two things it is asked for and cannot invent a section.
 */
import { casePlanFor } from '@/content/casePlans';
import { categoryById } from '@/content/categories';
import { incidentFieldsByCategory } from '@/content/incidentFields';
import { platformLabelKey } from '@/content/platforms';
import { formatDate, type TFunc } from '@/i18n';
import type { Lang, Report } from '@/lib/types';

export const FIR_ENDPOINT: string | null =
  'https://sahayata-help.vaibhavpro9210.workers.dev/fir-prep';

export interface FirPayload {
  category: string;
  statutes: string[];
  description: string;
  /** Structured incident answers as "Label: value" lines. */
  details: string[];
  evidence: string[];
  /** Anything about money, pulled out so the model can be told to be exact. */
  financial: string[];
  dates: string[];
  place: string;
}

export interface FirPack {
  /** 'live' = the model answered; 'demo' = canned, and labeled as such. */
  provider: 'live' | 'demo';
  /** Plain language pre-FIR checks. Null on 'demo': use the canned i18n list. */
  checklist: string[] | null;
  /** Plain language retelling of the incident. Null on 'demo'. */
  briefFacts: string | null;
}

/** Money-shaped incident fields, by id suffix. */
function isFinancialField(id: string): boolean {
  return /amount|upi|txn|account|wallet|bank|paid|payee|method|demand/i.test(id);
}

export function buildFirPayload(report: Report, t: TFunc, lang: Lang): FirPayload {
  const plan = casePlanFor(report.category);
  const fields = incidentFieldsByCategory[report.category] ?? [];
  const labelOf = (id: string) => {
    const field = fields.find((f) => f.id === id.replace(/:(unsure|note)$/, ''));
    if (!field) return id;
    const suffix = id.endsWith(':note') ? ` (${t('admin.fir.approx')})` : '';
    return t(field.labelKey) + suffix;
  };
  const valueOf = (id: string, raw: string) => {
    const field = fields.find((f) => f.id === id);
    if (field?.type === 'select') {
      const option = field.options?.find((o) => o.value === raw);
      if (option) return t(option.labelKey);
    }
    // Stored date fields are ISO-ish; the pack is read by a person.
    if (field?.type === 'date' || field?.type === 'datetime-local') {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        return formatDate(d.toISOString(), lang, field.type === 'datetime-local');
      }
    }
    return raw;
  };

  const entries = Object.entries(report.incidentDetails).filter(
    ([id, v]) => v !== '' && !id.endsWith(':unsure'),
  );
  const details: string[] = [];
  const financial: string[] = [];
  const dates: string[] = [];
  for (const [id, raw] of entries) {
    const line = `${labelOf(id)}: ${valueOf(id, raw)}`;
    const base = id.replace(/:(unsure|note)$/, '');
    const field = fields.find((f) => f.id === base);
    if (field && (field.type === 'date' || field.type === 'datetime-local')) dates.push(line);
    else if (isFinancialField(base)) financial.push(line);
    else details.push(line);
  }

  for (const p of report.platforms ?? []) {
    details.push(
      `${t('admin.fir.platform')}: ${t(platformLabelKey(p.id))}${p.handle ? ` (${p.handle})` : ''}`,
    );
  }
  if (report.extraNotes) details.push(`${t('admin.fir.extraNotes')}: ${report.extraNotes}`);

  const addr = report.location?.address;
  const place = addr
    ? [addr.locality, addr.city, addr.district, addr.state, addr.pin].filter(Boolean).join(', ')
    : '';

  return {
    category: t(categoryById(report.category).labelKey),
    statutes: plan.statutes.map((s) => `${s.ref}: ${t(s.gistKey)}`),
    description: report.description?.text ?? '',
    details,
    evidence: report.evidence.map(
      (e) => `${t(`media.evidence.kinds.${e.kind}`)}: ${e.name}${e.url ? ` (${e.url})` : ''}`,
    ),
    financial,
    dates,
    place,
  };
}

export async function requestFirPrep(payload: FirPayload, lang: string): Promise<FirPack> {
  if (FIR_ENDPOINT) {
    try {
      const res = await fetch(FIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, lang }),
      });
      if (res.ok) {
        const data = (await res.json()) as { checklist?: unknown; briefFacts?: unknown };
        const checklist = Array.isArray(data.checklist)
          ? data.checklist.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
          : [];
        const briefFacts = typeof data.briefFacts === 'string' ? data.briefFacts.trim() : '';
        if (checklist.length > 0 && briefFacts) {
          return { provider: 'live', checklist, briefFacts };
        }
      }
    } catch {
      // Fall through to the canned pack.
    }
  }
  return { provider: 'demo', checklist: null, briefFacts: null };
}
