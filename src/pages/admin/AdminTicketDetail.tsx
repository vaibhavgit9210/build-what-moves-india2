/**
 * One ticket, from the officer's side: the case as evidence (always visible),
 * the reporter as a person (masked until they release it), the workflow
 * actions, and the activity log that makes the gate accountable.
 *
 * The demo controls that fake the backend live on the REPORTER's page. Every
 * action here is a real prototype workflow action, which is why they are not
 * mixed together.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useI18n, formatDate } from '@/i18n';
import { useAdminAuth } from '@/state/AdminAuthContext';
import { getReport } from '@/services/reportService';
import { getUsers } from '@/services/authService';
import {
  addManualUpdate,
  canOpen,
  grantedRequest,
  hasPii,
  isOverdue,
  maskPii,
  pendingPiiRequest,
  reassignTicket,
  requestPii,
  setVerification,
  verificationOf,
} from '@/services/adminService';
import { AUTHORITY_ROSTER } from '@/content/authorityRoster';
import { categoryById } from '@/content/categories';
import { platformLabelKey } from '@/content/platforms';
import { humanize, incidentFieldById } from '@/lib/incidentDisplay';
import type { AuditEntry, VerificationStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { RadioGroup, Select, TextArea } from '@/components/ui/Field';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';
import { StatusTag } from '@/components/dash/StatusTimeline';
import { VerificationTag } from '@/components/admin/VerificationTag';

const VERIFICATION_OPTIONS: VerificationStatus[] = [
  'verified',
  'needs-more-info',
  'rejected',
  'pending',
];

/** Action keys whose sentence already interpolates {detail}. */
const DETAIL_IN_SENTENCE = new Set([
  'admin.audit.reassigned',
  'admin.audit.pii.granted',
  'admin.audit.pii.denied',
]);

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border last:border-b-0">
      <dt className="sm:w-52 shrink-0 text-muted">{label}</dt>
      <dd className="m-0 font-medium break-words">{value}</dd>
    </div>
  );
}

function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const { t, lang } = useI18n();
  return (
    <Card className="mb-4">
      <h3 className="text-xl font-bold mb-1">{t('admin.audit.title')}</h3>
      <p className="text-sm text-muted mt-0 mb-3">{t('admin.audit.intro')}</p>
      {entries.length === 0 ? (
        <p className="m-0">{t('admin.audit.empty')}</p>
      ) : (
        <ol className="list-none p-0 m-0">
          {entries.map((e, i) => (
            <li key={i} className="py-2 border-b border-border last:border-b-0 flex gap-3">
              <span className="shrink-0 rounded-sm bg-surface border border-border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide self-start mt-0.5">
                {t(`admin.audit.actorKind.${e.actorKind}`)}
              </span>
              <span>
                <span className="block text-xs text-muted">
                  {formatDate(e.at, lang, true)} · {e.actor}
                </span>
                {t(e.actionKey, { detail: e.detail ?? '' })}
                {e.detail && !DETAIL_IN_SENTENCE.has(e.actionKey) && (
                  <span className="block text-sm text-muted mt-0.5">“{e.detail}”</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function AdminTicketDetail() {
  const { t, lang } = useI18n();
  const { authority } = useAdminAuth();
  const { id } = useParams<'id'>();

  const [report, setReport] = useState(() => (id ? getReport(id) : null));
  const refresh = () => setReport(id ? getReport(id) : null);

  const [status, setStatus] = useState<VerificationStatus>(() =>
    report ? verificationOf(report) : 'pending',
  );
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | undefined>();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [askingPii, setAskingPii] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const reporter = useMemo(
    () => (report?.userId ? getUsers().find((u) => u.id === report.userId) ?? null : null),
    [report],
  );

  if (!report || !authority || !canOpen(authority, report)) {
    return (
      <div className="max-w-2xl">
        <PageTitle>{t('dash.detail.notFound')}</PageTitle>
        <p className="text-lg mb-6">{t('dash.detail.notFoundBody')}</p>
        <Link to="/admin/tickets" className="text-link underline underline-offset-2 font-medium">
          {t('admin.backToTickets')}
        </Link>
      </div>
    );
  }

  const category = categoryById(report.category);
  const verification = verificationOf(report);
  const granted = grantedRequest(report, authority.id);
  const unlocked = Boolean(granted);
  const pendingRequest = pendingPiiRequest(report);
  const lastDecided = [...(report.piiRequests ?? [])].reverse().find((r) => r.status !== 'pending');
  const fieldById = incidentFieldById(report.category);
  const detailEntries = Object.entries(report.incidentDetails).filter(
    ([id_, v]) => v !== '' && !id_.endsWith(':unsure'),
  );
  const addr = report.location?.address;
  const unitPeers = AUTHORITY_ROSTER.filter(
    (a) => a.unit === authority.unit && a.id !== report.officer?.id,
  );

  const saveVerification = () => {
    if (!note.trim()) {
      setNoteError(t('admin.verification.noteRequired'));
      return;
    }
    setNoteError(undefined);
    setVerification(report.id, authority, status, note);
    setNote('');
    setFlash(t('admin.verification.saved'));
    refresh();
  };

  const postUpdate = () => {
    if (!message.trim()) {
      setMessageError(t('admin.update.required'));
      return;
    }
    setMessageError(undefined);
    addManualUpdate(report.id, authority, message);
    setMessage('');
    setFlash(t('admin.update.sent'));
    refresh();
  };

  const sendPiiRequest = () => {
    if (!reason.trim()) {
      setReasonError(t('admin.pii.reasonRequired'));
      return;
    }
    setReasonError(undefined);
    requestPii(report.id, authority, reason);
    setReason('');
    setAskingPii(false);
    refresh();
  };

  return (
    <div>
      <Link
        to="/admin/tickets"
        className="inline-block mb-4 text-link underline underline-offset-2 font-medium"
      >
        {t('admin.backToTickets')}
      </Link>

      <PageTitle caption={<span className="font-mono">{report.refNumber}</span>}>
        {t(category.labelKey)}
      </PageTitle>

      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <StatusTag status={report.status} />
        <VerificationTag status={verification} />
        {isOverdue(report) && (
          <span className="inline-block rounded-full border-2 border-error bg-errorbg hc-border px-3 py-0.5 text-sm font-bold">
            {t('admin.tickets.overdue')}
          </span>
        )}
      </div>

      <Alert variant="info" title={t('common.demoData')}>
        <p className="m-0">{t('admin.case.demoNote')}</p>
      </Alert>

      {flash && (
        <Alert variant="success" role="status">
          <p className="m-0">{flash}</p>
        </Alert>
      )}

      <Card className="mb-4 max-w-2xl">
        <dl className="m-0">
          <Row label={t('admin.case.filedOn')} value={formatDate(report.submittedAt, lang, true)} />
          <Row label={t('admin.case.category')} value={t(category.labelKey)} />
          <Row label={t('admin.case.priority')} value={t(`priority.${report.priority}`)} />
          <Row
            label={t('admin.tickets.colDue')}
            value={
              report.nextUpdateDue
                ? formatDate(report.nextUpdateDue, lang, true)
                : t('admin.tickets.noDeadline')
            }
          />
          <Row label={t('admin.tickets.colOfficer')} value={report.officer?.name ?? ''} />
        </dl>
      </Card>

      {/* ------------------------------------------------ reporter identity */}
      <h2 className="text-2xl font-bold mb-3">{t('admin.pii.title')}</h2>
      <Card className="mb-8 max-w-2xl">
        {report.anonymous || !hasPii(report) ? (
          <p className="m-0">{t('admin.pii.anonymous')}</p>
        ) : (
          <>
            <p className="mt-0 text-sm text-muted">{t('admin.pii.intro')}</p>
            <dl className="m-0 mb-4">
              <Row
                label={t('admin.pii.fields.name')}
                value={maskPii(report.identity?.name ?? reporter?.name, unlocked)}
              />
              <Row
                label={t('admin.pii.fields.docType')}
                value={
                  report.identity
                    ? unlocked
                      ? t(`docTypes.${report.identity.docType}`)
                      : maskPii('x', false)
                    : t('dash.review.notProvided')
                }
              />
              <Row
                label={t('admin.pii.fields.idNumber')}
                value={maskPii(report.identity?.idNumber, unlocked) ?? t('dash.review.notProvided')}
              />
              <Row
                label={t('admin.pii.fields.file')}
                value={maskPii(report.identity?.fileName, unlocked) ?? t('dash.review.notProvided')}
              />
              <Row
                label={t('admin.pii.fields.email')}
                value={maskPii(reporter?.email, unlocked) ?? t('dash.review.notProvided')}
              />
              <Row
                label={t('admin.pii.fields.mobile')}
                value={maskPii(reporter?.mobile, unlocked) ?? t('dash.review.notProvided')}
              />
              <Row
                label={t('admin.pii.fields.address')}
                value={
                  maskPii(
                    addr ? [addr.house, addr.street, addr.locality].filter(Boolean).join(', ') : undefined,
                    unlocked,
                  ) ?? t('dash.review.notProvided')
                }
              />
            </dl>

            {granted ? (
              <p className="m-0 font-medium">
                {t('admin.pii.granted', {
                  date: formatDate(granted.decidedAt ?? granted.requestedAt, lang, true),
                })}
              </p>
            ) : pendingRequest ? (
              <div>
                <p className="mt-0 mb-1 font-medium">
                  {t('admin.pii.pending', { date: formatDate(pendingRequest.requestedAt, lang, true) })}
                </p>
                <p className="m-0 text-sm text-muted">
                  {t('admin.pii.pendingReason')}: “{pendingRequest.reason}”
                </p>
              </div>
            ) : askingPii ? (
              <div>
                <TextArea
                  label={t('admin.pii.reasonLabel')}
                  hint={t('admin.pii.reasonHint')}
                  error={reasonError}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={sendPiiRequest}>{t('admin.pii.send')}</Button>
                  <Button variant="secondary" onClick={() => setAskingPii(false)}>
                    {t('admin.pii.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {lastDecided?.status === 'denied' && (
                  <p className="mt-0 mb-2 font-medium">
                    {t('admin.pii.denied', {
                      date: formatDate(lastDecided.decidedAt ?? lastDecided.requestedAt, lang, true),
                    })}
                  </p>
                )}
                <Button variant="secondary" onClick={() => setAskingPii(true)}>
                  {t('admin.pii.requestBtn')}
                </Button>
              </>
            )}
          </>
        )}
      </Card>

      {/* ------------------------------------------------------- the case */}
      <h2 className="text-2xl font-bold mb-3">{t('admin.case.incident')}</h2>

      <Card className="mb-4 max-w-2xl">
        <h3 className="text-xl font-bold mb-2">{t('admin.case.description')}</h3>
        <p className="m-0">{report.description?.text || t('dash.review.notProvided')}</p>
      </Card>

      <Card className="mb-4 max-w-2xl">
        <h3 className="text-xl font-bold mb-2">{t('dash.review.incidentDetails')}</h3>
        {detailEntries.length === 0 && (report.platforms ?? []).length === 0 ? (
          <p className="m-0">{t('admin.case.noDetails')}</p>
        ) : (
          <dl className="m-0">
            {detailEntries.map(([fieldId, value]) => {
              const field = fieldById.get(fieldId.replace(/:note$/, ''));
              const option =
                field?.type === 'select' ? field.options?.find((o) => o.value === value) : undefined;
              const label = field
                ? t(field.labelKey) + (fieldId.endsWith(':note') ? ` (${t('admin.fir.approx')})` : '')
                : humanize(fieldId);
              return <Row key={fieldId} label={label} value={option ? t(option.labelKey) : value} />;
            })}
            {(report.platforms ?? []).map((p) => (
              <Row
                key={p.id}
                label={t('admin.fir.platform')}
                value={`${t(platformLabelKey(p.id))}${p.handle ? ` (${p.handle})` : ''}`}
              />
            ))}
            {report.extraNotes && (
              <Row label={t('admin.fir.extraNotes')} value={report.extraNotes} />
            )}
          </dl>
        )}
      </Card>

      <Card className="mb-4 max-w-2xl">
        <h3 className="text-xl font-bold mb-2">{t('admin.case.location')}</h3>
        <p className="m-0">
          {addr
            ? [addr.locality, addr.city, addr.district, addr.state, addr.pin].filter(Boolean).join(', ')
            : t('dash.review.notProvided')}
        </p>
      </Card>

      <Card className="mb-8 max-w-2xl">
        <h3 className="text-xl font-bold mb-2">{t('admin.case.evidence')}</h3>
        {report.evidence.length === 0 ? (
          <p className="m-0">{t('dash.review.evidenceNone')}</p>
        ) : (
          <ul className="list-disc pl-5 m-0">
            {report.evidence.map((e) => (
              <li key={e.id} className="break-words">
                {t(`media.evidence.kinds.${e.kind}`)}: {e.name}
                {e.url && <span className="text-muted"> ({e.url})</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ----------------------------------------------------- the actions */}
      <h2 className="text-2xl font-bold mb-1">{t('admin.case.realActions')}</h2>
      <p className="text-sm text-muted mb-3 max-w-2xl">{t('admin.case.demoControlsNote')}</p>

      <Card className="mb-4 max-w-2xl">
        <h3 className="text-xl font-bold mb-1">{t('admin.verification.title')}</h3>
        <p className="text-sm text-muted mt-0 mb-3">{t('admin.verification.intro')}</p>
        {report.verifiedAt && verification === 'verified' && (
          <p className="m-0 mb-3 font-medium">
            {t('admin.verification.verifiedAt', { date: formatDate(report.verifiedAt, lang, true) })}
          </p>
        )}
        {report.verificationNotes && (
          <p className="m-0 mb-3 text-sm text-muted">
            {t('admin.verification.currentNote')}: “{report.verificationNotes}”
          </p>
        )}
        <RadioGroup
          legend={t('admin.verification.statusLabel')}
          options={VERIFICATION_OPTIONS.map((s) => ({
            value: s,
            label: t(`admin.verification.status.${s}`),
          }))}
          value={status}
          onChange={(v) => setStatus(v as VerificationStatus)}
        />
        <TextArea
          label={t('admin.verification.noteLabel')}
          hint={t('admin.verification.noteHint')}
          error={noteError}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button onClick={saveVerification}>{t('admin.verification.save')}</Button>
      </Card>

      <Card className="mb-4 max-w-2xl">
        <h3 className="text-xl font-bold mb-1">{t('admin.fir.title')}</h3>
        {verification === 'verified' ? (
          <>
            <p className="text-sm text-muted mt-0 mb-3">{t('admin.fir.intro')}</p>
            <Link
              to={`/admin/tickets/${report.id}/fir-prep`}
              className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-base font-semibold min-h-[44px] no-underline bg-action text-actiontext hover:bg-actionhover shadow-[0_2px_0_rgba(0,0,0,0.35)]"
            >
              {t('admin.fir.action')}
            </Link>
          </>
        ) : (
          <>
            <p className="mt-0 mb-3 font-medium">{t('admin.fir.lockedTitle')}</p>
            <p className="text-sm text-muted mt-0 mb-3">{t('admin.fir.locked')}</p>
            <Button disabled>{t('admin.fir.action')}</Button>
          </>
        )}
      </Card>

      <Card className="mb-4 max-w-2xl">
        <h3 className="text-xl font-bold mb-1">{t('admin.update.title')}</h3>
        <p className="text-sm text-muted mt-0 mb-3">{t('admin.update.intro')}</p>
        <TextArea
          label={t('admin.update.label')}
          hint={t('admin.update.hint')}
          error={messageError}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button onClick={postUpdate}>{t('admin.update.send')}</Button>
      </Card>

      {authority.rank === 'in-charge' && unitPeers.length > 0 && (
        <Card className="mb-8 max-w-2xl">
          <h3 className="text-xl font-bold mb-1">{t('admin.reassign.title')}</h3>
          <p className="text-sm text-muted mt-0 mb-3">{t('admin.reassign.intro')}</p>
          <Select
            label={t('admin.reassign.label')}
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
          >
            <option value="">{t('admin.reassign.label')}</option>
            {unitPeers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.badgeId})
              </option>
            ))}
          </Select>
          <Button
            disabled={!reassignTo}
            onClick={() => {
              reassignTicket(report.id, authority, reassignTo);
              setReassignTo('');
              setFlash(t('admin.reassign.done'));
              refresh();
            }}
          >
            {t('admin.reassign.submit')}
          </Button>
        </Card>
      )}

      <div className="max-w-2xl">
        <AuditLog entries={report.audit ?? []} />
      </div>
    </div>
  );
}
