/**
 * Password input with an accessible show/hide toggle, plus the 0–4 segment
 * strength meter used by register / forgot / settings. The toggle is a real
 * button with visible text and aria-pressed — never an icon alone.
 */
import { useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { TextInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { passwordStrength } from '@/services/authService';

export function PasswordField({
  label,
  hint,
  error,
  value,
  onChange,
  autoComplete,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div>
      <TextInput
        label={label}
        hint={hint}
        error={error}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        autoCapitalize="off"
      />
      <div className="-mt-4 mb-5">
        <Button type="button" variant="plain" aria-pressed={show} onClick={() => setShow((s) => !s)}>
          {show ? t('auth.password.hide') : t('auth.password.show')}
        </Button>
      </div>
    </div>
  );
}

/** Visual 4-segment meter + text label (never colour alone). */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useI18n();
  if (!password) return null;
  const score = passwordStrength(password);
  const fill = score <= 1 ? 'bg-error' : score === 2 ? 'bg-warn' : 'bg-success';
  return (
    <div className="-mt-2 mb-5 max-w-xl">
      <div className="flex gap-1.5 mb-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-sm border border-border hc-border ${i < score ? fill : 'bg-surface'}`}
          />
        ))}
      </div>
      <p className="text-sm font-medium" aria-live="polite">
        {t('auth.password.strength', { label: t(`auth.password.s${score}`) })}
      </p>
    </div>
  );
}
