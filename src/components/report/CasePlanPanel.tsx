/**
 * The clarity packet: after a report is registered (and on every detail /
 * track view) the reporter sees, in plain bullets, exactly what their problem
 * is in law, what happens next on what clock, who is accountable, how they
 * will hear from us, how to track, how to escalate, and how the case can end.
 *
 * Content is generated statically from casePlans.ts (authoritative, no
 * hallucination); an optional "Explain this in simple words" button asks the
 * AI (free gpt-oss via the worker) to REPHRASE those same facts, grounded by
 * a use-only-these-facts instruction, and is clearly labeled.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { casePlanFor, ESCALATION_MATRIX } from '@/content/casePlans';
import { categoryById } from '@/content/categories';
import { aiBrief } from '@/services/intakeService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Misc';
import type { Report } from '@/lib/types';

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="text-base font-bold mb-1.5 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-action text-actiontext text-xs font-bold"
        >
          {n}
        </span>
        {title}
      </h3>
      <div className="pl-8 text-[0.95rem]">{children}</div>
    </section>
  );
}

export default function CasePlanPanel({ report }: { report: Report }) {
  const { t, lang } = useI18n();
  const [brief, setBrief] = useState<string | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const [briefFailed, setBriefFailed] = useState(false);

  const plan = casePlanFor(report.category);
  const category = categoryById(report.category);
  const t0 = report.submittedAt;
  const at = (hours: number) =>
    formatDate(new Date(new Date(t0).getTime() + hours * 3600_000).toISOString(), lang, true);
  const resolveBy = formatDate(
    new Date(new Date(t0).getTime() + plan.resolveDays * 86400_000).toISOString(),
    lang,
  );

  /** The exact facts, flattened, for the grounded AI rephrase. */
  const factsForAi = () =>
    [
      `${t('plan.sections.what')}: ${t(category.labelKey)}. ${plan.statutes.map((s) => `${s.ref}: ${t(s.gistKey)}`).join(' ')}`,
      `${t('plan.sections.next')}: ${t('plan.stages.assigned', { hours: plan.ackHours })}; ${t('plan.stages.contact', { hours: plan.firstContactHours })}; ${t('plan.stages.updates', { days: plan.updateEveryDays })}; ${t('plan.stages.resolve', { days: plan.resolveDays, date: resolveBy })}`,
      ...plan.specialKeys.map((k) => t(k)),
      `${t('plan.sections.who')}: ${report.officer ? `${report.officer.name}, ${t(report.officer.rankKey)}, ${report.officer.unit}` : t(plan.ownerKey)}`,
      `${t('plan.sections.track')}: ${report.refNumber}`,
      `${t('plan.sections.escalate')}: ${ESCALATION_MATRIX.map((l) => `${l.level}. ${t(l.roleKey)}`).join('; ')}`,
      `${t('plan.sections.outcomes')}: ${plan.outcomeKeys.map((k) => t(k)).join(' ')}`,
      `${t('plan.sections.guilty')}: ${t(plan.guiltyKey)}`,
    ].join('\n');

  const askBrief = async () => {
    setBriefBusy(true);
    setBriefFailed(false);
    try {
      setBrief(await aiBrief(factsForAi(), lang));
    } catch {
      setBriefFailed(true);
    } finally {
      setBriefBusy(false);
    }
  };

  return (
    <Card className="mb-5 max-w-2xl border-action">
      <h2 className="text-xl font-bold mb-1">{t('plan.title')}</h2>
      <p className="text-sm text-muted mt-0 mb-4">{t('plan.intro')}</p>

      <Section n={1} title={t('plan.sections.what')}>
        <p className="m-0 mb-1 font-medium">{t(category.labelKey)}</p>
        <ul className="list-disc pl-5 m-0">
          {plan.statutes.map((s) => (
            <li key={s.ref}>
              <span className="font-semibold">{s.ref}</span>: {t(s.gistKey)}
            </li>
          ))}
        </ul>
      </Section>

      <Section n={2} title={t('plan.sections.next')}>
        <ul className="list-disc pl-5 m-0">
          <li>{t('plan.stages.registered', { date: formatDate(t0, lang, true) })}</li>
          <li>{t('plan.stages.assigned', { hours: plan.ackHours })} ({at(plan.ackHours)})</li>
          <li>{t('plan.stages.contact', { hours: plan.firstContactHours })} ({at(plan.firstContactHours)})</li>
          <li>{t('plan.stages.updates', { days: plan.updateEveryDays })}</li>
          <li>{t('plan.stages.resolve', { days: plan.resolveDays, date: resolveBy })}</li>
          {plan.specialKeys.map((k) => (
            <li key={k} className="font-medium">{t(k)}</li>
          ))}
        </ul>
      </Section>

      <Section n={3} title={t('plan.sections.who')}>
        {report.officer ? (
          <p className="m-0">
            <span className="font-semibold">{report.officer.name}</span>, {t(report.officer.rankKey)}
            <br />
            {report.officer.unit} · {report.officer.phoneMasked}
          </p>
        ) : (
          <p className="m-0">{t(plan.ownerKey)}</p>
        )}
        <p className="text-sm text-muted mt-1 mb-0">{t('plan.ownerNote')}</p>
      </Section>

      <Section n={4} title={t('plan.sections.hear')}>
        <p className="m-0">{t('plan.hearBody', { days: plan.updateEveryDays })}</p>
      </Section>

      <Section n={5} title={t('plan.sections.track')}>
        <p className="m-0">
          {t('plan.trackBody')}{' '}
          <Link to="/track" className="text-link underline underline-offset-2 font-medium">
            {t('nav.track')}
          </Link>
          {' '}· <span className="font-mono font-semibold">{report.refNumber}</span>
        </p>
      </Section>

      <Section n={6} title={t('plan.sections.escalate')}>
        <p className="mt-0 mb-2">{t('plan.matrixIntro')}</p>
        <ol className="list-none p-0 m-0 flex flex-col gap-1.5">
          {ESCALATION_MATRIX.map((l) => (
            <li key={l.level} className="flex gap-2.5 items-baseline">
              <span className="font-mono text-xs font-bold text-muted shrink-0">L{l.level}</span>
              <span>
                <span className="font-semibold">{t(l.roleKey)}</span>: {t(l.descKey)}
              </span>
            </li>
          ))}
        </ol>
        {!report.anonymous ? (
          <p className="text-sm text-muted mt-2 mb-0">{t('plan.matrixL5Note')}</p>
        ) : (
          <p className="text-sm text-muted mt-2 mb-0">{t('plan.matrixAnonNote')}</p>
        )}
      </Section>

      <Section n={7} title={t('plan.sections.outcomes')}>
        <ul className="list-disc pl-5 m-0">
          {plan.outcomeKeys.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </Section>

      <Section n={8} title={t('plan.sections.guilty')}>
        <p className="m-0">{t(plan.guiltyKey)}</p>
      </Section>

      <div className="mt-5 pt-4 border-t border-border">
        {brief ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
              {t('plan.aiBriefTag')}
            </p>
            <p className="m-0 bg-surface rounded-md p-3 whitespace-pre-wrap">{brief}</p>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={() => void askBrief()} loading={briefBusy}>
              {t('plan.aiBriefBtn')}
            </Button>
            {briefFailed && <p className="text-sm text-muted mt-2 mb-0">{t('plan.aiBriefFailed')}</p>}
          </>
        )}
      </div>
    </Card>
  );
}
