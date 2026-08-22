/** Privacy page: what the prototype stores, where, and how to erase it. Honest about being a demo. */
import { useI18n } from '@/i18n';
import { Alert, PageTitle } from '@/components/ui/Misc';

const COLLECT_ITEMS = ['itemLocation', 'itemIdentity', 'itemIncident', 'itemEvidence', 'itemTechnical'] as const;

export default function Privacy() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('publicPages.privacy.title')}</PageTitle>
      <p className="text-lg mb-6">{t('publicPages.privacy.intro')}</p>

      <Alert variant="info" title={t('publicPages.privacy.notGov.title')}>
        <p>{t('publicPages.privacy.notGov.body')}</p>
      </Alert>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.privacy.collect.title')}</h2>
        <ul className="list-disc pl-6 space-y-2">
          {COLLECT_ITEMS.map((item) => (
            <li key={item} className="text-base">
              {t(`publicPages.privacy.collect.${item}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.privacy.storage.title')}</h2>
        <p>{t('publicPages.privacy.storage.body')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.privacy.docs.title')}</h2>
        <p>{t('publicPages.privacy.docs.body')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.privacy.synthetic.title')}</h2>
        <p>{t('publicPages.privacy.synthetic.body')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.privacy.erase.title')}</h2>
        <p>{t('publicPages.privacy.erase.body')}</p>
      </section>
    </div>
  );
}
