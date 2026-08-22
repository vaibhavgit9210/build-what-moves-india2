/** Three-step registration wizard: id method → details → password + contact. */
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { INDIAN_STATES } from '@/services/geoService';
import type { IdMethod } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { RadioGroup, Select, TextInput } from '@/components/ui/Field';
import { Alert, ErrorSummary, PageTitle } from '@/components/ui/Misc';
import { PasswordField, PasswordStrengthMeter } from '@/components/auth/PasswordField';

const ID_METHODS: IdMethod[] = [
  'aadhaar',
  'pan',
  'passport',
  'driving-licence',
  'voter-id',
  'ration-card',
  'other-gov-id',
  'email',
  'mobile',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidMobile = (s: string) => /^\d{10}$/.test(s.replace(/\D/g, ''));

type Errors = Partial<Record<'method' | 'name' | 'identifier' | 'password' | 'email' | 'mobile' | 'top', string>>;

export default function Register() {
  const { t } = useI18n();
  const { user, register } = useAuth();
  const [params] = useSearchParams();
  const nextRaw = params.get('next');
  const next = nextRaw || '/dashboard';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<IdMethod | undefined>(undefined);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const stepHeadingRef = useRef<HTMLSpanElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [step]);

  const summary = useMemo(
    () =>
      [errors.top, errors.method, errors.name, errors.identifier, errors.password, errors.email, errors.mobile].filter(
        (s): s is string => Boolean(s),
      ),
    [errors],
  );

  // Already signed in (or just registered): leave this page.
  if (user) return <Navigate to={next} replace />;

  const methodLabel = method ? t(`docTypes.${method}`) : '';

  function goTo(s: 1 | 2 | 3) {
    setErrors({});
    setStep(s);
  }

  function continueStep1(e: FormEvent) {
    e.preventDefault();
    if (!method) {
      setErrors({ method: t('auth.register.errMethod') });
      return;
    }
    goTo(2);
  }

  function continueStep2(e: FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (!name.trim()) errs.name = t('auth.register.errName');
    const idVal = identifier.trim();
    if (!idVal) errs.identifier = t('auth.register.errIdentifier', { method: methodLabel });
    else if (method === 'email' && !EMAIL_RE.test(idVal)) errs.identifier = t('errors.invalidEmail');
    else if (method === 'mobile' && !isValidMobile(idVal)) errs.identifier = t('errors.invalidMobile');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // Prefill the matching contact field so the user does not type it twice.
    if (method === 'email' && !email) setEmail(idVal);
    if (method === 'mobile' && !mobile) setMobile(idVal);
    goTo(3);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (password.length < 8) errs.password = t('errors.shortPassword');
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

    setBusy(true);
    const res = await register({
      name: name.trim(),
      idMethod: method as IdMethod,
      identifier: identifier.trim(),
      email: em || undefined,
      mobile: mo || undefined,
      password,
      state: stateVal || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setErrors({ top: res.error === 'handle-taken' ? t('auth.register.errHandleTaken') : t('common.error') });
    }
    // On success the `user` guard above redirects.
  }

  const identifierLabel =
    method === 'email' || method === 'mobile' ? methodLabel : t('auth.register.idNumberLabel', { method: methodLabel });

  return (
    <div className="max-w-2xl">
      <PageTitle caption={t('steps.stepOf', { current: step, total: 3 })}>{t('auth.register.title')}</PageTitle>

      <ErrorSummary errors={summary} />
      {errors.top && (
        <p className="mb-6">
          {t('auth.register.haveAccountLead')}{' '}
          <Link className="text-link underline underline-offset-4 font-medium" to="/login">
            {t('auth.register.loginLink')}
          </Link>
        </p>
      )}

      {step === 1 && (
        <form onSubmit={continueStep1} noValidate>
          <RadioGroup
            legend={
              <span ref={stepHeadingRef} tabIndex={-1}>
                {t('auth.register.step1Legend')}
              </span>
            }
            hint={t('auth.register.step1Hint')}
            error={errors.method}
            options={ID_METHODS.map((m) => ({ value: m, label: t(`docTypes.${m}`) }))}
            value={method}
            onChange={(v) => setMethod(v as IdMethod)}
            big
          />
          <Alert variant="info" title={t('common.demoData')} role="status">
            <p>{t('auth.register.notValidated')}</p>
          </Alert>
          <Button type="submit" fullWidth className="sm:w-auto">
            {t('common.continue')}
          </Button>
          <p className="mt-8">
            {t('auth.register.haveAccountLead')}{' '}
            <Link className="text-link underline underline-offset-4 font-medium" to="/login">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={continueStep2} noValidate>
          <h2 className="text-2xl font-bold mb-4">
            <span ref={stepHeadingRef} tabIndex={-1}>
              {t('auth.register.step2Title')}
            </span>
          </h2>
          <TextInput
            label={t('auth.register.nameLabel')}
            error={errors.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <TextInput
            label={identifierLabel}
            hint={method ? t(`auth.register.idHints.${method}`) : undefined}
            error={errors.identifier}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type={method === 'email' ? 'email' : method === 'mobile' ? 'tel' : 'text'}
            inputMode={method === 'mobile' ? 'numeric' : undefined}
            spellCheck={false}
            autoCapitalize="off"
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
            <Button type="button" variant="secondary" onClick={() => goTo(1)}>
              {t('common.back')}
            </Button>
            <Button type="submit">{t('common.continue')}</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={submit} noValidate>
          <h2 className="text-2xl font-bold mb-4">
            <span ref={stepHeadingRef} tabIndex={-1}>
              {t('auth.register.step3Title')}
            </span>
          </h2>
          <PasswordField
            label={t('auth.register.passwordLabel')}
            hint={t('auth.register.passwordHint')}
            error={errors.password}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />

          <h3 className="text-xl font-bold mb-1">{t('auth.register.contactTitle')}</h3>
          <p className="text-sm text-muted mb-4">{t('auth.register.contactHint')}</p>
          <TextInput
            label={t('auth.register.emailLabel')}
            hint={t('auth.register.idHints.email')}
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
            hint={t('auth.register.idHints.mobile')}
            error={errors.mobile}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button type="button" variant="secondary" onClick={() => goTo(2)}>
              {t('common.back')}
            </Button>
            <Button type="submit" loading={busy}>
              {t('auth.register.createButton')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
