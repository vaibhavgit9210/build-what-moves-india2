/**
 * Suggested-category confirmation. Shows what we think the report is about,
 * with a one-line description and an explicit "you can change this" escape
 * hatch that reveals the full category list. When the user skipped the
 * questions ("I already know the category"), this page starts in browse
 * mode instead and asks them to pick from the full list.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { CATEGORIES, categoryById } from '@/content/categories';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/Field';
import { Alert, Card, ErrorSummary, PageTitle, ProgressSteps } from '@/components/ui/Misc';
import type { CategoryId } from '@/lib/types';

const PATH = '/report/category';

export default function ReportCategory() {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [showLegal, setShowLegal] = useState(false);
  // Skipped the questions: browse the full list. Sticky for the visit so the
  // list does not collapse the moment a category is picked.
  const [browsing] = useState(() => !draft?.category && Boolean(draft?.triageSkipped));

  if (!draft) return <Navigate to="/report" replace />;
  if (!draft.category && !draft.triageSkipped)
    return <Navigate to="/report/questions" replace />;

  const def = draft.category ? categoryById(draft.category) : null;

  const pickCategory = (v: string) => {
    const chosen = categoryById(v as CategoryId);
    setError(undefined);
    updateDraft({
      category: chosen.id,
      categoryOverridden: true,
      // A "someone is in danger" answer always keeps emergency priority.
      priority: draft.answers.danger === 'yes' ? 'emergency' : chosen.defaultPriority,
    });
  };

  const onContinue = () => {
    if (!draft.category) {
      setError(t('tree.category.chooseError'));
      return;
    }
    updateDraft({ lastPath: '/report/guidance' });
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
      {browsing ? (
        <PageTitle>{t('tree.category.chooseTitle')}</PageTitle>
      ) : (
        <PageTitle
          caption={
            draft.categoryOverridden ? t('tree.category.captionChosen') : t('tree.category.caption')
          }
        >
          {def ? t(def.labelKey) : ''}
        </PageTitle>
      )}

      <ErrorSummary errors={error ? [error] : []} />

      {browsing ? (
        <p className="text-base text-muted mb-6">{t('tree.category.chooseHint')}</p>
      ) : (
        <>
          <p className="text-lg mb-4">{def ? t(def.descKey) : ''}</p>
          <p className="text-base text-muted mb-6">{t('tree.category.reassure')}</p>
        </>
      )}

      {def?.sensitive && (
        <Alert variant="info" title={t('tree.category.sensitiveTitle')} role="alert">
          <p className="mb-2">{t('tree.category.sensitiveBody')}</p>
          <p>
            {t('tree.category.sensitiveChildline')}{' '}
            <a href="tel:1098" className="text-2xl font-bold underline underline-offset-4">
              1098
            </a>
          </p>
        </Alert>
      )}

      {def && (
        <div className="mb-6">
          <button
            type="button"
            className="text-link underline underline-offset-2 font-medium cursor-pointer"
            aria-expanded={showLegal}
            onClick={() => setShowLegal((s) => !s)}
          >
            {t('tree.category.legalToggle')}
          </button>
          {showLegal && (
            <Card className="mt-3 bg-surface">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted mb-2">
                {t('tree.category.legalNote')}
              </p>
              <p className="mb-0">{t(def.legalKey)}</p>
            </Card>
          )}
        </div>
      )}

      {(changing || browsing) && (
        <RadioGroup
          legend={t('tree.category.pickLegend')}
          hint={t('tree.category.pickHint')}
          error={error}
          options={CATEGORIES.map((c) => ({
            value: c.id,
            label: t(c.labelKey),
            hint: t(c.descKey),
          }))}
          value={draft.category ?? ''}
          onChange={pickCategory}
          name="category-pick"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={onContinue}>{t('common.continue')}</Button>
        {!changing && !browsing && (
          <Button variant="secondary" onClick={() => setChanging(true)} aria-expanded={changing}>
            {t('tree.category.changeBtn')}
          </Button>
        )}
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
      </div>

      {browsing && (
        <p className="mt-6">
          <button
            type="button"
            onClick={() => {
              updateDraft({ triageSkipped: false, lastPath: '/report/questions' });
              navigate('/report/questions');
            }}
            className="text-link underline underline-offset-2 font-medium cursor-pointer"
          >
            {t('tree.category.answerInstead')}
          </button>
        </p>
      )}
    </div>
  );
}
