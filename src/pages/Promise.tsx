/**
 * The public service promise: the lifecycle every report follows, the
 * deadlines each stage carries, the escalation matrix when a deadline is
 * missed, and the first-aid basics (1930 / 112 / 1098) kept front and
 * centre. This page exists so accountability is a published contract, not a
 * hope: it is what "Under process" is replaced with.
 */
import { useI18n } from '@/i18n';
import { ESCALATION_MATRIX, casePlanByCategory } from '@/content/casePlans';
import { CATEGORIES } from '@/content/categories';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';

export default function Promise() {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      <PageTitle caption={t('promise.caption')}>{t('promise.title')}</PageTitle>
      <p className="text-lg max-w-2xl mb-6">{t('promise.intro')}</p>

      <Alert variant="emergency" title={t('promise.firstAidTitle')}>
        <ul className="list-none p-0 m-0 space-y-1">
          <li>
            <a href="tel:1930" className="font-bold text-xl underline">1930</a> {t('promise.firstAid1930')}
          </li>
          <li>
            <a href="tel:112" className="font-bold text-xl underline">112</a> {t('promise.firstAid112')}
          </li>
          <li>
            <a href="tel:1098" className="font-bold text-xl underline">1098</a> {t('promise.firstAid1098')}
          </li>
        </ul>
      </Alert>

      <h2 className="text-2xl font-bold mb-3">{t('promise.lifecycleTitle')}</h2>
      <p className="max-w-2xl mb-4">{t('promise.lifecycleIntro')}</p>
      <ol className="list-none p-0 m-0 mb-8 max-w-2xl">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <li key={n} className="flex gap-3 pb-4 last:pb-0 relative">
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-actiontext text-sm font-bold z-10"
            >
              {n}
            </span>
            <div className="pt-0.5">
              <p className="m-0 font-bold">{t(`promise.stage${n}Title`)}</p>
              <p className="m-0 text-muted">{t(`promise.stage${n}Body`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="text-2xl font-bold mb-3">{t('promise.matrixTitle')}</h2>
      <p className="max-w-2xl mb-4">{t('promise.matrixIntro')}</p>
      <Card className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse text-[0.95rem]">
          <thead>
            <tr className="text-left border-b-2 border-border">
              <th className="py-2 pr-3">{t('promise.matrixColLevel')}</th>
              <th className="py-2 pr-3">{t('promise.matrixColWho')}</th>
              <th className="py-2">{t('promise.matrixColWhen')}</th>
            </tr>
          </thead>
          <tbody>
            {ESCALATION_MATRIX.map((l) => (
              <tr key={l.level} className="border-b border-border last:border-b-0 align-top">
                <td className="py-2 pr-3 font-mono font-bold">L{l.level}</td>
                <td className="py-2 pr-3 font-semibold">{t(l.roleKey)}</td>
                <td className="py-2">{t(l.descKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="text-2xl font-bold mb-3">{t('promise.slaTitle')}</h2>
      <p className="max-w-2xl mb-4">{t('promise.slaIntro')}</p>
      <Card className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b-2 border-border">
              <th className="py-2 pr-3">{t('promise.slaColCategory')}</th>
              <th className="py-2 pr-3">{t('promise.slaColContact')}</th>
              <th className="py-2 pr-3">{t('promise.slaColUpdate')}</th>
              <th className="py-2">{t('promise.slaColResolve')}</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => {
              const p = casePlanByCategory[c.id];
              return (
                <tr key={c.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="py-2 pr-3 font-medium">{t(c.labelKey)}</td>
                  <td className="py-2 pr-3">{t('promise.slaHours', { hours: p.firstContactHours })}</td>
                  <td className="py-2 pr-3">{t('promise.slaDays', { days: p.updateEveryDays })}</td>
                  <td className="py-2">{t('promise.slaDays', { days: p.resolveDays })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Alert variant="info" title={t('promise.endsTitle')}>
        <p className="m-0">{t('promise.endsBody')}</p>
      </Alert>

      <p className="text-sm text-muted max-w-2xl">{t('promise.demoNote')}</p>
    </div>
  );
}
