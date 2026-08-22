/** Signed-in user's profile: view details, edit everything except the identifier. */
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { formatDate, useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { updateUser } from '@/services/authService';
import { INDIAN_STATES } from '@/services/geoService';
import { Button } from '@/components/ui/Button';
import { Select, TextInput } from '@/components/ui/Field';
import { Alert, Card, ErrorSummary, PageTitle } from '@/components/ui/Misc';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidMobile = (s: string) => /^\d{10}$/.test(s.replace(/\D/g, ''));

/** Show only the tail of an identifier; synthetic values are already masked. */
function maskIdentifier(v: string): string {
  if (v.includes('X')) return v;
  const at = v.indexOf('@');
  if (at > 0) return `${v.slice(0, Math.min(2, at))}XXXX${v.slice(at)}`;
  if (v.length <= 4) return v;
  return `${'X'.repeat(v.length - 4)}${v.slice(-4)}`;
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="py-3 border-b border-border last:border-b-0 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="font-semibold">{label}</dt>
      <dd className="m-0">{value}</dd>
    </div>
  );
}

export default function Profile() {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; mobile?: string }>({});
  const [saved, setSaved] = useState(false);

  const summary = useMemo(
    () => [errors.name, errors.email, errors.mobile].filter((s): s is string => Boolean(s)),
    [errors],
  );

  if (!user) return <Navigate to="/login" replace />;

  const notProvided = <span className="text-muted">{t('auth.profile.notProvided')}</span>;

  function startEdit() {
    if (!user) return;
    setName(user.name);
    setEmail(user.email ?? '');
    setMobile(user.mobile ?? '');
    setStateVal(user.state ?? '');
    setErrors({});
    setSaved(false);
    setEditing(true);
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const errs: { name?: string; email?: string; mobile?: string } = {};
    if (!name.trim()) errs.name = t('auth.register.errName');
    const em = email.trim();
    const mo = mobile.trim();
    if (!em && !mo) {
      errs.email = t('auth.register.errContact');
    } else {
      if (em && !EMAIL_RE.test(em)) errs.email = t('errors.invalidEmail');
      if (mo && !isValidMobile(mo)) errs.mobile = t('errors.invalidMobile');
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    updateUser({
      ...user,
      name: name.trim(),
      email: em || undefined,
      mobile: mo || undefined,
      state: stateVal || undefined,
    });
    refresh();
    setEditing(false);
    setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <PageTitle caption={t('nav.account')}>{t('auth.profile.title')}</PageTitle>
      <p className="text-lg mb-6">{t('auth.profile.intro')}</p>

      {saved && (
        <Alert variant="success" role="status">
          <p>{t('auth.profile.saved')}</p>
        </Alert>
      )}

      {!editing && (
        <>
          <Card>
            <dl className="m-0">
              <Row label={t('auth.register.nameLabel')} value={user.name} />
              <Row label={t('auth.profile.idTypeLabel')} value={t(`docTypes.${user.idMethod}`)} />
              <Row
                label={t('auth.profile.identifierLabel')}
                value={
                  <>
                    <span>{maskIdentifier(user.identifier)}</span>
                    <span className="block text-sm text-muted mt-1">{t('auth.profile.identifierLocked')}</span>
                  </>
                }
              />
              <Row label={t('auth.register.emailLabel')} value={user.email ?? notProvided} />
              <Row label={t('auth.register.mobileLabel')} value={user.mobile ?? notProvided} />
              <Row label={t('auth.register.stateLabel')} value={user.state ?? notProvided} />
              <Row label={t('auth.profile.memberSince')} value={formatDate(user.createdAt, lang)} />
            </dl>
          </Card>
          <div className="mt-5">
            <Button type="button" variant="secondary" onClick={startEdit}>
              {t('common.edit')}
            </Button>
          </div>
        </>
      )}

      {editing && (
        <form onSubmit={onSave} noValidate>
          <h2 className="text-2xl font-bold mb-4">{t('auth.profile.editHeading')}</h2>
          <ErrorSummary errors={summary} />
          <TextInput
            label={t('auth.register.nameLabel')}
            error={errors.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <TextInput
            label={t('auth.profile.identifierLabel')}
            hint={t('auth.profile.identifierLocked')}
            value={maskIdentifier(user.identifier)}
            readOnly
            disabled
          />
          <TextInput
            label={t('auth.register.emailLabel')}
            error={errors.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="off"
          />
          <TextInput
            label={t('auth.register.mobileLabel')}
            error={errors.mobile}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
          />
          <Select
            label={
              <>
                {t('auth.register.stateLabel')}{' '}
                <span className="font-normal text-muted">({t('common.optional')})</span>
              </>
            }
            value={stateVal}
            onChange={(e) => setStateVal(e.target.value)}
          >
            <option value="">{t('auth.register.statePlaceholder')}</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
