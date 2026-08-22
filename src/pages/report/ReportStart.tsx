/**
 * /report — public pre-journey page. Explains what will happen, shows the
 * emergency helplines, offers to resume an in-progress draft, and starts the
 * journey (via login first when signed out).
 */
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { useDraft } from '@/state/DraftContext';
import { Button } from '@/components/ui/Button';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';

const FIRST_STEP = '/report/location';

export default function ReportStart() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { draft, hasDraft, startDraft, clearDraft } = useDraft();
  const navigate = useNavigate();

  const begin = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(FIRST_STEP)}`);
      return;
    }
    startDraft();
    navigate(FIRST_STEP);
  };

  const startOver = () => {
    clearDraft();
    begin();
  };

  const stepKeys = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'] as const;

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
          <Button onClick={begin} fullWidth className="sm:w-auto">
            {t('flow.start.startButton')}
          </Button>
          {!user && <p className="text-sm text-muted mt-3">{t('flow.start.signInNote')}</p>}
        </>
      )}
    </div>
  );
}
