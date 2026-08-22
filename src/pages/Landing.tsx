/** Landing page: the front door. One clear action, calm emergency info, resume prompt. */
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';

export default function Landing() {
  const { t } = useI18n();
  const { draft, hasDraft, clearDraft } = useDraft();
  const navigate = useNavigate();

  const resumePath = draft?.lastPath || '/report/location';

  return (
    <div className="max-w-3xl">
      <PageTitle>{t('publicPages.landing.heroTitle')}</PageTitle>
      <p className="text-lg sm:text-xl text-ink max-w-2xl mb-6">{t('publicPages.landing.heroSubtitle')}</p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-10">
        <ButtonLink to="/report" className="text-lg px-8">
          {t('publicPages.landing.startReport')}
        </ButtonLink>
        <ButtonLink to="/track" variant="secondary">
          {t('publicPages.landing.trackReport')}
        </ButtonLink>
        <ButtonLink to="/help" variant="secondary">
          {t('publicPages.landing.getHelp')}
        </ButtonLink>
      </div>

      {hasDraft && draft && (
        <Card className="mb-10 border-l-8 border-l-saffron max-w-2xl">
          <h2 className="text-xl font-bold mb-1">{t('resume.title')}</h2>
          <p className="mb-4">{t('resume.body')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <ButtonLink to={resumePath}>{t('resume.continue')}</ButtonLink>
            <Button
              variant="secondary"
              onClick={() => {
                clearDraft();
                navigate('/report');
              }}
            >
              {t('resume.startOver')}
            </Button>
          </div>
        </Card>
      )}

      <Alert variant="emergency" title={t('helpline.lostMoney')}>
        <p className="mb-1">
          <a href="tel:1930" className="text-4xl sm:text-5xl font-bold tracking-wide text-ink">
            1930
          </a>
        </p>
        <p className="font-bold mb-1">{t('helpline.call1930')}</p>
        <p>{t('helpline.line1930Note')}</p>
      </Alert>

      <section aria-labelledby="how-title" className="mt-10 mb-10">
        <h2 id="how-title" className="text-2xl font-bold mb-5">
          {t('publicPages.landing.how.title')}
        </h2>
        <ol className="list-none p-0 m-0 space-y-5 max-w-2xl">
          {(['s1', 's2', 's3'] as const).map((s, i) => (
            <li key={s} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brandtext text-lg font-bold"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold">{t(`publicPages.landing.how.${s}Title`)}</h3>
                <p className="text-muted">{t(`publicPages.landing.how.${s}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="trust-title" className="border-t-2 border-border pt-6">
        <h2 id="trust-title" className="sr-only">
          {t('publicPages.landing.trust.heading')}
        </h2>
        <ul className="list-none p-0 m-0 flex flex-col sm:flex-row gap-3 sm:gap-8 text-muted">
          <li>{t('publicPages.landing.trust.lang')}</li>
          <li>{t('publicPages.landing.trust.phone')}</li>
          <li>{t('publicPages.landing.trust.local')}</li>
        </ul>
      </section>
    </div>
  );
}
