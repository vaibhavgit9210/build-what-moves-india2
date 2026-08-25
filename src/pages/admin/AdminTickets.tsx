/**
 * The officer's queue. Own tickets by default; the in-charge rank can switch
 * to the whole unit. Deadlines come straight off the report model
 * (nextUpdateDue, set from the category's case plan), never a parallel clock.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAdminAuth } from '@/state/AdminAuthContext';
import { listOwnTickets, listUnitTickets, isOverdue, verificationOf } from '@/services/adminService';
import { categoryById } from '@/content/categories';
import { Card, PageTitle } from '@/components/ui/Misc';
import { VerificationTag } from '@/components/admin/VerificationTag';

export default function AdminTickets() {
  const { t, lang } = useI18n();
  const { authority } = useAdminAuth();
  const inCharge = authority?.rank === 'in-charge';
  const [scope, setScope] = useState<'own' | 'unit'>(inCharge ? 'unit' : 'own');

  const own = useMemo(() => (authority ? listOwnTickets(authority) : []), [authority]);
  const unit = useMemo(
    () => (authority && inCharge ? listUnitTickets(authority) : []),
    [authority, inCharge],
  );
  if (!authority) return null;
  const tickets = scope === 'unit' && inCharge ? unit : own;

  return (
    <div>
      <PageTitle caption={authority.unit}>
        {inCharge ? t('admin.tickets.titleInCharge') : t('admin.tickets.title')}
      </PageTitle>
      <p className="text-lg mb-6 max-w-2xl">
        {inCharge ? t('admin.tickets.introInCharge', { unit: authority.unit }) : t('admin.tickets.intro')}
      </p>

      {inCharge && (
        <fieldset className="border-0 p-0 mb-6">
          <legend className="sr-only">{t('admin.tickets.scopeLabel')}</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['own', t('admin.tickets.countOwn', { count: own.length })],
                ['unit', t('admin.tickets.countUnit', { count: unit.length })],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                onClick={() => setScope(value)}
                className={`min-h-[44px] rounded-md border-2 px-4 py-2 font-semibold cursor-pointer hc-border ${
                  scope === value ? 'border-ink bg-surface' : 'border-border bg-page hover:bg-surface'
                }`}
              >
                {value === 'own' ? t('admin.tickets.scopeOwn') : t('admin.tickets.scopeUnit')}
                <span className="block text-sm font-normal text-muted">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {tickets.length === 0 ? (
        <Card className="max-w-2xl">
          <p className="m-0">{t('admin.tickets.empty')}</p>
        </Card>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {tickets.map((r) => {
            const overdue = isOverdue(r);
            return (
              <li key={r.id}>
                <Link
                  to={`/admin/tickets/${r.id}`}
                  aria-label={t('admin.tickets.open', { ref: r.refNumber })}
                  className="block rounded-md border-2 border-border hc-border bg-page p-5 no-underline text-ink hover:bg-surface"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <span className="text-lg font-bold underline underline-offset-2 text-link">
                      {t(categoryById(r.category).labelKey)}
                    </span>
                    <VerificationTag status={verificationOf(r)} />
                  </div>
                  <p className="font-mono text-sm m-0">{r.refNumber}</p>
                  <dl className="m-0 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <dt className="text-muted inline">{t('admin.tickets.colSubmitted')}: </dt>
                      <dd className="m-0 inline font-medium">{formatDate(r.submittedAt, lang)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted inline">{t('admin.tickets.colPriority')}: </dt>
                      <dd className="m-0 inline font-medium">{t(`priority.${r.priority}`)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted inline">{t('admin.tickets.colDue')}: </dt>
                      <dd className={`m-0 inline font-medium ${overdue ? 'text-error font-bold' : ''}`}>
                        {r.nextUpdateDue
                          ? overdue
                            ? t('admin.tickets.overdue')
                            : t('admin.tickets.onTime', { date: formatDate(r.nextUpdateDue, lang) })
                          : t('admin.tickets.noDeadline')}
                      </dd>
                    </div>
                    {scope === 'unit' && (
                      <div className="sm:col-span-3">
                        <dt className="text-muted inline">{t('admin.tickets.colOfficer')}: </dt>
                        <dd className="m-0 inline font-medium">{r.officer?.name}</dd>
                      </div>
                    )}
                  </dl>
                  {r.anonymous && (
                    <span className="inline-block mt-2 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold">
                      {t('admin.tickets.anonymousChip')}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
