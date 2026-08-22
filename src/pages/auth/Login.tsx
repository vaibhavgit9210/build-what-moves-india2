/** Log in with any handle (identifier / email / mobile) + password. */
import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { DEMO_LOGIN } from '@/data/demoData';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Alert, ErrorSummary, PageTitle } from '@/components/ui/Misc';
import { PasswordField } from '@/components/auth/PasswordField';

export default function Login() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const nextRaw = params.get('next');
  const next = nextRaw || '/dashboard';

  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ handle?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const summary = useMemo(
    () => [errors.handle, errors.password].filter((s): s is string => Boolean(s)),
    [errors],
  );

  // Already signed in (or just signed in): leave this page.
  if (user) return <Navigate to={next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: { handle?: string; password?: string } = {};
    if (!handle.trim()) errs.handle = t('auth.login.errHandleRequired');
    if (!password) errs.password = t('auth.login.errPasswordRequired');
    setErrors(errs);
    if (errs.handle || errs.password) return;
    setBusy(true);
    const res = await login(handle, password);
    setBusy(false);
    if (!res.ok) {
      if (res.error === 'not-found') setErrors({ handle: t('auth.login.errNotFound') });
      else setErrors({ password: t('auth.login.errWrongPassword') });
    }
  }

  async function useDemo() {
    setErrors({});
    setHandle(DEMO_LOGIN.handle);
    setPassword(DEMO_LOGIN.password);
    setDemoBusy(true);
    await login(DEMO_LOGIN.handle, DEMO_LOGIN.password);
    setDemoBusy(false);
  }

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('auth.login.title')}</PageTitle>
      <p className="text-lg mb-6">{t('auth.login.intro')}</p>

      <Alert variant="info" title={t('auth.login.demoTitle')} role="status">
        <p className="mb-2">{t('auth.login.demoBody')}</p>
        <p className="mb-1">
          <span className="font-semibold">{t('auth.login.demoEmailLabel')}: </span>
          <code className="bg-surface px-1.5 py-0.5 rounded-sm">{DEMO_LOGIN.handle}</code>
        </p>
        <p className="mb-3">
          <span className="font-semibold">{t('auth.login.demoPasswordLabel')}: </span>
          <code className="bg-surface px-1.5 py-0.5 rounded-sm">{DEMO_LOGIN.password}</code>
        </p>
        <Button type="button" variant="secondary" loading={demoBusy} onClick={useDemo}>
          {t('auth.login.useDemo')}
        </Button>
      </Alert>

      <ErrorSummary errors={summary} />

      <form onSubmit={onSubmit} noValidate>
        <TextInput
          label={t('auth.login.handleLabel')}
          hint={t('auth.login.handleHint')}
          error={errors.handle}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="off"
        />
        <PasswordField
          label={t('auth.login.passwordLabel')}
          error={errors.password}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <Button type="submit" loading={busy} fullWidth className="sm:w-auto">
          {t('auth.login.submit')}
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-2 text-base">
        <p>
          {t('auth.login.noAccountLead')}{' '}
          <Link
            className="text-link underline underline-offset-4 font-medium"
            to={nextRaw ? `/register?next=${encodeURIComponent(nextRaw)}` : '/register'}
          >
            {t('auth.login.createAccount')}
          </Link>
        </p>
        <p>
          <Link className="text-link underline underline-offset-4 font-medium" to="/forgot">
            {t('auth.login.forgot')}
          </Link>
        </p>
      </div>
    </div>
  );
}
