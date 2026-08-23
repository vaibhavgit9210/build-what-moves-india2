/**
 * The in-progress report. Persisted to localStorage on every change so a
 * refresh or a closed tab never loses work ("continue where you left off").
 *
 * Blobs (recorded audio, uploaded files) are NOT persisted — only metadata.
 * They live in the in-memory `mediaCache` and survive route changes but not
 * a full reload; UIs must handle their absence gracefully.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON, removeKey, KEYS } from '@/lib/storage';
import { submitReport } from '@/services/reportService';
import { getTechnicalInfo } from '@/services/deviceService';
import type { DraftReport, Report, User } from '@/lib/types';

export function emptyDraft(): DraftReport {
  return {
    startedAt: new Date().toISOString(),
    lastPath: '/report/location',
    consent: {},
    answers: {},
    incidentDetails: {},
    evidence: [],
  };
}

/** In-memory media that must not go to localStorage. */
export const mediaCache: {
  audio?: Blob;
  files: Map<string, File>;
} = { files: new Map() };

interface DraftValue {
  draft: DraftReport | null;
  hasDraft: boolean;
  /** Create (or return the existing) draft. */
  startDraft: () => DraftReport;
  /** Shallow-merge a patch into the draft and persist. */
  updateDraft: (patch: Partial<DraftReport>) => void;
  clearDraft: () => void;
  /** Turn the draft into a submitted report and clear it. Pass null for anonymous. */
  submitDraft: (user: User | null, lang: string) => Report;
}

const DraftContext = createContext<DraftValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DraftReport | null>(() =>
    loadJSON<DraftReport | null>(KEYS.draft, null),
  );

  const startDraft = useCallback((): DraftReport => {
    let created: DraftReport | null = null;
    setDraft((d) => {
      if (d) {
        created = d;
        return d;
      }
      created = emptyDraft();
      saveJSON(KEYS.draft, created);
      return created;
    });
    return created ?? loadJSON<DraftReport | null>(KEYS.draft, null) ?? emptyDraft();
  }, []);

  const updateDraft = useCallback((patch: Partial<DraftReport>) => {
    setDraft((d) => {
      const next = { ...(d ?? emptyDraft()), ...patch };
      saveJSON(KEYS.draft, next);
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    removeKey(KEYS.draft);
    mediaCache.audio = undefined;
    mediaCache.files.clear();
    setDraft(null);
  }, []);

  const submitDraft = useCallback(
    (user: User | null, lang: string): Report => {
      // Prefer in-memory state: localStorage may be unavailable (private
      // mode, quota) even though the journey worked entirely in memory.
      const d = draft ?? loadJSON<DraftReport | null>(KEYS.draft, null);
      if (!d) throw new Error('no draft to submit');
      const technical = d.consent.technical ? getTechnicalInfo(true) : undefined;
      const report = submitReport(d, user, technical, lang);
      removeKey(KEYS.draft);
      mediaCache.audio = undefined;
      mediaCache.files.clear();
      setDraft(null);
      return report;
    },
    [draft],
  );

  const value = useMemo(
    () => ({ draft, hasDraft: draft !== null, startDraft, updateDraft, clearDraft, submitDraft }),
    [draft, startDraft, updateDraft, clearDraft, submitDraft],
  );
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}
