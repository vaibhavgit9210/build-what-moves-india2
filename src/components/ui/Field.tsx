/**
 * Form primitives. Each control wires its own label / hint / error with
 * proper ids and aria-describedby, so pages never hand-roll accessibility.
 */
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useI18n } from '@/i18n';

interface FieldChrome {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
}

function useFieldIds(error?: string, hint?: ReactNode) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return { id, hintId, errId, describedBy };
}

function Chrome({
  id, hintId, errId, label, hint, error, children,
}: FieldChrome & { id: string; hintId?: string; errId?: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={`mb-5 ${error ? 'border-l-4 border-error pl-3' : ''}`}>
      <label htmlFor={id} className="block text-base font-semibold mb-1">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-muted mb-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-sm font-semibold text-error mb-1">
          <span className="sr-only">{t('errors.prefix')}</span>
          {error}
        </p>
      )}
      {children}
    </div>
  );
}

const CONTROL =
  'block w-full max-w-xl rounded-sm border-2 border-ink/60 bg-page px-3 py-2.5 text-base min-h-[44px] hc-border ' +
  'aria-[invalid=true]:border-error';

export function TextInput({ label, hint, error, className = '', ...rest }: FieldChrome & InputHTMLAttributes<HTMLInputElement>) {
  const { id, hintId, errId, describedBy } = useFieldIds(error, hint);
  return (
    <Chrome id={id} hintId={hintId} errId={errId} label={label} hint={hint} error={error}>
      <input id={id} aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={`${CONTROL} ${className}`} {...rest} />
    </Chrome>
  );
}

export function TextArea({ label, hint, error, className = '', ...rest }: FieldChrome & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, hintId, errId, describedBy } = useFieldIds(error, hint);
  return (
    <Chrome id={id} hintId={hintId} errId={errId} label={label} hint={hint} error={error}>
      <textarea id={id} rows={5} aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={`${CONTROL} max-w-2xl ${className}`} {...rest} />
    </Chrome>
  );
}

export function Select({
  label, hint, error, children, className = '', ...rest
}: FieldChrome & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { id, hintId, errId, describedBy } = useFieldIds(error, hint);
  return (
    <Chrome id={id} hintId={hintId} errId={errId} label={label} hint={hint} error={error}>
      <select id={id} aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={`${CONTROL} ${className}`} {...rest}>
        {children}
      </select>
    </Chrome>
  );
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
}

/** Large-tap-target radio group (fieldset + native radios). */
export function RadioGroup({
  legend, hint, error, options, value, onChange, name, big,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: RadioOption[];
  value: string | undefined;
  onChange: (v: string) => void;
  name?: string;
  /** Bigger cards for one-question-per-screen flows. */
  big?: boolean;
}) {
  const { t } = useI18n();
  const auto = useId();
  const groupName = name ?? auto;
  const errId = error ? `${auto}-err` : undefined;
  const hintId = hint ? `${auto}-hint` : undefined;
  return (
    <fieldset
      className={`mb-5 border-0 p-0 ${error ? 'border-l-4 border-error pl-3' : ''}`}
      aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
    >
      <legend className={`font-semibold ${big ? 'text-xl mb-3' : 'text-base mb-2'}`}>{legend}</legend>
      {hint && <p id={hintId} className="text-sm text-muted mb-2">{hint}</p>}
      {error && (
        <p id={errId} className="text-sm font-semibold text-error mb-2">
          <span className="sr-only">{t('errors.prefix')}</span>
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 max-w-xl">
        {options.map((opt) => {
          const id = `${auto}-${opt.value}`;
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={`flex items-start gap-3 rounded-md border-2 cursor-pointer hc-border ${big ? 'p-4' : 'p-3'} ${
                checked ? 'border-ink bg-surface' : 'border-border bg-page hover:bg-surface'
              }`}
            >
              <input
                type="radio"
                id={id}
                name={groupName}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--tok-action)]"
              />
              <span>
                <span className={`block font-medium ${big ? 'text-lg' : 'text-base'}`}>{opt.label}</span>
                {opt.hint && <span className="block text-sm text-muted mt-0.5">{opt.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Checkbox({
  label, checked, onChange, error, hint,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  hint?: ReactNode;
}) {
  const { t } = useI18n();
  const id = useId();
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={`mb-5 ${error ? 'border-l-4 border-error pl-3' : ''}`}>
      {error && (
        <p id={errId} className="text-sm font-semibold text-error mb-1">
          <span className="sr-only">{t('errors.prefix')}</span>
          {error}
        </p>
      )}
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer max-w-2xl">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={errId}
          className="mt-1 h-6 w-6 shrink-0 accent-[var(--tok-action)]"
        />
        <span>
          <span className="text-base">{label}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
        </span>
      </label>
    </div>
  );
}
