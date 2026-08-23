/**
 * Decision-tree questions: one plain-language question per screen.
 * Answers persist to the draft immediately; the last question classifies
 * the incident into a suggested category + priority.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { classify, visibleQuestions } from '@/content/decisionTree';
import { categoryById } from '@/content/categories';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/Field';
import { Alert, ErrorSummary, PageTitle, ProgressSteps } from '@/components/ui/Misc';
import type { Answer, DecisionAnswers } from '@/lib/types';

const PATH = '/report/questions';

export default function ReportQuestions() {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  if (!draft) return <Navigate to="/report" replace />;

  const anonymous = draft.mode === 'anonymous';
  const answers = draft.answers;
  const vis = visibleQuestions(answers);
  const i = Math.max(0, Math.min(idx, vis.length - 1));
  const question = vis[i];
  const value = answers[question.id];

  const options = [
    { value: 'yes', label: t('common.yes') },
    { value: 'no', label: t('common.no') },
    { value: 'unsure', label: t('common.notSure') },
  ];

  const select = (v: string) => {
    setError(undefined);
    updateDraft({ answers: { ...answers, [question.id]: v as Answer } });
  };

  const onContinue = () => {
    if (!value) {
      setError(t('tree.questions.selectAnswer'));
      return;
    }
    setError(undefined);
    if (i < vis.length - 1) {
      setIdx(i + 1);
      return;
    }
    // Keep only answers to questions that are actually visible with the
    // current answers, so stale answers to hidden questions (given, then
    // orphaned by going back and changing an earlier answer) do not corrupt
    // classification or linger in the submitted report.
    const pruned: DecisionAnswers = {};
    for (const q of vis) {
      const v = answers[q.id];
      if (v) pruned[q.id] = v;
    }
    const result = classify(pruned);
    // When the user has explicitly overridden the category, keep both the
    // category and its own priority; only a "someone is in danger" answer
    // raises it to emergency.
    const overriddenCategory = draft.categoryOverridden ? draft.category : undefined;
    updateDraft({
      answers: pruned,
      ...(overriddenCategory ? {} : { category: result.category }),
      priority: overriddenCategory
        ? pruned.danger === 'yes'
          ? 'emergency'
          : categoryById(overriddenCategory).defaultPriority
        : result.priority,
      lastPath: '/report/category',
    });
    const next = nextPath(PATH);
    if (next) navigate(next);
  };

  const onBack = () => {
    setError(undefined);
    if (i > 0) {
      setIdx(i - 1);
      return;
    }
    const prev = prevPath(PATH, anonymous);
    if (prev) navigate(prev);
  };

  const onSkip = () => {
    setError(undefined);
    updateDraft({ triageSkipped: true, lastPath: '/report/category' });
    navigate('/report/category');
  };

  return (
    <div className="max-w-2xl">
      <ProgressSteps />
      <PageTitle>{t('steps.incident')}</PageTitle>
      <p className="text-base text-muted mb-5">{t('tree.questions.intro')}</p>

      {answers.danger === 'yes' && (
        <Alert variant="emergency" title={t('tree.questions.emergencyTitle')} role="alert">
          <p className="mb-2">{t('helpline.emergency112')}</p>
          <a href="tel:112" className="inline-block text-3xl font-bold underline underline-offset-4">
            112
          </a>
        </Alert>
      )}

      <ErrorSummary errors={error ? [error] : []} />

      <p aria-live="polite" className="text-sm font-semibold text-muted mb-2">
        {t('tree.questions.progress', {
          n: i + 1,
          m: vis.length,
        })}
      </p>

      <RadioGroup
        big
        legend={t(question.textKey)}
        hint={question.hintKey ? t(question.hintKey) : undefined}
        error={error}
        options={options}
        value={value}
        onChange={select}
        name={`q-${question.id}`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={onContinue}>{t('common.continue')}</Button>
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
      </div>

      {i === 0 && (
        <p className="mt-6">
          <button
            type="button"
            onClick={onSkip}
            className="text-link underline underline-offset-2 font-medium cursor-pointer"
          >
            {t('tree.questions.skipLink')}
          </button>
        </p>
      )}
    </div>
  );
}
