/**
 * Multi-select "where did it happen" picker: toggle chips for the common
 * platforms, and for every selected one an optional inline link/username
 * field, so the URL lands next to the platform it belongs to.
 * Reads and writes draft.platforms directly (persisted on every change).
 */
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { PLATFORM_IDS, platformLabelKey } from '@/content/platforms';
import { TextInput } from '@/components/ui/Field';
import type { PlatformEntry } from '@/lib/types';

export default function PlatformPicker({
  legend,
  error,
}: {
  legend: string;
  error?: string;
}) {
  const { t } = useI18n();
  const { draft, updateDraft } = useDraft();
  const selected: PlatformEntry[] = draft?.platforms ?? [];

  const isOn = (id: string) => selected.some((p) => p.id === id);

  const toggle = (id: string) => {
    updateDraft({
      platforms: isOn(id) ? selected.filter((p) => p.id !== id) : [...selected, { id }],
    });
  };

  const setHandle = (id: string, handle: string) => {
    updateDraft({
      platforms: selected.map((p) => (p.id === id ? { ...p, handle: handle || undefined } : p)),
    });
  };

  return (
    <fieldset className="border-0 p-0 m-0 mb-5">
      <legend className="block font-semibold text-lg mb-1 p-0">{legend}</legend>
      <p className="text-muted text-base mt-0 mb-2">{t('media.details.platformsHint')}</p>
      {error && (
        <p className="text-error font-medium mb-2">
          <span className="sr-only">{t('errors.prefix')}</span>
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {PLATFORM_IDS.map((id, i) => {
          const on = isOn(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              // First chip carries the invalid flag so the error summary's
              // focus jump lands here.
              aria-invalid={error && i === 0 ? true : undefined}
              onClick={() => toggle(id)}
              className={`rounded-full border-2 hc-border px-4 py-2 min-h-[44px] font-medium cursor-pointer ${
                on ? 'border-ink bg-ink text-page' : 'border-border bg-page hover:bg-surface'
              }`}
            >
              {on && (
                <span aria-hidden="true" className="mr-1.5">
                  ✓
                </span>
              )}
              {t(platformLabelKey(id))}
            </button>
          );
        })}
      </div>
      {selected.map((p) => (
        <TextInput
          key={p.id}
          label={t('media.details.handleLabel', { platform: t(platformLabelKey(p.id)) })}
          value={p.handle ?? ''}
          onChange={(e) => setHandle(p.id, e.target.value)}
        />
      ))}
    </fieldset>
  );
}
