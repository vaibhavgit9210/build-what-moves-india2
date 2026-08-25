/**
 * The FIR preparation pack: an A4 print view laid out on the standard Indian
 * FIR proforma, updated for the BNS 2023 regime.
 *
 * Everything factual is assembled from the case record and casePlans.ts. The
 * model contributes exactly two things, the officer checklist and the plain
 * language brief facts, and it is never sent reporter PII. When it is not
 * reachable the canned checklist and the reporter's own words are shown
 * instead, labeled as such.
 *
 * Output is the browser's own print dialog (Save as PDF), keeping the app
 * dependency free and entirely client side, like everything else here.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAdminAuth } from '@/state/AdminAuthContext';
import { getReport } from '@/services/reportService';
import { getUsers } from '@/services/authService';
import { canOpen, grantedRequest, logFirGenerated, verificationOf } from '@/services/adminService';
import { buildFirPayload, requestFirPrep, type FirPack } from '@/services/firPrepService';
import { casePlanFor } from '@/content/casePlans';
import { categoryById } from '@/content/categories';
import { Button } from '@/components/ui/Button';
import { Alert, PageTitle, Spinner } from '@/components/ui/Misc';

const CANNED_CHECKLIST = [
  'admin.fir.canned.cognizable',
  'admin.fir.canned.jurisdiction',
  'admin.fir.canned.evidence',
  'admin.fir.canned.zeroFir',
  'admin.fir.canned.enquiry',
  'admin.fir.canned.sections',
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-border last:border-b-0">
      <dt className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</dt>
      <dd className="m-0 font-medium break-words">{value}</dd>
    </div>
  );
}

export default function AdminFirPrep() {
  const { t, lang } = useI18n();
  const { authority } = useAdminAuth();
  const { id } = useParams<'id'>();

  const report = id ? getReport(id) : null;
  const [pack, setPack] = useState<FirPack | null>(null);
  const [busy, setBusy] = useState(false);

  const reporter = report?.userId ? getUsers().find((u) => u.id === report.userId) ?? null : null;

  useEffect(() => {
    if (report && authority) logFirGenerated(report.id, authority);
    // Logged once per visit to the pack, not once per model call.
  }, [report?.id, authority?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!report || !authority || !canOpen(authority, report)) {
    return (
      <div className="max-w-2xl">
        <PageTitle>{t('dash.detail.notFound')}</PageTitle>
        <Link to="/admin/tickets" className="text-link underline underline-offset-2 font-medium">
          {t('admin.backToTickets')}
        </Link>
      </div>
    );
  }

  if (verificationOf(report) !== 'verified') {
    return (
      <div className="max-w-2xl">
        <PageTitle>{t('admin.fir.lockedTitle')}</PageTitle>
        <p className="text-lg mb-6">{t('admin.fir.locked')}</p>
        <Link
          to={`/admin/tickets/${report.id}`}
          className="text-link underline underline-offset-2 font-medium"
        >
          {t('admin.backToTickets')}
        </Link>
      </div>
    );
  }

  const plan = casePlanFor(report.category);
  const category = categoryById(report.category);
  const granted = grantedRequest(report, authority.id);
  const payload = buildFirPayload(report, t, lang);
  const addr = report.location?.address;
  const year = new Date(report.submittedAt).getFullYear();
  const blank = t('admin.fir.header.blank');

  const generate = async () => {
    setBusy(true);
    try {
      setPack(await requestFirPrep(payload, lang));
    } finally {
      setBusy(false);
    }
  };

  const checklist =
    pack?.checklist ?? CANNED_CHECKLIST.map((k) => t(k));
  const briefFacts = pack?.briefFacts ?? report.description?.text ?? t('admin.fir.noneRecorded');

  return (
    <div>
      <div className="no-print">
        <Link
          to={`/admin/tickets/${report.id}`}
          className="inline-block mb-4 text-link underline underline-offset-2 font-medium"
        >
          {t('admin.backToTickets')}
        </Link>
        <PageTitle caption={<span className="font-mono">{report.refNumber}</span>}>
          {t('admin.fir.title')}
        </PageTitle>
        <p className="text-lg mb-4 max-w-2xl">{t('admin.fir.intro')}</p>
        <Alert variant="warning" title={t('common.demoData')}>
          <p className="m-0">{t('admin.fir.notLegal')}</p>
        </Alert>
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={() => void generate()} loading={busy}>
            {pack ? t('admin.fir.regenerate') : t('admin.fir.generate')}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            {t('admin.fir.print')}
          </Button>
        </div>
        {busy && <Spinner label={t('admin.fir.generating')} />}
        {pack && (
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-4">
            {pack.provider === 'live' ? t('admin.fir.aiTag') : t('admin.fir.demoTag')}
          </p>
        )}
      </div>

      {/* The pack itself. Printed on its own, without any app chrome. */}
      <article className="max-w-3xl border-2 border-ink rounded-md p-6 print:border-0 print:p-0">
        <header className="border-b-2 border-ink pb-3 mb-4">
          <h2 className="text-xl font-bold m-0">{t('admin.fir.header.title')}</h2>
          <p className="text-sm text-muted m-0 mt-1">{t('admin.fir.header.lawNote')}</p>
        </header>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 m-0 mb-5">
          <Field label={t('admin.fir.header.firNo')} value={blank} />
          <Field label={t('admin.fir.header.year')} value={year} />
          <Field label={t('admin.fir.header.district')} value={addr?.district || blank} />
          <Field label={t('admin.fir.header.station')} value={blank} />
          <Field label={t('admin.fir.sections.gd')} value={blank} />
          <Field label={t('admin.fir.sections.gdDate')} value={blank} />
          <Field
            label={t('admin.fir.sections.typeOfInfo')}
            value={t('admin.fir.sections.typeOfInfoValue')}
          />
          <Field label={t('admin.fir.sections.refNumber')} value={<span className="font-mono">{report.refNumber}</span>} />
          <Field
            label={t('admin.fir.sections.occurrence')}
            value={
              payload.dates.length > 0 ? payload.dates.join(' · ') : t('admin.fir.noneRecorded')
            }
          />
          <Field
            label={t('admin.fir.sections.filed')}
            value={formatDate(report.submittedAt, lang, true)}
          />
          <Field label={t('admin.fir.sections.category')} value={t(category.labelKey)} />
          <Field label={t('admin.fir.sections.place')} value={payload.place || t('admin.fir.noneRecorded')} />
        </dl>

        <section className="mb-5">
          <h3 className="text-base font-bold mb-1">{t('admin.fir.sections.acts')}</h3>
          <ul className="list-disc pl-5 m-0">
            {plan.statutes.map((s) => (
              <li key={s.ref}>
                <span className="font-semibold">{s.ref}</span>: {t(s.gistKey)}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-5">
          <h3 className="text-base font-bold mb-1">{t('admin.fir.sections.complainant')}</h3>
          {report.anonymous ? (
            <p className="m-0">{t('admin.fir.complainantAnonymous')}</p>
          ) : granted ? (
            <>
              <dl className="m-0 mb-2">
                <Field
                  label={t('admin.pii.fields.name')}
                  value={report.identity?.name || reporter?.name || t('admin.fir.noneRecorded')}
                />
                <Field
                  label={t('admin.pii.fields.docType')}
                  value={
                    report.identity
                      ? `${t(`docTypes.${report.identity.docType}`)} · ${report.identity.idNumber}`
                      : t('admin.fir.noneRecorded')
                  }
                />
                <Field
                  label={t('admin.pii.fields.mobile')}
                  value={reporter?.mobile || t('admin.fir.noneRecorded')}
                />
                <Field
                  label={t('admin.pii.fields.email')}
                  value={reporter?.email || t('admin.fir.noneRecorded')}
                />
                <Field
                  label={t('admin.pii.fields.address')}
                  value={
                    addr
                      ? [addr.house, addr.street, addr.locality, addr.city, addr.pin]
                          .filter(Boolean)
                          .join(', ')
                      : t('admin.fir.noneRecorded')
                  }
                />
              </dl>
              <p className="text-sm text-muted m-0">
                {t('admin.fir.complainantGranted', {
                  date: formatDate(granted.decidedAt ?? granted.requestedAt, lang, true),
                })}
              </p>
            </>
          ) : (
            <p className="m-0">{t('admin.fir.complainantMasked')}</p>
          )}
        </section>

        <section className="mb-5">
          <h3 className="text-base font-bold mb-1">{t('admin.fir.sections.facts')}</h3>
          <p className="m-0 whitespace-pre-wrap">{briefFacts}</p>
          {payload.details.length > 0 && (
            <ul className="list-disc pl-5 mt-2 mb-0">
              {payload.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-5">
          <h3 className="text-base font-bold mb-1">{t('admin.fir.sections.property')}</h3>
          {payload.financial.length === 0 ? (
            <p className="m-0">{t('admin.fir.noneRecorded')}</p>
          ) : (
            <ul className="list-disc pl-5 m-0">
              {payload.financial.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-5">
          <h3 className="text-base font-bold mb-1">{t('admin.fir.sections.evidence')}</h3>
          {payload.evidence.length === 0 ? (
            <p className="m-0">{t('admin.fir.noneRecorded')}</p>
          ) : (
            <ol className="list-decimal pl-5 m-0">
              {payload.evidence.map((e) => (
                <li key={e} className="break-words">
                  {e}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mb-5">
          <h3 className="text-base font-bold mb-1">{t('admin.fir.checklistTitle')}</h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {checklist.map((c) => (
              <li key={c} className="flex gap-2.5 items-baseline">
                <span aria-hidden="true" className="shrink-0 font-mono text-muted">
                  [ ]
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t-2 border-ink pt-3 text-sm text-muted">
          <p className="m-0">
            {t('admin.fir.printedOn', {
              date: formatDate(new Date().toISOString(), lang, true),
              officer: authority.name,
            })}
          </p>
          <p className="m-0 mt-1">{t('admin.fir.footer')}</p>
        </footer>
      </article>
    </div>
  );
}
