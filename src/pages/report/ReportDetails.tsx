/**
 * /report/details — the category-specific incident form.
 *
 * Field definitions live in src/content/incidentFields.ts. Only the first
 * (non-optional) field of a category is required; number and url fields get
 * format validation. Values persist to draft.incidentDetails on blur and on
 * Continue.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import { Button } from '@/components/ui/Button';
import { TextInput, TextArea, Select } from '@/components/ui/Field';
import { PageTitle, ProgressSteps, ErrorSummary } from '@/components/ui/Misc';
import type { CategoryId } from '@/lib/types';

const THIS_PATH = '/report/details';

function isValidNumber(v: string): boolean {
  return /^\d+(\.\d+)?$/.test(v.replace(/[,\s]/g, ''));
}

function isValidUrl(v: string): boolean {
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(candidate);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

export default function ReportDetails() {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();

  const category: CategoryId = draft?.category ?? 'other';
  const fields = incidentFieldsByCategory[category];

  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...(draft?.incidentDetails ?? {}),
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);

  if (!draft) return <Navigate to="/report" replace />;

  const setValue = (id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  };

  const persist = () => {
    updateDraft({ incidentDetails: values });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const first = fields[0];
    if (first && !first.optional && !(values[first.id] ?? '').trim()) {
      errs[first.id] = t('media.details.errorRequired', { field: t(first.labelKey) });
    }
    for (const f of fields) {
      const v = (values[f.id] ?? '').trim();
      if (!v || errs[f.id]) continue;
      if (f.type === 'number' && !isValidNumber(v)) {
        errs[f.id] = t('media.details.errorNumber');
      }
      if (f.type === 'url' && !isValidUrl(v)) {
        errs[f.id] = t('media.details.errorUrl');
      }
    }
    return errs;
  };

  const onContinue = () => {
    const errs = validate();
    setFieldErrors(errs);
    setSummary(Object.values(errs));
    if (Object.keys(errs).length > 0) return;
    updateDraft({ incidentDetails: values, lastPath: '/report/evidence' });
    const next = nextPath(THIS_PATH);
    if (next) navigate(next);
  };

  const onBack = () => {
    persist();
    const prev = prevPath(THIS_PATH);
    if (prev) navigate(prev);
  };

  const renderField = (f: IncidentField) => {
    const label = f.optional
      ? `${t(f.labelKey)} (${t('common.optional')})`
      : t(f.labelKey);
    const hint = f.hintKey ? t(f.hintKey) : undefined;
    const error = fieldErrors[f.id];
    const value = values[f.id] ?? '';

    if (f.type === 'select') {
      return (
        <Select
          key={f.id}
          label={label}
          hint={hint}
          error={error}
          value={value}
          onChange={(e) => setValue(f.id, e.target.value)}
          onBlur={persist}
        >
          <option value="">{t('media.details.selectOne')}</option>
          {(f.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </Select>
      );
    }

    if (f.type === 'textarea') {
      return (
        <TextArea
          key={f.id}
          label={label}
          hint={hint}
          error={error}
          rows={4}
          value={value}
          onChange={(e) => setValue(f.id, e.target.value)}
          onBlur={persist}
        />
      );
    }

    // text / date / datetime-local / number / url — all via TextInput.
    const inputType = f.type === 'date' || f.type === 'datetime-local' ? f.type : 'text';
    const inputMode = f.type === 'number' ? ('decimal' as const) : f.type === 'url' ? ('url' as const) : undefined;
    return (
      <TextInput
        key={f.id}
        label={label}
        hint={hint}
        error={error}
        type={inputType}
        inputMode={inputMode}
        value={value}
        onChange={(e) => setValue(f.id, e.target.value)}
        onBlur={persist}
      />
    );
  };

  return (
    <div className="max-w-3xl">
      <ProgressSteps />
      <PageTitle caption={t(`categories.${category}`)}>{t('media.details.title')}</PageTitle>
      <ErrorSummary errors={summary} />

      <p className="text-lg mb-6 max-w-2xl">{t('media.details.intro')}</p>

      <div className="max-w-2xl">{fields.map(renderField)}</div>

      <div className="flex flex-wrap gap-3 mt-8">
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button onClick={onContinue}>{t('common.continue')}</Button>
      </div>
    </div>
  );
}
