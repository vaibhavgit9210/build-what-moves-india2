/** GOV.UK-style confirmation panel after submitting a report. */
import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { getReport, listReports } from '@/services/reportService';
import { categoryById } from '@/content/categories';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, PageTitle } from '@/components/ui/Misc';

export default function ReportSuccess() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as { reportId?: string } | null;

  const report = useMemo(() => {
    const fromState = state?.reportId ? getReport(state.reportId) : null;
    if (fromState) return fromState;
    if (!user) return null;
    return listReports(user.id)[0] ?? null;
  }, [state, user]);

  if (!report) return <Navigate to={user ? '/dashboard' : '/'} replace />;

  const category = categoryById(report.category);
  const anonymous = Boolean(report.anonymous);

  const downloadConfirmation = () => {
    const lines = [
      `${t('app.name')} (${t('app.prototypeTag')})`,
      t('dash.success.fileTitle'),
      '',
      `${t('dash.success.refNumber')}: ${report.refNumber}`,
      `${t('dash.success.submitted')}: ${formatDate(report.submittedAt, lang, true)}`,
      `${t('dash.review.category')}: ${t(category.labelKey)}`,
      `${t('dash.success.status')}: ${t(`status.${report.status}`)}`,
      '',
      t('dash.success.demoNote'),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.refNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-action text-actiontext rounded-md p-6 sm:p-8 text-center mb-6">
        <PageTitle>{t('dash.success.title')}</PageTitle>
        <p className="text-lg mb-1">{t('dash.success.refLabel')}</p>
        <p className="text-3xl sm:text-4xl font-bold font-mono break-all m-0">
          {report.refNumber}
        </p>
      </div>

      <Alert variant="info" title={t('common.demoData')}>
        <p className="m-0">{t('dash.success.demoNote')}</p>
      </Alert>

      {report.priority === 'emergency' && (
        <Alert variant="emergency" title={t('helpline.emergency112')}>
          <a href="tel:112" className="text-3xl font-bold underline">
            112
          </a>
        </Alert>
      )}
      {report.priority === 'immediate' && (
        <Alert variant="emergency" title={t('helpline.lostMoney')}>
          <p className="mb-1">
            <a href="tel:1930" className="text-2xl font-bold underline">
              {t('helpline.call1930')}
            </a>
          </p>
          <p className="m-0">{t('helpline.line1930Note')}</p>
        </Alert>
      )}

      {anonymous && (
        <Alert variant="warning" title={t('dash.success.anonTitle')}>
          <p className="m-0">{t('dash.success.anonSaveRef')}</p>
        </Alert>
      )}

      <h2 className="text-xl font-bold mb-2">{t('dash.success.summaryTitle')}</h2>
      <p className="text-sm text-muted mb-3">{t('dash.success.saveRefHint')}</p>
      <dl className="m-0 mb-8 border-t border-border">
        {[
          [t('dash.success.refNumber'), report.refNumber],
          [t('dash.success.submitted'), formatDate(report.submittedAt, lang, true)],
          [t('dash.review.category'), t(category.labelKey)],
          [t('dash.success.status'), t(`status.${report.status}`)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border"
          >
            <dt className="sm:w-44 shrink-0 text-muted">{label}</dt>
            <dd className="m-0 font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col sm:flex-row gap-3">
        {!anonymous && (
          <ButtonLink to={`/reports/${report.id}`}>{t('dash.success.track')}</ButtonLink>
        )}
        <Button variant={anonymous ? 'primary' : 'secondary'} onClick={downloadConfirmation}>
          {t('dash.success.downloadConfirmation')}
        </Button>
        {anonymous ? (
          <ButtonLink variant="secondary" to="/">
            {t('dash.success.backHome')}
          </ButtonLink>
        ) : (
          <ButtonLink variant="secondary" to="/dashboard">
            {t('dash.success.goToDashboard')}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
