/** Signed-in home: stats, recent reports and latest status updates. */
import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { listReports } from '@/services/reportService';
import { categoryById } from '@/content/categories';
import { ButtonLink } from '@/components/ui/Button';
import { Card, PageTitle } from '@/components/ui/Misc';
import { StatusTag } from '@/components/dash/StatusTimeline';

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const reports = useMemo(() => (user ? listReports(user.id) : []), [user]);
  const updates = useMemo(
    () =>
      reports
        .flatMap((r) => r.timeline.map((e) => ({ report: r, event: e })))
        .sort((a, b) => b.event.at.localeCompare(a.event.at))
        .slice(0, 5),
    [reports],
  );

  if (!user) return <Navigate to="/login" replace />;

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const open = reports.filter((r) => r.status !== 'resolved').length;
  const resolved = reports.length - open;

  return (
    <div>
      <PageTitle>{t('dash.dashboard.greeting', { name: firstName })}</PageTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mb-6">
        {[
          [t('nav.myReports'), reports.length],
          [t('dash.dashboard.statOpen'), open],
          [t('status.resolved'), resolved],
        ].map(([label, count]) => (
          <Card key={String(label)}>
            <p className="text-3xl font-bold m-0">{count}</p>
            <p className="text-muted m-0">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <ButtonLink to="/report" fullWidth className="sm:w-auto">
          {t('dash.dashboard.startNew')}
        </ButtonLink>
      </div>

      {reports.length === 0 ? (
        <Card className="max-w-2xl">
          <h2 className="text-xl font-bold mb-2">{t('dash.dashboard.emptyTitle')}</h2>
          <p className="text-muted mb-0">{t('dash.dashboard.emptyBody')}</p>
        </Card>
      ) : (
        <>
          <section aria-labelledby="recent-reports" className="mb-8">
            <h2 id="recent-reports" className="text-2xl font-bold mb-3">
              {t('dash.dashboard.recent')}
            </h2>
            <ul className="list-none p-0 m-0 flex flex-col gap-3 max-w-2xl">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/reports/${r.id}`}
                    className="block rounded-md border-2 border-border hc-border bg-page p-5 no-underline text-ink hover:bg-surface"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <span className="text-lg font-bold underline underline-offset-2 text-link">
                        {t(categoryById(r.category).labelKey)}
                      </span>
                      <StatusTag status={r.status} />
                    </div>
                    <p className="font-mono text-sm m-0">{r.refNumber}</p>
                    <p className="text-sm text-muted m-0">
                      {t('dash.dashboard.submittedOn', {
                        date: formatDate(r.submittedAt, lang),
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="updates" aria-labelledby="updates-heading" className="mb-8">
            <h2 id="updates-heading" className="text-2xl font-bold mb-3">
              {t('dash.dashboard.updates')}
            </h2>
            {updates.length === 0 ? (
              <p className="text-muted max-w-2xl">{t('dash.dashboard.noUpdates')}</p>
            ) : (
              <ul className="list-none p-0 m-0 max-w-2xl">
                {updates.map(({ report, event }) => (
                  <li
                    key={`${report.id}-${event.status}`}
                    className="border-b border-border py-2.5"
                  >
                    <Link
                      to={`/reports/${report.id}`}
                      className="text-link underline underline-offset-2 font-medium"
                    >
                      {t(categoryById(report.category).labelKey)}: {t(`status.${event.status}`)}
                    </Link>
                    <span className="block text-sm text-muted">
                      {formatDate(event.at, lang, true)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
