/**
 * Speech-to-text abstraction.
 *
 *   UI → transcribe(blob, lang, onProgress) → { text, provider }
 *
 * Primary provider: Whisper-tiny running fully in the browser via
 * @huggingface/transformers (free, no API key; the ~40 MB model downloads
 * from the Hugging Face Hub on first use and is cached by the browser).
 *
 * Fallback provider: a canned demo transcript, used when the model cannot
 * load (offline, unsupported browser, slow device). The result carries
 * provider: 'demo' so the UI can label it honestly.
 */
import type { Lang } from '@/lib/types';

export interface TranscriptionResult {
  text: string;
  language: string;
  provider: 'whisper' | 'demo';
}

export type SttProgress =
  | { kind: 'loading-model'; pct?: number }
  | { kind: 'transcribing' };

type ProgressCb = (p: SttProgress) => void;

const DEMO_TEXT: Record<string, string> = {
  en: 'Yesterday afternoon I got a phone call from someone saying they were from my bank. They said my account would be blocked unless I shared an OTP. After I shared it, twenty thousand rupees were taken from my account through UPI.',
  hi: 'कल दोपहर मुझे एक फ़ोन आया। कहने वाले ने खुद को मेरे बैंक से बताया और कहा कि OTP नहीं देने पर मेरा खाता बंद हो जाएगा। OTP बताने के बाद मेरे खाते से UPI के ज़रिये बीस हज़ार रुपये निकल गए।',
};

// ---------------------------------------------------------------------------
// Whisper via @huggingface/transformers (lazy-loaded, singleton)
// ---------------------------------------------------------------------------

let whisperPromise: Promise<any> | null = null;

function loadWhisper(onProgress?: ProgressCb): Promise<any> {
  if (!whisperPromise) {
    whisperPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
        dtype: 'q8',
        progress_callback: (p: any) => {
          if (p?.status === 'progress' && typeof p.progress === 'number') {
            onProgress?.({ kind: 'loading-model', pct: Math.round(p.progress) });
          }
        },
      });
    })();
    whisperPromise.catch(() => {
      whisperPromise = null; // allow a retry on the next recording
    });
  }
  return whisperPromise;
}

/** Decode any recorded blob to 16 kHz mono Float32 samples for Whisper. */
async function blobToPCM(blob: Blob): Promise<Float32Array> {
  const arrayBuf = await blob.arrayBuffer();
  const AC: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const probe = new AC();
  const decoded = await probe.decodeAudioData(arrayBuf.slice(0));
  await probe.close();

  const target = 16_000;
  const frames = Math.ceil(decoded.duration * target);
  const off = new OfflineAudioContext(1, Math.max(frames, 1), target);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('stt-timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function whisperTranscribe(
  blob: Blob,
  language: Lang | string,
  onProgress?: ProgressCb,
): Promise<TranscriptionResult> {
  const asr = await withTimeout(loadWhisper(onProgress), 120_000);
  onProgress?.({ kind: 'transcribing' });
  const pcm = await blobToPCM(blob);
  const out: any = await withTimeout(
    asr(pcm, { language: language === 'hi' ? 'hindi' : 'english', task: 'transcribe' }),
    120_000,
  );
  const text = String(out?.text ?? '').trim();
  if (!text) throw new Error('empty-transcript');
  return { text, language: String(language), provider: 'whisper' };
}

// ---------------------------------------------------------------------------
// Public facade
// ---------------------------------------------------------------------------

/**
 * Transcribe a recording. Tries in-browser Whisper first; falls back to the
 * canned demo transcript so the flow never dead-ends.
 */
export async function transcribe(
  blob: Blob,
  language: Lang | string,
  onProgress?: ProgressCb,
): Promise<TranscriptionResult> {
  try {
    return await whisperTranscribe(blob, language, onProgress);
  } catch {
    await new Promise((r) => setTimeout(r, 1200));
    return {
      text: DEMO_TEXT[String(language)] ?? DEMO_TEXT.en,
      language: String(language),
      provider: 'demo',
    };
  }
}

/** Kick off the model download in the background (e.g. when the recorder mounts). */
export function preloadModel(onProgress?: ProgressCb): void {
  loadWhisper(onProgress).catch(() => {
    /* fallback path will handle it */
  });
}
