/** Account settings: change password, accessibility pointer, clear demo data. */
import { useMemo, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { hashPassword, updateUser } from '@/services/authService';
import { clearAll } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Alert, Card, ErrorSummary, Modal, PageTitle } from '@/components/ui/Misc';
import { PasswordField, PasswordStrengthMeter } from '@/components/auth/PasswordField';

export default function Settings() {
  const { t } = useI18n();
  const { user, refresh } = useAuth();

  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<{ current?: string; newPassword?: string }>({});
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const summary = useMemo(
    () => [errors.current, errors.newPassword].filter((s): s is string => Boolean(s)),
    [errors],
  );

  if (!user) return <Navigate to="/login" replace />;

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setChanged(false);
    const errs: { current?: string; newPassword?: string } = {};
    if (!current) errs.current = t('auth.settings.errCurrentRequired');
    if (newPassword.length < 8) errs.newPassword = t('errors.shortPassword');
    setErrors(errs);
    if (errs.current || errs.newPassword) return;
    setBusy(true);
    const currentHash = await hashPassword(current);
    if (currentHash !== user.passwordHash) {
      setBusy(false);
      setErrors({ current: t('auth.settings.errWrongCurrent') });
      return;
    }
    updateUser({ ...user, passwordHash: await hashPassword(newPassword) });
    refresh();
    setBusy(false);
    setCurrent('');
    setNewPassword('');
    setChanged(true);
  }

  return (
    <div className="max-w-2xl">
      <PageTitle caption={t('nav.account')}>{t('auth.settings.title')}</PageTitle>

      <section className="mb-10" aria-labelledby="pw-heading">
        <h2 id="pw-heading" className="text-2xl font-bold mb-4">
          {t('auth.settings.pwHeading')}
        </h2>
        {changed && (
          <Alert variant="success" role="status">
            <p>{t('auth.settings.pwChanged')}</p>
          </Alert>
        )}
        <ErrorSummary errors={summary} />
        <form onSubmit={onChangePassword} noValidate>
          <PasswordField
            label={t('auth.settings.currentLabel')}
            error={errors.current}
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <PasswordField
            label={t('auth.settings.newLabel')}
            hint={t('auth.register.passwordHint')}
            error={errors.newPassword}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={newPassword} />
          <Button type="submit" loading={busy}>
            {t('auth.settings.changeButton')}
          </Button>
        </form>
      </section>

      <section className="mb-10" aria-labelledby="a11y-heading">
        <h2 id="a11y-heading" className="text-2xl font-bold mb-2">
          {t('auth.settings.a11yHeading')}
        </h2>
        <p className="max-w-2xl">{t('auth.settings.a11yBody')}</p>
      </section>

      <section aria-labelledby="demo-heading">
        <h2 id="demo-heading" className="text-2xl font-bold mb-4">
          {t('auth.settings.demoHeading')}
        </h2>
        <Card>
          <p className="mb-4">{t('auth.settings.demoBody')}</p>
          <Button type="button" variant="warning" onClick={() => setModalOpen(true)}>
            {t('auth.settings.clearButton')}
          </Button>
        </Card>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('auth.settings.modalTitle')}>
        <p className="mb-5">{t('auth.settings.modalBody')}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="warning"
            onClick={() => {
              clearAll();
              window.location.reload();
            }}
          >
            {t('auth.settings.confirmClear')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
