/**
 * Shared evidence-file ingestion: size check, kind inference from mime,
 * in-memory caching. Used by the evidence step and the in-context quick-add
 * on the description page so both behave identically.
 */
import { uid } from '@/lib/id';
import { mediaCache } from '@/state/DraftContext';
import type { EvidenceKind, EvidenceMeta } from '@/lib/types';

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function kindForFile(file: File): EvidenceKind {
  if (file.type.startsWith('image/')) return 'screenshot';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf' || file.type.startsWith('text/')) return 'document';
  return 'other';
}

/**
 * Validate and cache files. Returns the metadata to append to the draft and
 * the names of files rejected for size.
 */
export function ingestFiles(
  files: File[],
  kind?: EvidenceKind,
): { metas: EvidenceMeta[]; tooLarge: string[] } {
  const metas: EvidenceMeta[] = [];
  const tooLarge: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      tooLarge.push(file.name);
      continue;
    }
    const id = uid();
    mediaCache.files.set(id, file);
    metas.push({ id, kind: kind ?? kindForFile(file), name: file.name, size: file.size, mime: file.type });
  }
  return { metas, tooLarge };
}
