/**
 * /report — public pre-journey page. Explains what will happen, shows the
 * emergency helplines, offers to resume an in-progress draft, and starts the
 * journey. The user chooses here between reporting anonymously (no account,
 * no tracking) and registering to track, with the tradeoff spelled out in
 * plain language before anything is asked of them.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { useDraft } from '@/state/DraftContext';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/Field';
import { Alert, Card, ErrorSummary, PageTitle } from '@/components/ui/Misc';
import type { ReportMode } from '@/lib/types';

const FIRST_STEP = '/report/location';

export default function ReportStart() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { draft, hasDraft, startDraft, updateDraft, clearDraft } = useDraft();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ReportMode | ''>('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [showCompare, setShowCompare] = useState(false);

  const begin = () => {
    if (!mode) {
      setError(t('flow.start.modeError'));
      return;
    }
    setError(undefined);
    if (mode === 'tracked' && !user) {
      // Remember the choice so the draft survives the sign-in detour.
      startDraft();
      updateDraft({ mode });
      navigate(`/login?next=${encodeURIComponent(FIRST_STEP)}`);
      return;
    }
    startDraft();
    updateDraft({ mode, lastPath: FIRST_STEP });
    navigate(FIRST_STEP);
  };

  const startOver = () => {
    clearDraft();
    setMode('');
  };

  const stepKeys = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'] as const;
  const anonPoints = ['anonPoint1', 'anonPoint2', 'anonPoint3', 'anonPoint4'] as const;
  const trackPoints = ['trackPoint1', 'trackPoint2', 'trackPoint3'] as const;

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('flow.start.title')}</PageTitle>

      <Alert variant="emergency">
        <p className="mb-2">
          <span className="font-bold">{t('helpline.lostMoney')}</span>{' '}
          <a href="tel:1930" className="text-2xl font-bold text-link whitespace-nowrap">
            {t('helpline.call1930')}
          </a>
        </p>
        <p className="text-sm mb-2">{t('helpline.line1930Note')}</p>
        <p>
          <a href="tel:112" className="font-bold text-link">
            {t('helpline.emergency112')}
          </a>
        </p>
      </Alert>

      {hasDraft && draft && (
        <Card className="mb-6 bg-infobg">
          <h2 className="text-xl font-bold mb-1">{t('resume.title')}</h2>
          <p className="mb-4">{t('resume.body')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate(draft.lastPath || FIRST_STEP)}>
              {t('resume.continue')}
            </Button>
            <Button variant="secondary" onClick={startOver}>
              {t('resume.startOver')}
            </Button>
          </div>
        </Card>
      )}

      <p className="text-lg mb-6">{t('flow.start.lead')}</p>

      <h2 className="text-2xl font-bold mb-3">{t('flow.start.whatHeading')}</h2>
      <ol className="list-decimal pl-6 mb-6 space-y-2 text-base">
        {stepKeys.map((k) => (
          <li key={k}>{t(`flow.start.${k}`)}</li>
        ))}
      </ol>

      <p className="mb-2 font-semibold">{t('flow.start.timeNote')}</p>
      <p className="text-muted mb-6">{t('flow.start.autosaveNote')}</p>

      {!hasDraft && (
        <>
          <ErrorSummary errors={error ? [error] : []} />

          <RadioGroup
            big
            legend={t('flow.start.modeLegend')}
            hint={t('flow.start.modeHint')}
            error={error}
            options={[
              {
                value: 'tracked',
                label: t('flow.start.modeTracked'),
                hint: t('flow.start.modeTrackedHint'),
              },
              {
                value: 'anonymous',
                label: t('flow.start.modeAnonymous'),
                hint: t('flow.start.modeAnonymousHint'),
              },
            ]}
            value={mode}
            onChange={(v) => {
              setMode(v as ReportMode);
              setError(undefined);
            }}
            name="report-mode"
          />

          <p className="mb-4">
            <button
              type="button"
              className="text-link underline underline-offset-2 font-medium cursor-pointer"
              aria-expanded={showCompare}
              onClick={() => setShowCompare((s) => !s)}
            >
              {t('flow.start.compareToggle')}
            </button>
          </p>
          {showCompare && (
            <Card className="mb-6 bg-surface">
              <h3 className="text-lg font-bold mb-2">{t('flow.start.modeAnonymous')}</h3>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                {anonPoints.map((k) => (
                  <li key={k}>{t(`flow.start.${k}`)}</li>
                ))}
              </ul>
              <h3 className="text-lg font-bold mb-2">{t('flow.start.modeTracked')}</h3>
              <ul className="list-disc pl-5 mb-0 space-y-1">
                {trackPoints.map((k) => (
                  <li key={k}>{t(`flow.start.${k}`)}</li>
                ))}
              </ul>
            </Card>
          )}

          <Button onClick={begin} fullWidth className="sm:w-auto">
            {t('flow.start.startButton')}
          </Button>
          {!user && mode === 'tracked' && (
            <p className="text-sm text-muted mt-3">{t('flow.start.signInNote')}</p>
          )}
        </>
      )}
    </div>
  );
}
