/**
 * /report/description — "Tell us what happened."
 *
 * Two modes: type it, or record your voice and get an editable transcript
 * (in-browser Whisper with an honest demo fallback — see sttService).
 * The final text + language are persisted on Continue.
 */
import { useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft, mediaCache } from '@/state/DraftContext';
import { nextPath, prevPath } from '@/lib/steps';
import { transcribe, type SttProgress } from '@/services/sttService';
import { ingestFiles } from '@/lib/evidence';
import { Button } from '@/components/ui/Button';
import { TextArea, Select } from '@/components/ui/Field';
import { Alert, PageTitle, ProgressSteps, ErrorSummary } from '@/components/ui/Misc';
import VoiceRecorder from '@/components/report/VoiceRecorder';
import EvidenceDrop from '@/components/report/EvidenceDrop';
import type { DescriptionInfo } from '@/lib/types';

const THIS_PATH = '/report/description';

export default function ReportDescription() {
  const { t, lang } = useI18n();
  const { draft, updateDraft } = useDraft();
  const navigate = useNavigate();

  const saved = draft?.description;

  const [mode, setMode] = useState<'typed' | 'voice'>(saved?.mode ?? 'typed');

  // Typed mode.
  const [typedText, setTypedText] = useState(saved?.mode === 'typed' ? saved.text : '');
  const [typedLang, setTypedLang] = useState(saved?.mode === 'typed' ? saved.language : lang);

  // Voice mode.
  const [voiceText, setVoiceText] = useState(saved?.mode === 'voice' ? saved.text : '');
  const [voiceLang, setVoiceLang] = useState(saved?.mode === 'voice' ? saved.language : lang);
  const [originalTranscript, setOriginalTranscript] = useState<string | undefined>(
    saved?.originalTranscript,
  );
  const [provider, setProvider] = useState<'whisper' | 'demo' | undefined>(
    saved?.transcriptProvider,
  );
  const [durationSec, setDurationSec] = useState<number | undefined>(saved?.audioDurationSec);
  const [lastSttLang, setLastSttLang] = useState<string | null>(
    saved?.mode === 'voice' && saved.text ? saved.language : null,
  );
  const [hasTranscript, setHasTranscript] = useState(saved?.mode === 'voice' && !!saved.text);
  const [progress, setProgress] = useState<SttProgress | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [quickAddErrors, setQuickAddErrors] = useState<string[]>([]);

  const runTranscription = useCallback(
    async (blob: Blob, language: string, dur?: number) => {
      setErrors([]);
      setProgress({ kind: 'loading-model' });
      try {
        const result = await transcribe(blob, language, (p) => setProgress(p));
        setVoiceText(result.text);
        setOriginalTranscript(result.text);
        setProvider(result.provider);
        setLastSttLang(language);
        setHasTranscript(true);
        if (dur !== undefined) setDurationSec(dur);
      } finally {
        setProgress(null);
      }
    },
    [],
  );

  if (!draft) return <Navigate to="/report" replace />;

  const busy = progress !== null;

  const addQuickFiles = (files: File[]) => {
    const { metas, tooLarge } = ingestFiles(files);
    if (metas.length > 0) updateDraft({ evidence: [...draft.evidence, ...metas] });
    setQuickAddErrors(tooLarge.map((name) => t('media.evidence.tooLarge', { name })));
  };

  const removeQuickFile = (id: string) => {
    mediaCache.files.delete(id);
    updateDraft({ evidence: draft.evidence.filter((m) => m.id !== id) });
  };

  const onContinue = () => {
    const text = (mode === 'typed' ? typedText : voiceText).trim();
    if (!text) {
      setErrors([
        t(mode === 'typed' ? 'media.description.errorEmptyTyped' : 'media.description.errorEmptyVoice'),
      ]);
      return;
    }
    const description: DescriptionInfo = {
      mode,
      text,
      language: mode === 'typed' ? typedLang : voiceLang,
      ...(mode === 'voice' && originalTranscript ? { originalTranscript } : {}),
      ...(mode === 'voice' && durationSec !== undefined ? { audioDurationSec: durationSec } : {}),
      ...(mode === 'voice' && provider ? { transcriptProvider: provider } : {}),
    };
    updateDraft({ description, lastPath: '/report/details' });
    const next = nextPath(THIS_PATH);
    if (next) navigate(next);
  };

  const onBack = () => {
    const prev = prevPath(THIS_PATH);
    if (prev) navigate(prev);
  };

  const modeButton = (m: 'typed' | 'voice', label: string, hint: string, icon: string) => {
    const selected = mode === m;
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => setMode(m)}
        className={`flex flex-col items-start gap-1 rounded-md border-2 hc-border p-4 min-h-[44px] text-left cursor-pointer ${
          selected ? 'border-ink bg-surface' : 'border-border bg-page hover:bg-surface'
        }`}
      >
        <span className="text-lg font-bold">
          <span aria-hidden="true" className="mr-2">
            {icon}
          </span>
          {label}
          {selected && (
            <span className="ml-2 text-sm font-semibold" aria-hidden="true">
              ✓
            </span>
          )}
        </span>
        <span className="text-sm text-muted">{hint}</span>
      </button>
    );
  };

  const languageOptions = (
    <>
      <option value="en">{t('media.description.langEn')}</option>
      <option value="hi">{t('media.description.langHi')}</option>
      <option value="other">{t('media.description.langOther')}</option>
    </>
  );

  return (
    <div className="max-w-3xl">
      <ProgressSteps />
      <PageTitle>{t('media.description.title')}</PageTitle>
      <ErrorSummary errors={errors} />

      <p className="text-lg mb-5 max-w-2xl">{t('media.description.intro')}</p>

      <fieldset className="border-0 p-0 mb-6">
        <legend className="text-base font-semibold mb-2">{t('media.description.modeLegend')}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          {modeButton('typed', t('media.description.modeTyped'), t('media.description.modeTypedHint'), '📝')}
          {modeButton('voice', t('media.description.modeVoice'), t('media.description.modeVoiceHint'), '🎙️')}
        </div>
      </fieldset>

      {mode === 'typed' && (
        <>
          <TextArea
            label={t('media.description.typedLabel')}
            hint={t('media.description.typedHint')}
            rows={8}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
          />
          <Select
            label={t('media.description.languageLabel')}
            value={typedLang}
            onChange={(e) => setTypedLang(e.target.value)}
          >
            {languageOptions}
          </Select>
        </>
      )}

      {mode === 'voice' && (
        <>
          {!hasTranscript && (
            <Select
              label={t('media.stt.transcriptLangLabel')}
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
            >
              {languageOptions}
            </Select>
          )}

          <VoiceRecorder
            initialDurationSec={durationSec}
            busy={busy}
            onUseRecording={(blob, dur) => void runTranscription(blob, voiceLang, dur)}
            onSwitchToTyped={() => setMode('typed')}
          />

          {/* Persistent live region: stays mounted so screen readers announce
              the text change when transcription starts. */}
          <p
            role="status"
            className={
              progress ? 'flex items-center gap-3 py-4 text-base max-w-2xl' : 'sr-only'
            }
          >
            {progress && (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-current border-t-transparent"
                />
                {progress.kind === 'loading-model'
                  ? progress.pct !== undefined
                    ? t('media.stt.loadingModel', { pct: progress.pct })
                    : t('media.stt.loadingModelNoPct')
                  : t('media.stt.transcribing')}
              </>
            )}
          </p>

          {hasTranscript && !progress && (
            <div className="mt-6">
              {provider === 'demo' && (
                <Alert variant="info" title={t('media.stt.demoTitle')} role="status">
                  {t('media.stt.demoBody')}
                </Alert>
              )}
              <Alert variant="warning" role="status">
                {t('media.stt.checkWarning')}
              </Alert>
              <TextArea
                label={t('media.stt.transcriptLabel')}
                hint={t('media.stt.transcriptHint')}
                rows={8}
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
              />
              <Select
                label={t('media.stt.transcriptLangLabel')}
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
              >
                {languageOptions}
              </Select>
              {lastSttLang !== null && voiceLang !== lastSttLang && mediaCache.audio && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (mediaCache.audio) void runTranscription(mediaCache.audio, voiceLang);
                  }}
                  disabled={busy}
                  className="mb-5"
                >
                  {t('media.stt.transcribeAgain')}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <section className="mt-10 max-w-2xl">
        <h2 className="text-xl font-bold mb-1">{t('media.description.evidenceHeading')}</h2>
        <p className="text-muted mb-3">{t('media.description.evidenceHint')}</p>
        {quickAddErrors.length > 0 && (
          <Alert variant="error">
            <ul className="list-disc pl-5">
              {quickAddErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </Alert>
        )}
        <EvidenceDrop onFiles={addQuickFiles} />
        {draft.evidence.length > 0 && (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {draft.evidence.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border-2 border-border hc-border px-3 py-2"
              >
                <span className="font-medium break-all">{item.name}</span>
                <Button
                  variant="plain"
                  onClick={() => removeQuickFile(item.id)}
                  aria-label={`${t('common.remove')}: ${item.name}`}
                >
                  {t('common.remove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3 mt-8">
        <Button variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button onClick={onContinue} disabled={busy}>
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
}
