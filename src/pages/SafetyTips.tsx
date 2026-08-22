/** Safety tips: prevention guidance in five calm, scannable groups. */
import { useI18n } from '@/i18n';
import { Card, PageTitle } from '@/components/ui/Misc';

const GROUPS: { id: string; tips: number }[] = [
  { id: 'otp', tips: 5 },
  { id: 'upi', tips: 5 },
  { id: 'phishing', tips: 4 },
  { id: 'social', tips: 5 },
  { id: 'device', tips: 5 },
];

export default function SafetyTips() {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      <PageTitle>{t('publicPages.safety.title')}</PageTitle>
      <p className="text-lg max-w-2xl mb-8">{t('publicPages.safety.intro')}</p>

      <div className="space-y-6 max-w-2xl">
        {GROUPS.map(({ id, tips }) => (
          <Card key={id}>
            <h2 className="text-xl font-bold mb-3">{t(`publicPages.safety.${id}.title`)}</h2>
            <ul className="list-disc pl-6 space-y-2">
              {Array.from({ length: tips }, (_, i) => (
                <li key={i} className="text-base">
                  {t(`publicPages.safety.${id}.t${i + 1}`)}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
