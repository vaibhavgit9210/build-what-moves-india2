/** Demo-honest password reset: no OTP is sent, the new password is set directly. */
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { resetPassword } from '@/services/authService';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Alert, ErrorSummary, PageTitle } from '@/components/ui/Misc';
import { PasswordField, PasswordStrengthMeter } from '@/components/auth/PasswordField';

export default function ForgotPassword() {
  const { t } = useI18n();
  const [handle, setHandle] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<{ handle?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const summary = useMemo(
    () => [errors.handle, errors.password].filter((s): s is string => Boolean(s)),
    [errors],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: { handle?: string; password?: string } = {};
    if (!handle.trim()) errs.handle = t('auth.login.errHandleRequired');
    if (newPassword.length < 8) errs.password = t('errors.shortPassword');
    setErrors(errs);
    if (errs.handle || errs.password) return;
    setBusy(true);
    const res = await resetPassword(handle, newPassword);
    setBusy(false);
    if (!res.ok) {
      if (res.error === 'not-found') setErrors({ handle: t('auth.login.errNotFound') });
      else setErrors({ password: t('errors.shortPassword') });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-2xl">
        <PageTitle>{t('auth.forgot.title')}</PageTitle>
        <Alert variant="success" title={t('auth.forgot.successTitle')} role="status">
          <p>{t('auth.forgot.successBody')}</p>
        </Alert>
        <ButtonLink to="/login">{t('auth.forgot.toLogin')}</ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('auth.forgot.title')}</PageTitle>
      <p className="text-lg mb-4">{t('auth.forgot.intro')}</p>
      <Alert variant="info" title={t('common.demoData')} role="status">
        <p>{t('auth.forgot.demoNote')}</p>
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
          label={t('auth.forgot.newPasswordLabel')}
          hint={t('auth.register.passwordHint')}
          error={errors.password}
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={newPassword} />
        <Button type="submit" loading={busy} fullWidth className="sm:w-auto">
          {t('auth.forgot.submit')}
        </Button>
      </form>

      <p className="mt-8">
        <Link className="text-link underline underline-offset-4 font-medium" to="/login">
          {t('auth.forgot.backToLogin')}
        </Link>
      </p>
    </div>
  );
}
