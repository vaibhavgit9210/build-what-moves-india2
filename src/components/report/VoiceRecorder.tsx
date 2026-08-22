/**
 * Voice recorder for the report description page.
 *
 * - getUserMedia is requested only when "Start recording" is pressed.
 * - MediaRecorder mime negotiation: audio/webm, else audio/mp4 (Safari).
 * - Recording caps at 3 minutes (auto-stop with a visible explanation).
 * - The finished Blob is kept in the in-memory mediaCache (never localStorage).
 * - preloadModel() is fired on mount so the Whisper download overlaps recording.
 * - Permission problems never dead-end: a "type it instead" escape is offered.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Misc';
import { useI18n } from '@/i18n';
import { mediaCache } from '@/state/DraftContext';
import { preloadModel } from '@/services/sttService';

const MAX_SEC = 180;

type Phase = 'idle' | 'recording' | 'recorded';
type RecError = 'permission' | 'not-supported' | null;

export function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VoiceRecorder({
  initialDurationSec,
  busy,
  onUseRecording,
  onSwitchToTyped,
}: {
  /** Known duration when a recording already exists in mediaCache. */
  initialDurationSec?: number;
  /** True while transcription is running: disables the action buttons. */
  busy?: boolean;
  onUseRecording: (blob: Blob, durationSec: number) => void;
  onSwitchToTyped: () => void;
}) {
  const { t } = useI18n();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const urlRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>(() => (mediaCache.audio ? 'recorded' : 'idle'));
  const [seconds, setSeconds] = useState(initialDurationSec ?? 0);
  const [srSeconds, setSrSeconds] = useState(0);
  const [capReached, setCapReached] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<RecError>(null);

  // Start the model download early so it overlaps the recording itself.
  useEffect(() => {
    preloadModel();
  }, []);

  // If a recording already lives in the cache (e.g. user navigated back),
  // surface it as the "recorded" state.
  useEffect(() => {
    if (mediaCache.audio && !urlRef.current) {
      urlRef.current = URL.createObjectURL(mediaCache.audio);
      setBlobUrl(urlRef.current);
    }
  }, []);

  // Cleanup on unmount: stop tracks, revoke the blob URL.
  useEffect(
    () => () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  // 1-second timer while recording.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Screen-reader announcements only every 15 s (avoids chatter), and the
  // 3-minute hard cap.
  useEffect(() => {
    if (phase !== 'recording') return;
    if (seconds > 0 && seconds % 15 === 0) setSrSeconds(seconds);
    if (seconds >= MAX_SEC) {
      setCapReached(true);
      stopRecording();
    }
  }, [seconds, phase, stopRecording]);

  const startRecording = useCallback(async () => {
    setError(null);
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('not-supported');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('permission');
      return;
    }
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      rec = new MediaRecorder(stream);
    }
    chunksRef.current = [];
    rec.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime });
      mediaCache.audio = blob;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setBlobUrl(urlRef.current);
      setPhase('recorded');
      stream.getTracks().forEach((tr) => tr.stop());
    };
    recorderRef.current = rec;
    streamRef.current = stream;
    rec.start();
    setSeconds(0);
    setSrSeconds(0);
    setCapReached(false);
    setPhase('recording');
  }, []);

  const recordAgain = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setBlobUrl(null);
    setSeconds(0);
    setSrSeconds(0);
    setCapReached(false);
    setError(null);
    setPhase('idle');
  }, []);

  return (
    <div className="max-w-2xl">
      {/* Persistent live region for the 3-minute cap: always mounted so screen
          readers announce the text change; the visual Alert below is separate. */}
      <p className="sr-only" role="status">
        {capReached ? t('media.recorder.capReached') : ''}
      </p>

      {error && (
        <Alert
          variant="warning"
          role="alert"
          title={error === 'permission' ? t('media.recorder.permissionTitle') : undefined}
        >
          <p className="mb-3">
            {error === 'permission'
              ? t('media.recorder.permissionBody')
              : t('media.recorder.notSupported')}
          </p>
          <div className="flex flex-wrap gap-3">
            {error === 'permission' && (
              <Button variant="secondary" onClick={() => void startRecording()}>
                {t('common.tryAgain')}
              </Button>
            )}
            <Button variant="secondary" onClick={onSwitchToTyped}>
              {t('media.recorder.switchToTyped')}
            </Button>
          </div>
        </Alert>
      )}

      {phase === 'idle' && (
        <>
          <p className="text-base text-muted mb-4">{t('media.recorder.intro')}</p>
          <Button onClick={() => void startRecording()} className="text-lg px-8">
            {t('media.recorder.start')}
          </Button>
        </>
      )}

      {phase === 'recording' && (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="rec-dot inline-block h-4 w-4 rounded-full bg-error" />
              <span className="font-bold text-lg">{t('media.recorder.recordingLabel')}</span>
            </span>
            <span className="font-mono text-2xl tabular-nums" aria-hidden="true">
              {formatMmSs(seconds)}
            </span>
          </div>
          {/* Announced only every 15 s to avoid screen-reader chatter. */}
          <p className="sr-only" role="status">
            {srSeconds > 0 ? t('media.recorder.srProgress', { sec: srSeconds }) : ''}
          </p>
          <p className="text-sm text-muted mb-4">{t('media.recorder.capWarning')}</p>
          <Button variant="warning" onClick={stopRecording} className="text-lg px-10">
            {t('media.recorder.stop')}
          </Button>
        </>
      )}

      {phase === 'recorded' && (
        <>
          {capReached && (
            <Alert variant="warning">{t('media.recorder.capReached')}</Alert>
          )}
          <p className="font-bold text-lg mb-1">{t('media.recorder.completeTitle')}</p>
          {seconds > 0 && (
            <p className="text-sm text-muted mb-2">
              {t('media.recorder.durationNote', { mmss: formatMmSs(seconds) })}
            </p>
          )}
          <p className="text-sm text-muted mb-2">{t('media.recorder.playbackHint')}</p>
          {blobUrl && (
            <audio controls src={blobUrl} className="w-full max-w-xl mb-4">
              {t('media.recorder.notSupported')}
            </audio>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                if (mediaCache.audio) onUseRecording(mediaCache.audio, seconds);
              }}
              disabled={busy}
            >
              {t('media.recorder.useRecording')}
            </Button>
            <Button variant="secondary" onClick={recordAgain} disabled={busy}>
              {t('media.recorder.recordAgain')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
