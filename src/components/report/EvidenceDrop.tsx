/**
 * Drag-and-drop target with a plain "Choose files" button and the file-type
 * and size guidance stated up front (instead of after a failed add). The
 * button is the keyboard path; the drop area is an enhancement.
 */
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';

export default function EvidenceDrop({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setActive(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) onFiles(files);
  };

  const onChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFiles(files);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={onDrop}
      className={`rounded-md border-2 border-dashed hc-border p-5 text-center max-w-2xl mb-4 ${
        active ? 'border-ink bg-surface' : 'border-border bg-page'
      }`}
    >
      <p className="mb-3 font-medium">{t('media.evidence.dropLabel')}</p>
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        {t('media.evidence.dropButton')}
      </Button>
      <p className="text-sm text-muted mt-3 mb-0">{t('media.evidence.dropHint')}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onChosen}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
