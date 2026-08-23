/**
 * TextArea with an optional voice path: "Speak instead of typing" reveals the
 * shared VoiceRecorder; the transcript is appended into the same editable
 * textarea, so nothing audio-derived is ever submitted unseen. Uses the same
 * in-browser Whisper pipeline (with its honest demo fallback) as the
 * description page.
 */
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { transcribe, type SttProgress } from '@/services/sttService';
import { TextArea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Misc';
import VoiceRecorder from '@/components/report/VoiceRecorder';

export default function VoiceTextArea({
  label,
  hint,
  error,
  rows = 4,
  value,
  onText,
  onBlur,
}: {
  label: string;
  hint?: string;
  error?: string;
  rows?: number;
  value: string;
  onText: (text: string) => void;
  onBlur?: () => void;
}) {
  const { t, lang } = useI18n();
  const [showRecorder, setShowRecorder] = useState(false);
  const [progress, setProgress] = useState<SttProgress | null>(null);
  const [provider, setProvider] = useState<'whisper' | 'demo' | null>(null);
  const busy = progress !== null;

  const run = async (blob: Blob) => {
    setProgress({ kind: 'loading-model' });
    try {
      const result = await transcribe(blob, lang, (p) => setProgress(p));
      onText(value.trim() ? `${value.trimEnd()} ${result.text}` : result.text);
      setProvider(result.provider);
      setShowRecorder(false);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <TextArea
        label={label}
        hint={hint}
        error={error}
        rows={rows}
        value={value}
        onChange={(e) => onText(e.target.value)}
        onBlur={onBlur}
      />
      <div className="-mt-3 mb-5">
        <button
          type="button"
          aria-expanded={showRecorder}
          onClick={() => setShowRecorder((s) => !s)}
          className="text-link underline underline-offset-2 font-medium cursor-pointer"
        >
          <span aria-hidden="true" className="mr-1.5">🎙️</span>
          {t('media.dictation.toggle')}
        </button>
        {showRecorder && (
          <div className="mt-3">
            <p className="text-sm text-muted mb-2">{t('media.dictation.hint')}</p>
            <VoiceRecorder
              busy={busy}
              onUseRecording={(blob) => void run(blob)}
              onSwitchToTyped={() => setShowRecorder(false)}
            />
          </div>
        )}
        {/* Persistent live region for transcription progress. */}
        <p role="status" className={progress ? 'text-base py-2' : 'sr-only'}>
          {progress
            ? progress.kind === 'loading-model'
              ? progress.pct !== undefined
                ? t('media.stt.loadingModel', { pct: progress.pct })
                : t('media.stt.loadingModelNoPct')
              : t('media.stt.transcribing')
            : ''}
        </p>
        {provider === 'demo' && (
          <Alert variant="info" title={t('media.stt.demoTitle')} role="status">
            {t('media.stt.demoBody')}
          </Alert>
        )}
        {provider === 'whisper' && (
          <p className="text-sm text-muted mt-2">{t('media.stt.checkWarning')}</p>
        )}
      </div>
    </div>
  );
}
