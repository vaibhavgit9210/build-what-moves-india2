/**
 * /report/evidence — optional evidence upload (prototype-honest).
 *
 * File contents live only in the in-memory mediaCache; the draft persists
 * metadata alone. After a refresh the metadata list survives but the bytes
 * may be gone — the UI says so with a badge instead of pretending.
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft, mediaCache } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { uid } from '@/lib/id';
import { Button } from '@/components/ui/Button';
import { TextInput, TextArea } from '@/components/ui/Field';
import { Alert, Card, PageTitle, ProgressSteps } from '@/components/ui/Misc';
import type { EvidenceKind, EvidenceMeta } from '@/lib/types';

const THIS_PATH = '/report/evidence';
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const KIND_ICONS: Record<EvidenceKind, string> = {
  screenshot: '📷',
  chat: '💬',
  document: '📄',
  url: '🔗',
  video: '🎥',
  other: '📎',
};

const FILE_KINDS: { kind: EvidenceKind; accept: string }[] = [
  { kind: 'screenshot', accept: 'image/*' },
  { kind: 'chat', accept: '' },
  { kind: 'document', accept: '' },
  { kind: 'video', accept: 'video/*' },
  { kind: 'other', accept: '' },
];

function humanSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isValidUrl(v: string): boolean {
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(candidate);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

export default function ReportEvidence() {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingKindRef = useRef<EvidenceKind>('other');

  const [urlFormOpen, setUrlFormOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlNote, setUrlNote] = useState('');
  const [urlError, setUrlError] = useState<string | undefined>(undefined);
  const [addErrors, setAddErrors] = useState<string[]>([]);
  const [notes, setNotes] = useState(draft?.extraNotes ?? '');

  if (!draft) return <Navigate to="/report" replace />;

  const evidence = draft.evidence;

  const openPicker = (kind: EvidenceKind, accept: string) => {
    const el = fileInputRef.current;
    if (!el) return;
    pendingKindRef.current = kind;
    el.accept = accept;
    el.value = '';
    el.click();
  };

  const onFilesChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const kind = pendingKindRef.current;
    const errs: string[] = [];
    const metas: EvidenceMeta[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        errs.push(t('media.evidence.tooLarge', { name: file.name }));
        continue;
      }
      const id = uid();
      mediaCache.files.set(id, file);
      metas.push({ id, kind, name: file.name, size: file.size, mime: file.type });
    }
    if (metas.length > 0) updateDraft({ evidence: [...evidence, ...metas] });
    setAddErrors(errs);
    e.target.value = '';
  };

  const addUrl = () => {
    const v = urlValue.trim();
    if (!v || !isValidUrl(v)) {
      setUrlError(t('media.evidence.urlInvalid'));
      return;
    }
    const meta: EvidenceMeta = {
      id: uid(),
      kind: 'url',
      name: v,
      url: v,
      ...(urlNote.trim() ? { note: urlNote.trim() } : {}),
    };
    updateDraft({ evidence: [...evidence, meta] });
    setUrlValue('');
    setUrlNote('');
    setUrlError(undefined);
    setUrlFormOpen(false);
  };

  const removeItem = (id: string) => {
    mediaCache.files.delete(id);
    updateDraft({ evidence: evidence.filter((m) => m.id !== id) });
  };

  const onContinue = () => {
    updateDraft({
      extraNotes: notes.trim() ? notes : undefined,
      lastPath: '/report/review',
    });
    const next = nextPath(THIS_PATH);
    if (next) navigate(next);
  };

  const onBack = () => {
    updateDraft({ extraNotes: notes.trim() ? notes : undefined });
    const prev = prevPath(THIS_PATH);
    if (prev) navigate(prev);
  };

  const addCard = (kind: EvidenceKind, onClick: () => void, pressed?: boolean) => (
    <button
      key={kind}
      type="button"
      onClick={onClick}
      aria-pressed={kind === 'url' ? pressed : undefined}
      className={`flex flex-col items-center justify-center gap-1 rounded-md border-2 hc-border p-4 min-h-[80px] cursor-pointer text-center ${
        kind === 'url' && pressed ? 'border-ink bg-surface' : 'border-border bg-page hover:bg-surface'
      }`}
    >
      <span aria-hidden="true" className="text-2xl">
        {KIND_ICONS[kind]}
      </span>
      <span className="text-sm font-semibold">{t(`media.evidence.kinds.${kind}`)}</span>
    </button>
  );

  return (
    <div className="max-w-3xl">
      <ProgressSteps />
      <PageTitle>{t('media.evidence.title')}</PageTitle>

      <p className="text-lg mb-5 max-w-2xl">{t('media.evidence.reassurance')}</p>

      <Alert variant="info" title={t('media.evidence.privacyTitle')}>
        {t('media.evidence.privacyNote')}
      </Alert>

      {addErrors.length > 0 && (
        <Alert variant="error">
          <ul className="list-disc pl-5">
            {addErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      <h2 className="text-xl font-bold mb-3">{t('media.evidence.addHeading')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mb-6">
        {FILE_KINDS.slice(0, 3).map((fk) => addCard(fk.kind, () => openPicker(fk.kind, fk.accept)))}
        {addCard('url', () => setUrlFormOpen((o) => !o), urlFormOpen)}
        {FILE_KINDS.slice(3).map((fk) => addCard(fk.kind, () => openPicker(fk.kind, fk.accept)))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFilesChosen}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {urlFormOpen && (
        <Card className="mb-6 max-w-2xl">
          <h3 className="text-lg font-bold mb-3">{t('media.evidence.kinds.url')}</h3>
          <TextInput
            label={t('media.evidence.urlLabel')}
            error={urlError}
            inputMode="url"
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
              setUrlError(undefined);
            }}
          />
          <TextInput
            label={`${t('media.evidence.urlNoteLabel')} (${t('common.optional')})`}
            value={urlNote}
            onChange={(e) => setUrlNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={addUrl}>
              {t('media.evidence.urlAdd')}
            </Button>
            <Button variant="plain" onClick={() => setUrlFormOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </Card>
      )}

      {evidence.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-3">
            {t('media.evidence.listHeading', { count: evidence.length })}
          </h2>
          <ul className="list-none p-0 m-0 flex flex-col gap-3 max-w-2xl mb-6">
            {evidence.map((item) => {
              const missing = item.kind !== 'url' && !mediaCache.files.has(item.id);
              return (
                <li key={item.id}>
                  <Card className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted mb-0.5">
                        <span aria-hidden="true" className="mr-1">
                          {KIND_ICONS[item.kind]}
                        </span>
                        {t(`media.evidence.kinds.${item.kind}`)}
                        {item.size !== undefined && ` · ${humanSize(item.size)}`}
                      </p>
                      <p className="font-medium break-all">{item.name}</p>
                      {item.note && <p className="text-sm text-muted break-words">{item.note}</p>}
                      {missing && (
                        <p className="inline-block mt-1 rounded-sm bg-warnbg border border-warn hc-border px-2 py-0.5 text-sm font-medium">
                          {t('media.evidence.notInMemory')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => removeItem(item.id)}
                      aria-label={`${t('common.remove')}: ${item.name}`}
                    >
                      {t('common.remove')}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <TextArea
        label={`${t('media.evidence.notesLabel')} (${t('common.optional')})`}
        hint={t('media.evidence.notesHint')}
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => updateDraft({ extraNotes: notes.trim() ? notes : undefined })}
      />

      <div className="flex flex-wrap gap-3 mt-8">
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button onClick={onContinue}>{t('common.continue')}</Button>
      </div>
    </div>
  );
}
