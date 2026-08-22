/** Help centre: emergency numbers up top, six situations as an accessible accordion. */
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { ButtonLink } from '@/components/ui/Button';
import { Alert, PageTitle } from '@/components/ui/Misc';

const TOPICS: { id: string; steps: number }[] = [
  { id: 'money', steps: 4 },
  { id: 'hacked', steps: 4 },
  { id: 'threats', steps: 4 },
  { id: 'link', steps: 4 },
  { id: 'impersonation', steps: 4 },
  { id: 'scamCall', steps: 3 },
];

export default function Help() {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>('money');

  return (
    <div className="max-w-3xl">
      <PageTitle>{t('publicPages.help.title')}</PageTitle>

      <Alert variant="emergency" title={t('publicPages.help.emergencyTitle')}>
        <p className="mb-2">
          <span className="font-bold">{t('helpline.lostMoney')}</span> {t('helpline.call1930')}
        </p>
        <p className="mb-3">
          <a href="tel:1930" className="text-3xl sm:text-4xl font-bold tracking-wide text-ink">
            1930
          </a>
        </p>
        <p className="mb-2">{t('helpline.line1930Note')}</p>
        <p className="mb-2">{t('helpline.emergency112')}</p>
        <p>
          <a href="tel:112" className="text-3xl sm:text-4xl font-bold tracking-wide text-ink">
            112
          </a>
        </p>
      </Alert>

      <p className="text-lg max-w-2xl mb-6">{t('publicPages.help.intro')}</p>

      <h2 className="text-2xl font-bold mb-4">{t('publicPages.help.topicsHeading')}</h2>

      <div className="border-t-2 border-border max-w-2xl">
        {TOPICS.map(({ id, steps }) => {
          const expanded = open === id;
          return (
            <div key={id} className="border-b-2 border-border">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`help-panel-${id}`}
                  id={`help-button-${id}`}
                  onClick={() => setOpen(expanded ? null : id)}
                  className="w-full min-h-[44px] flex items-center justify-between gap-4 py-4 px-1 text-left text-lg font-bold cursor-pointer hover:bg-surface"
                >
                  <span>{t(`publicPages.help.topics.${id}.title`)}</span>
                  <span aria-hidden="true" className="text-2xl leading-none text-link">
                    {expanded ? '−' : '+'}
                  </span>
                </button>
              </h3>
              {expanded && (
                <div
                  id={`help-panel-${id}`}
                  role="region"
                  aria-labelledby={`help-button-${id}`}
                  className="px-1 pb-5"
                >
                  <ol className="list-decimal pl-6 space-y-2 mb-5">
                    {Array.from({ length: steps }, (_, i) => (
                      <li key={i} className="text-base">
                        {t(`publicPages.help.topics.${id}.s${i + 1}`)}
                      </li>
                    ))}
                  </ol>
                  <ButtonLink to="/report">{t('publicPages.help.startReport')}</ButtonLink>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
