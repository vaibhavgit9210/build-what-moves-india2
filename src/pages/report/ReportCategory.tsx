/**
 * Suggested-category confirmation. Shows what we think the report is about,
 * with a one-line description and an explicit "you can change this" escape
 * hatch that reveals the full category list.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { CATEGORIES, categoryById } from '@/content/categories';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/Field';
import { Alert, PageTitle, ProgressSteps } from '@/components/ui/Misc';
import type { CategoryId } from '@/lib/types';

const PATH = '/report/category';

export default function ReportCategory() {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();
  const [changing, setChanging] = useState(false);

  if (!draft) return <Navigate to="/report" replace />;
  if (!draft.category) return <Navigate to="/report/questions" replace />;

  const def = categoryById(draft.category);

  const pickCategory = (v: string) => {
    const chosen = categoryById(v as CategoryId);
    updateDraft({
      category: chosen.id,
      categoryOverridden: true,
      // A "someone is in danger" answer always keeps emergency priority.
      priority: draft.answers.danger === 'yes' ? 'emergency' : chosen.defaultPriority,
    });
  };

  const onContinue = () => {
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
      <PageTitle
        caption={draft.categoryOverridden ? t('tree.category.captionChosen') : t('tree.category.caption')}
      >
        {t(def.labelKey)}
      </PageTitle>

      <p className="text-lg mb-4">{t(def.descKey)}</p>
      <p className="text-base text-muted mb-6">{t('tree.category.reassure')}</p>

      {def.sensitive && (
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

      {changing && (
        <RadioGroup
          legend={t('tree.category.pickLegend')}
          hint={t('tree.category.pickHint')}
          options={CATEGORIES.map((c) => ({
            value: c.id,
            label: t(c.labelKey),
            hint: t(c.descKey),
          }))}
          value={draft.category}
          onChange={pickCategory}
          name="category-pick"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={onContinue}>{t('common.continue')}</Button>
        {!changing && (
          <Button variant="secondary" onClick={() => setChanging(true)} aria-expanded={changing}>
            {t('tree.category.changeBtn')}
          </Button>
        )}
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
}
