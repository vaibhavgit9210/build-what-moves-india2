/** Verification pill, same never-colour-alone rule as StatusTag. */
import { useI18n } from '@/i18n';
import type { VerificationStatus } from '@/lib/types';

const TONES: Record<VerificationStatus, string> = {
  pending: 'bg-surface border-border',
  verified: 'bg-successbg border-success',
  'needs-more-info': 'bg-warnbg border-warn',
  rejected: 'bg-errorbg border-error',
};

export function VerificationTag({ status }: { status: VerificationStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-block rounded-full border-2 hc-border px-3 py-0.5 text-sm font-semibold whitespace-nowrap ${TONES[status]}`}
    >
      {t(`admin.verification.status.${status}`)}
    </span>
  );
}
