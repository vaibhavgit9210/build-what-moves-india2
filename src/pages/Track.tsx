/** Public "track a report" page: reference number in, limited status view out. */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { trackReport } from '@/services/reportService';
import { categoryById } from '@/content/categories';
import type { Report } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Alert, Card, ErrorSummary, PageTitle } from '@/components/ui/Misc';
import { StatusTag, StatusTimeline } from '@/components/dash/StatusTimeline';

export default function Track() {
  const { t, lang } = useI18n();
  const [ref, setRef] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ searched: boolean; report: Report | null }>({
    searched: false,
    report: null,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ref.trim()) {
      setError(t('dash.track.refError'));
      setResult({ searched: false, report: null });
      return;
    }
    setError(null);
    setResult({ searched: true, report: trackReport(ref) });
  };

  const report = result.report;
  const category = report ? categoryById(report.category) : null;

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('dash.track.title')}</PageTitle>
      <p className="text-lg mb-6">{t('dash.track.intro')}</p>

      <ErrorSummary errors={error ? [error] : []} />

      <form onSubmit={onSubmit} noValidate className="mb-8">
        <TextInput
          label={t('dash.track.refLabel')}
          hint={t('dash.track.refHint')}
          error={error ?? undefined}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono uppercase"
        />
        <Button type="submit" fullWidth className="sm:w-auto">
          {t('dash.track.searchBtn')}
        </Button>
      </form>

      {result.searched && report?.anonymous && (
        <Alert variant="info" title={t('dash.track.anonTitle')}>
          <p className="m-0">{t('dash.track.anonBody')}</p>
        </Alert>
      )}

      {result.searched && report && !report.anonymous && category && (
        <section aria-labelledby="track-result" className="mb-8">
          <h2 id="track-result" className="text-2xl font-bold mb-3">
            {t('dash.track.resultTitle')}
          </h2>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <p className="font-mono text-lg font-bold m-0 break-all">{report.refNumber}</p>
              <StatusTag status={report.status} />
            </div>
            <dl className="m-0 mb-4">
              <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border">
                <dt className="sm:w-44 shrink-0 text-muted">{t('dash.review.category')}</dt>
                <dd className="m-0 font-medium">{t(category.labelKey)}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border">
                <dt className="sm:w-44 shrink-0 text-muted">{t('dash.track.submitted')}</dt>
                <dd className="m-0 font-medium">{formatDate(report.submittedAt, lang, true)}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border">
                <dt className="sm:w-44 shrink-0 text-muted">{t('dash.track.currentStatus')}</dt>
                <dd className="m-0 font-medium">{t(`status.${report.status}`)}</dd>
              </div>
              {report.officer && (
                <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border">
                  <dt className="sm:w-44 shrink-0 text-muted">{t('plan.account.handler')}</dt>
                  <dd className="m-0 font-medium">
                    {report.officer.name}, {report.officer.unit}
                  </dd>
                </div>
              )}
              {report.nextUpdateDue && (
                <div className="flex flex-col sm:flex-row sm:gap-4 py-2">
                  <dt className="sm:w-44 shrink-0 text-muted">{t('plan.account.nextDueShort')}</dt>
                  <dd
                    className={`m-0 font-medium ${new Date(report.nextUpdateDue) < new Date() ? 'text-error' : ''}`}
                  >
                    {formatDate(report.nextUpdateDue, lang, true)}
                    {new Date(report.nextUpdateDue) < new Date() && ` (${t('plan.account.overdueShort')})`}
                  </dd>
                </div>
              )}
            </dl>
            <StatusTimeline timeline={report.timeline} status={report.status} />
            <p className="text-sm text-muted mt-4 mb-0">{t('dash.track.privacyNote')}</p>
          </Card>
        </section>
      )}

      {result.searched && !report && (
        <Alert variant="error" title={t('dash.track.notFoundTitle')}>
          <p className="m-0">{t('dash.track.notFoundBody')}</p>
        </Alert>
      )}

      <Alert variant="info" title={t('dash.track.loginHintTitle')}>
        <p className="mb-1">{t('dash.track.loginHint')}</p>
        <p className="m-0">
          <Link to="/login" className="text-link underline underline-offset-2">
            {t('nav.login')}
          </Link>
        </p>
      </Alert>
    </div>
  );
}
