/**
 * "Do these things now": immediate protective actions for the classified
 * category, shown as large numbered steps before the user continues the
 * report. Emergency (112) guidance renders first when relevant.
 */
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { categoryById } from '@/content/categories';
import { guidanceByCategory } from '@/content/guidance';
import { Button } from '@/components/ui/Button';
import { Alert, PageTitle, ProgressSteps } from '@/components/ui/Misc';

const PATH = '/report/guidance';

export default function ReportGuidance() {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();

  if (!draft) return <Navigate to="/report" replace />;
  if (!draft.category) return <Navigate to="/report/questions" replace />;

  const def = categoryById(draft.category);
  const steps = guidanceByCategory[draft.category];

  const onContinue = () => {
    updateDraft({ guidanceAcknowledged: true, lastPath: '/report/description' });
    const next = nextPath(PATH);
    if (next) navigate(next);
  };

  const onBack = () => {
    const prev = prevPath(PATH);
    if (prev) navigate(prev);
  };

  return (
    <div className="max-w-2xl">
      <ProgressSteps />
      <PageTitle caption={t(def.labelKey)}>{t('tree.guidance.title')}</PageTitle>

      {draft.priority === 'emergency' && (
        <Alert variant="emergency" title={t('tree.guidance.emergencyTitle')} role="alert">
          <p className="mb-2">{t('helpline.emergency112')}</p>
          <a href="tel:112" className="inline-block text-3xl font-bold underline underline-offset-4">
            112
          </a>
        </Alert>
      )}

      <p className="text-base text-muted mb-6">{t('tree.guidance.intro')}</p>

      <ol className="list-none p-0 m-0 mb-8 flex flex-col gap-6">
        {steps.map((step, i) => (
          <li key={step.titleKey} className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-page text-lg font-bold hc-border"
            >
              {i + 1}
            </span>
            <div>
              <h2 className="text-xl font-bold leading-snug mb-1">{t(step.titleKey)}</h2>
              <p className="text-base">{t(step.bodyKey)}</p>
              {step.tel && (
                <a
                  href={`tel:${step.tel}`}
                  className="mt-2 inline-block text-3xl font-bold underline underline-offset-4"
                >
                  {step.tel}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onContinue}>{t('tree.guidance.continueBtn')}</Button>
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
}
