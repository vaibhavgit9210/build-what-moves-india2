/** Full detail view of one submitted (demo) report, with a status timeline. */
import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { getReport } from '@/services/reportService';
import { categoryById } from '@/content/categories';
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import type { CategoryId } from '@/lib/types';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';
import { StatusTag, StatusTimeline } from '@/components/dash/StatusTimeline';

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

export default function ReportDetail() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { id } = useParams<'id'>();

  const report = useMemo(() => (id ? getReport(id) : null), [id]);

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

      <section aria-labelledby="timeline-heading" className="mb-8">
        <h2 id="timeline-heading" className="text-2xl font-bold mb-3">
          {t('dash.detail.timelineTitle')}
        </h2>
        <StatusTimeline timeline={report.timeline} status={report.status} />
      </section>

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
