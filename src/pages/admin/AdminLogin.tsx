/** Badge-id sign in for the authority portal. The whole demo roster is on the
 * page, the same way the citizen login prints its demo credentials. */
import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAdminAuth } from '@/state/AdminAuthContext';
import {
  AUTHORITY_ROSTER,
  DEMO_AUTHORITY_PASSWORD,
  rankKeyOf,
} from '@/content/authorityRoster';
import { getAllReports } from '@/services/reportService';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { PasswordField } from '@/components/auth/PasswordField';
import { Alert, Card, ErrorSummary, PageTitle } from '@/components/ui/Misc';

export default function AdminLogin() {
  const { t } = useI18n();
  const { authority, login } = useAdminAuth();
  const [params] = useSearchParams();

  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ badge?: string; password?: string }>({});

  // Ticket counts make it obvious which demo account has something to show.
  // An in-charge sees their whole unit, so that is what their count reflects.
  const counts = useMemo(() => {
    const reports = getAllReports();
    const unitOf = new Map(AUTHORITY_ROSTER.map((a) => [a.id, a.unit]));
    return new Map(
      AUTHORITY_ROSTER.map((a) => [
        a.id,
        reports.filter((r) =>
          a.rank === 'in-charge'
            ? unitOf.get(r.officer?.id ?? '') === a.unit
            : r.officer?.id === a.id,
        ).length,
      ]),
    );
  }, []);

  const summary = useMemo(
    () => [errors.badge, errors.password].filter((s): s is string => Boolean(s)),
    [errors],
  );

  if (authority) return <Navigate to={params.get('next') || '/admin/tickets'} replace />;

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: { badge?: string; password?: string } = {};
    if (!badge.trim()) errs.badge = t('admin.login.errBadgeRequired');
    if (!password) errs.password = t('admin.login.errPasswordRequired');
    setErrors(errs);
    if (errs.badge || errs.password) return;
    const res = login(badge, password);
    if (!res.ok) {
      if (res.error === 'not-found') setErrors({ badge: t('admin.login.errNotFound') });
      else setErrors({ password: t('admin.login.errWrongPassword') });
    }
  }

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('admin.login.title')}</PageTitle>
      <p className="text-lg mb-6">{t('admin.login.intro')}</p>

      <Alert variant="info" title={t('admin.login.demoTitle')} role="status">
        <p className="mb-2">{t('admin.login.demoBody')}</p>
        <p className="mb-3">
          <span className="font-semibold">{t('admin.login.passwordLabel')}: </span>
          <code className="bg-surface px-1.5 py-0.5 rounded-sm">{DEMO_AUTHORITY_PASSWORD}</code>
        </p>
      </Alert>

      <ul className="list-none p-0 m-0 mb-8 flex flex-col gap-2">
        {AUTHORITY_ROSTER.map((a) => (
          <li key={a.id}>
            <Card className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="m-0 font-bold">{a.name}</p>
                <p className="m-0 text-sm text-muted">
                  <code className="bg-surface px-1.5 py-0.5 rounded-sm">{a.badgeId}</code> ·{' '}
                  {t(rankKeyOf(a))} · {a.unit}
                </p>
                <p className="m-0 text-sm text-muted">
                  {t('admin.login.ticketsChip', { count: counts.get(a.id) ?? 0 })}
                </p>
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => login(a.badgeId, DEMO_AUTHORITY_PASSWORD)}
              >
                {t('admin.login.use')}
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      <ErrorSummary errors={summary} />

      <form onSubmit={submit} noValidate>
        <TextInput
          label={t('admin.login.badgeLabel')}
          hint={t('admin.login.badgeHint')}
          error={errors.badge}
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="characters"
        />
        <PasswordField
          label={t('admin.login.passwordLabel')}
          error={errors.password}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <Button type="submit" fullWidth className="sm:w-auto">
          {t('admin.login.submit')}
        </Button>
      </form>

      <p className="mt-8">
        {t('admin.login.citizenNote')}{' '}
        <Link to="/" className="text-link underline underline-offset-4 font-medium">
          {t('admin.backToCitizen')}
        </Link>
      </p>
    </div>
  );
}
