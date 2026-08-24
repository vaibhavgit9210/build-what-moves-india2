/** Full detail view of one submitted (demo) report, with a status timeline,
 * the accountability panel (officer, deadline, escalation matrix, update
 * log) and demo controls to simulate the backend for presentations. */
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import {
  getReport,
  escalateReport,
  simulateMissedDeadline,
  simulateOfficerUpdate,
  socialPostDraft,
} from '@/services/reportService';
import { categoryById } from '@/content/categories';
import { casePlanFor, entitledLevel, ESCALATION_MATRIX } from '@/content/casePlans';
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import type { CategoryId } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';
import { StatusTag, StatusTimeline } from '@/components/dash/StatusTimeline';
import CasePlanPanel from '@/components/report/CasePlanPanel';

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border last:border-b-0">
      <dt className="sm:w-44 shrink-0 text-muted">{label}</dt>
      <dd className="m-0 font-medium break-words">{value}</dd>
    </div>
  );
}

/** "amount-lost" / "amountLost" -> "Amount Lost". Fallback for unknown ids only. */
function humanize(id: string): string {
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Field definitions keyed by id: the report's category fields first, then all
 * other categories as a fallback for ids stored under a different category.
 */
function incidentFieldById(category: CategoryId | undefined): Map<string, IncidentField> {
  const map = new Map<string, IncidentField>();
  const lists: IncidentField[][] = category ? [incidentFieldsByCategory[category]] : [];
  lists.push(...Object.values(incidentFieldsByCategory));
  for (const fields of lists) {
    for (const field of fields) {
      if (!map.has(field.id)) map.set(field.id, field);
    }
  }
  return map;
}

/**
 * Who owns this case right now, when they owe the next update, and the
 * one-click escalation path when they miss it. Level 5 drafts a public
 * social post tagging the accountable authorities; the reporter decides.
 */
function AccountabilityPanel({
  report,
  refresh,
}: {
  report: NonNullable<ReturnType<typeof getReport>>;
  refresh: () => void;
}) {
  const { t, lang } = useI18n();
  const [showSocial, setShowSocial] = useState(false);
  const plan = casePlanFor(report.category);
  const level = report.escalationLevel ?? 1;
  const entitled = entitledLevel(report);
  const overdue = report.nextUpdateDue ? new Date(report.nextUpdateDue) < new Date() : false;
  const canEscalate = entitled > level;
  const atTop = level >= ESCALATION_MATRIX.length;
  const social = socialPostDraft(report);

  return (
    <section aria-labelledby="account-heading" className="mb-8">
      <h2 id="account-heading" className="text-2xl font-bold mb-3">
        {t('plan.account.title')}
      </h2>

      <Card className="mb-4">
        {report.officer && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-border">
            <div>
              <p className="m-0 font-bold">{report.officer.name}</p>
              <p className="m-0 text-sm text-muted">
                {t(report.officer.rankKey)} · {report.officer.unit} · {report.officer.phoneMasked}
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold self-start">
              {t('plan.account.levelChip', { level })}: {t(ESCALATION_MATRIX[level - 1].roleKey)}
            </span>
          </div>
        )}

        {report.nextUpdateDue && (
          <p className={`m-0 mb-3 font-medium ${overdue ? 'text-error' : ''}`}>
            {overdue
              ? t('plan.account.overdue', { date: formatDate(report.nextUpdateDue, lang, true) })
              : t('plan.account.nextDue', { date: formatDate(report.nextUpdateDue, lang, true) })}
          </p>
        )}

        {canEscalate ? (
          <div>
            <p className="mt-0 mb-2">{t('plan.account.escalateReady', { role: t(ESCALATION_MATRIX[Math.min(level, ESCALATION_MATRIX.length - 1)].roleKey) })}</p>
            <Button
              variant="warning"
              onClick={() => {
                escalateReport(report.id);
                refresh();
              }}
            >
              {t('plan.account.escalateBtn', { level: level + 1 })}
            </Button>
          </div>
        ) : (
          <p className="m-0 text-sm text-muted">
            {atTop ? t('plan.account.atTop') : t('plan.account.escalateLocked', { days: plan.updateEveryDays })}
          </p>
        )}

        {atTop && !report.anonymous && (
          <div className="mt-3 pt-3 border-t border-border">
            {!showSocial ? (
              <Button variant="warning" onClick={() => setShowSocial(true)}>
                {t('plan.account.socialBtn')}
              </Button>
            ) : (
              <div>
                <p className="mt-0 mb-2 font-semibold">{t('plan.account.socialTitle')}</p>
                <p className="bg-surface border border-border rounded-md p-3 text-sm break-words">{social.text}</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <a
                    href={social.intentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md bg-action text-actiontext px-4 py-2.5 font-semibold no-underline hover:bg-actionhover"
                  >
                    {t('plan.account.socialPost')}
                  </a>
                  <span className="text-sm text-muted">{t('plan.account.socialNote')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {report.updates && report.updates.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-xl font-bold mb-2">{t('plan.account.updatesTitle')}</h3>
          <ul className="list-none p-0 m-0">
            {[...report.updates].reverse().map((u, i) => (
              <li key={i} className="py-2 border-b border-border last:border-b-0 flex gap-3">
                <span className="shrink-0 rounded-sm bg-surface border border-border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide self-start mt-0.5">
                  {t(`plan.channels.${u.channel}`)}
                </span>
                <span>
                  <span className="block text-xs text-muted">{formatDate(u.at, lang, true)}</span>
                  {t(u.textKey, {
                    ref: report.refNumber,
                    officer: report.officer?.name ?? '',
                    days: plan.updateEveryDays,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-dashed">
        <h3 className="text-base font-bold mb-1">{t('plan.demo.title')}</h3>
        <p className="text-sm text-muted mt-0 mb-3">{t('plan.demo.note')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              simulateOfficerUpdate(report.id);
              refresh();
            }}
          >
            {t('plan.demo.officerUpdate')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              simulateMissedDeadline(report.id);
              refresh();
            }}
          >
            {t('plan.demo.missDeadline')}
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default function ReportDetail() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { id } = useParams<'id'>();

  // State (not memo) so escalation / demo actions can refresh the view.
  const [report, setReport] = useState(() => (id ? getReport(id) : null));
  const refresh = () => setReport(id ? getReport(id) : null);

  if (!report || !user || report.userId !== user.id) {
    return (
      <div className="max-w-2xl">
        <PageTitle>{t('dash.detail.notFound')}</PageTitle>
        <p className="text-lg mb-6">{t('dash.detail.notFoundBody')}</p>
        <Link to="/dashboard" className="text-link underline underline-offset-2 font-medium">
          {t('dash.detail.backToDashboard')}
        </Link>
      </div>
    );
  }

  const category = categoryById(report.category);
  const addr = report.location?.address;
  const addressLine = addr
    ? [addr.house, addr.street, addr.locality, addr.city].filter(Boolean).join(', ')
    : '';
  const detailEntries = Object.entries(report.incidentDetails).filter(([, v]) => v !== '');
  const fieldById = incidentFieldById(report.category);
  const notProvided = t('dash.review.notProvided');

  return (
    <div className="max-w-2xl">
      <Link
        to="/dashboard"
        className="inline-block mb-4 text-link underline underline-offset-2 font-medium"
      >
        {t('dash.detail.backToDashboard')}
      </Link>

      <PageTitle caption={<span className="font-mono">{report.refNumber}</span>}>
        {t(category.labelKey)}
      </PageTitle>

      <div className="mb-6">
        <StatusTag status={report.status} />
      </div>

      <Alert variant="info" title={t('common.demoData')}>
        <p className="m-0">{t('dash.detail.demoNote')}</p>
      </Alert>

      <AccountabilityPanel report={report} refresh={refresh} />

      <section aria-labelledby="timeline-heading" className="mb-8">
        <h2 id="timeline-heading" className="text-2xl font-bold mb-3">
          {t('dash.detail.timelineTitle')}
        </h2>
        <StatusTimeline timeline={report.timeline} status={report.status} />
      </section>

      <CasePlanPanel report={report} />

      <h2 className="text-2xl font-bold mb-3">{t('dash.detail.detailsTitle')}</h2>

      <Card className="mb-4">
        <h3 className="text-xl font-bold mb-2">{t('dash.review.aboutYou')}</h3>
        <dl className="m-0">
          <Row label={t('dash.review.name')} value={report.identity?.name || notProvided} />
          <Row
            label={t('dash.review.idType')}
            value={report.identity ? t(`docTypes.${report.identity.docType}`) : notProvided}
          />
          <Row
            label={t('dash.review.idNumber')}
            value={report.identity?.idNumber || notProvided}
          />
        </dl>
      </Card>

      <Card className="mb-4">
        <h3 className="text-xl font-bold mb-2">{t('dash.review.location')}</h3>
        <dl className="m-0">
          <Row label={t('dash.review.address')} value={addressLine || notProvided} />
          <Row label={t('dash.review.district')} value={addr?.district || notProvided} />
          <Row label={t('dash.review.state')} value={addr?.state || notProvided} />
          <Row label={t('dash.review.pin')} value={addr?.pin || notProvided} />
        </dl>
        {report.location && (
          <p className="text-sm text-muted mt-2 mb-0">
            {report.location.method === 'auto'
              ? t('dash.review.detectedAuto')
              : t('dash.review.enteredManually')}
          </p>
        )}
      </Card>

      <Card className="mb-4">
        <h3 className="text-xl font-bold mb-2">{t('dash.review.whatHappened')}</h3>
        <dl className="m-0">
          <Row label={t('dash.review.category')} value={t(category.labelKey)} />
          <Row
            label={t('dash.success.submitted')}
            value={formatDate(report.submittedAt, lang, true)}
          />
          <Row
            label={t('dash.review.description')}
            value={report.description?.text || notProvided}
          />
          {detailEntries.map(([fieldId, value]) => {
            const field = fieldById.get(fieldId);
            const option =
              field?.type === 'select' ? field.options?.find((o) => o.value === value) : undefined;
            return (
              <Row
                key={fieldId}
                label={field ? t(field.labelKey) : humanize(fieldId)}
                value={option ? t(option.labelKey) : value}
              />
            );
          })}
        </dl>
      </Card>

      <Card className="mb-4">
        <h3 className="text-xl font-bold mb-2">{t('dash.review.evidence')}</h3>
        {report.evidence.length === 0 ? (
          <p className="m-0 font-medium">{t('dash.review.evidenceNone')}</p>
        ) : (
          <ul className="list-disc pl-5 m-0">
            {report.evidence.map((e) => (
              <li key={e.id} className="break-words">
                {e.name}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {report.technical && (
        <Card className="mb-4">
          <h3 className="text-xl font-bold mb-2">
            {t('dash.review.technicalTitle')} ({t('common.demoData')})
          </h3>
          <dl className="m-0">
            <Row label={t('dash.detail.device')} value={report.technical.device} />
            <Row label={t('dash.detail.browser')} value={report.technical.browser} />
            <Row label={t('dash.detail.approxIp')} value={report.technical.approxIp} />
            <Row label={t('dash.detail.sessionId')} value={report.technical.sessionId} />
          </dl>
        </Card>
      )}

      <div className="mt-6">
        <Link to="/dashboard" className="text-link underline underline-offset-2 font-medium">
          {t('dash.detail.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
