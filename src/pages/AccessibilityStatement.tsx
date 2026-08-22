/** Accessibility statement: the header controls, design commitments, honest prototype limitations. */
import { useI18n } from '@/i18n';
import { PageTitle } from '@/components/ui/Misc';

const COMMITMENTS = ['keyboard', 'screenReader', 'focus', 'plain', 'hindi', 'touch'] as const;
const CONTROLS = ['textSize', 'contrast', 'motion'] as const;
const LIMITATIONS = ['l1', 'l2', 'l3', 'l4'] as const;

export default function AccessibilityStatement() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('publicPages.a11yPage.title')}</PageTitle>
      <p className="text-lg mb-8">{t('publicPages.a11yPage.intro')}</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.a11yPage.controls.title')}</h2>
        <p className="mb-3">{t('publicPages.a11yPage.controls.body')}</p>
        <ul className="list-disc pl-6 space-y-2">
          {CONTROLS.map((c) => (
            <li key={c} className="text-base">
              {t(`publicPages.a11yPage.controls.${c}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.a11yPage.commitments.title')}</h2>
        <ul className="list-disc pl-6 space-y-2">
          {COMMITMENTS.map((c) => (
            <li key={c} className="text-base">
              {t(`publicPages.a11yPage.commitments.${c}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('publicPages.a11yPage.limitations.title')}</h2>
        <p className="mb-3">{t('publicPages.a11yPage.limitations.body')}</p>
        <ul className="list-disc pl-6 space-y-2">
          {LIMITATIONS.map((l) => (
            <li key={l} className="text-base">
              {t(`publicPages.a11yPage.limitations.${l}`)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
