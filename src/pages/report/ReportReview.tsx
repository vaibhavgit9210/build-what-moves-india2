/** Final check-your-answers page of the report journey. */
import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { useDraft } from '@/state/DraftContext';
import { prevPath, ROUTE_SEQUENCE } from '@/lib/steps';
import { categoryById } from '@/content/categories';
import { guidanceByCategory } from '@/content/guidance';
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import type { CategoryId } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Field';
import { Alert, Card, ErrorSummary, PageTitle, ProgressSteps } from '@/components/ui/Misc';

/** "amount-lost" / "amountLost" -> "Amount Lost". Fallback for unknown ids only. */
function humanize(id: string): string {
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Field definitions keyed by id: the given category's fields first, then all
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
 * Human-readable value for a detail row: dates/datetimes in the UI language,
 * numbers with Indian digit grouping. Falls back to the stored string.
 */
function formatFieldValue(field: IncidentField | undefined, value: string, lang: string): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  if (field?.type === 'date' || field?.type === 'datetime-local') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return field.type === 'date'
        ? d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        : d.toLocaleString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
    }
  }
  if (field?.type === 'number') {
    const n = Number(value);
    if (Number.isFinite(n)) return n.toLocaleString(locale);
  }
  return value;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border last:border-b-0">
      <dt className="sm:w-44 shrink-0 text-muted">{label}</dt>
      <dd className="m-0 font-medium break-words">{value}</dd>
    </div>
  );
}

function SectionCard({
  title,
  editTo,
  children,
}: {
  title: string;
  editTo?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Card className="mb-4 max-w-2xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {editTo && (
          <Link
            to={editTo}
            aria-label={t('dash.review.editAria', { section: title })}
            className="text-link underline underline-offset-2 font-medium shrink-0"
          >
            {t('common.edit')}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

export default function ReportReview() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { draft, submitDraft } = useDraft();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!draft) return <Navigate to="/report" replace />;

  // Essential sections missing: send the user back into the journey instead
  // of letting a near-empty report through.
  if (!draft.category || !draft.description?.text) {
    const resume =
      draft.lastPath !== '/report/review' && ROUTE_SEQUENCE.some((r) => r.path === draft.lastPath)
        ? draft.lastPath
        : '/report/questions';
    return <Navigate to={resume} replace />;
  }

  const category = draft.category ? categoryById(draft.category) : null;
  const fieldById = incidentFieldById(draft.category);
  const guidance = draft.category ? guidanceByCategory[draft.category] : [];
  const addr = draft.location?.address;
  const addressLine = addr
    ? [addr.house, addr.street, addr.locality, addr.city].filter(Boolean).join(', ')
    : '';
  const detailEntries = Object.entries(draft.incidentDetails).filter(([, v]) => v !== '');
  const notProvided = t('dash.review.notProvided');
  const anonymous = draft.mode === 'anonymous';
  const back = prevPath('/report/review', anonymous);

  const onSubmit = () => {
    if (!confirmed) {
      setError(t('dash.review.confirmError'));
      return;
    }
    if (!user && !anonymous) return;
    setSubmitError(false);
    setSubmitting(true);
    try {
      const report = submitDraft(anonymous ? null : user, lang);
      navigate('/report/success', { state: { reportId: report.id } });
    } catch {
      setSubmitting(false);
      setSubmitError(true);
    }
  };

  return (
    <div>
      <ProgressSteps />
      <PageTitle>{t('dash.review.title')}</PageTitle>
      <p className="text-lg max-w-2xl mb-6">{t('dash.review.intro')}</p>

      <ErrorSummary errors={error ? [error] : []} />

      {anonymous ? (
        <SectionCard title={t('dash.review.aboutYou')}>
          <p className="mb-1 font-medium">{t('dash.review.anonymousRow')}</p>
          <p className="text-sm text-muted mb-0">{t('dash.review.anonymousNote')}</p>
        </SectionCard>
      ) : (
        <SectionCard title={t('dash.review.aboutYou')} editTo="/report/identity">
          <dl className="m-0">
            <Row label={t('dash.review.name')} value={draft.identity?.name || notProvided} />
            <Row
              label={t('dash.review.idType')}
              value={draft.identity ? t(`docTypes.${draft.identity.docType}`) : notProvided}
            />
            <Row
              label={t('dash.review.idNumber')}
              value={draft.identity?.idNumber || notProvided}
            />
            <Row label={t('docTypes.mobile')} value={user?.mobile || notProvided} />
            <Row label={t('docTypes.email')} value={user?.email || notProvided} />
          </dl>
        </SectionCard>
      )}

      <SectionCard title={t('dash.review.location')} editTo="/report/location">
        <dl className="m-0">
          <Row label={t('dash.review.address')} value={addressLine || notProvided} />
          <Row label={t('dash.review.district')} value={addr?.district || notProvided} />
          <Row label={t('dash.review.state')} value={addr?.state || notProvided} />
          <Row label={t('dash.review.pin')} value={addr?.pin || notProvided} />
        </dl>
        {draft.location && (
          <p className="text-sm text-muted mt-2 mb-0">
            {draft.location.method === 'auto'
              ? t('dash.review.detectedAuto')
              : draft.location.method === 'map'
                ? t('dash.review.chosenOnMap')
                : t('dash.review.enteredManually')}
          </p>
        )}
      </SectionCard>

      <SectionCard title={t('dash.review.whatHappened')} editTo="/report/questions">
        <dl className="m-0">
          <Row
            label={t('dash.review.category')}
            value={category ? t(category.labelKey) : notProvided}
          />
          <Row
            label={t('dash.review.description')}
            value={draft.description?.text || notProvided}
          />
          {detailEntries.map(([fieldId, value]) => {
            // "<id>:unsure" is a UI flag; "<id>:note" is the "roughly when"
            // text shown under the base field's label.
            if (fieldId.endsWith(':unsure')) return null;
            if (fieldId.endsWith(':note')) {
              const base = fieldById.get(fieldId.slice(0, -':note'.length));
              return (
                <Row
                  key={fieldId}
                  label={
                    base
                      ? `${t(base.labelKey)} (${t('media.details.reviewApprox')})`
                      : humanize(fieldId)
                  }
                  value={value}
                />
              );
            }
            const field = fieldById.get(fieldId);
            const option =
              field?.type === 'select' ? field.options?.find((o) => o.value === value) : undefined;
            return (
              <Row
                key={fieldId}
                label={field ? t(field.labelKey) : humanize(fieldId)}
                value={option ? t(option.labelKey) : formatFieldValue(field, value, lang)}
              />
            );
          })}
        </dl>
      </SectionCard>

      <SectionCard title={t('dash.review.evidence')} editTo="/report/evidence">
        <p className="mb-0 font-medium">
          {draft.evidence.length === 0
            ? t('dash.review.evidenceNone')
            : draft.evidence.length === 1
              ? t('dash.review.evidenceOne')
              : t('dash.review.evidenceMany', { count: draft.evidence.length })}
        </p>
        {draft.evidence.length > 0 && (
          <ul className="list-disc pl-5 mt-2 mb-0">
            {draft.evidence.map((e) => (
              <li key={e.id} className="break-words">
                {e.name}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {guidance.length > 0 && (
        <SectionCard title={t('dash.review.immediateActions')}>
          <p className="text-sm text-muted mb-2">{t('dash.review.immediateActionsHint')}</p>
          <ol className="list-decimal pl-5 mb-0">
            {guidance.map((step) => (
              <li key={step.titleKey} className="font-medium py-0.5">
                {t(step.titleKey)}
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {draft.consent.technical && (
        <Alert
          variant="info"
          title={`${t('dash.review.technicalTitle')} (${t('common.demoData')})`}
        >
          <p className="m-0">{t('dash.review.technicalNote')}</p>
        </Alert>
      )}

      <div className="max-w-2xl mt-6">
        {submitError && (
          <Alert variant="error" title={t('dash.review.submitFailedTitle')}>
            <p className="m-0">{t('dash.review.submitFailedBody')}</p>
          </Alert>
        )}
        <Checkbox
          label={t('dash.review.confirmLabel')}
          checked={confirmed}
          onChange={(v) => {
            setConfirmed(v);
            if (v) setError(null);
          }}
          error={error ?? undefined}
        />
        <Button onClick={onSubmit} loading={submitting} fullWidth className="sm:w-auto">
          {t('dash.review.submit')}
        </Button>
        <div className="mt-4">
          {back && (
            <Link to={back} className="text-link underline underline-offset-2 font-medium">
              {t('common.back')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
