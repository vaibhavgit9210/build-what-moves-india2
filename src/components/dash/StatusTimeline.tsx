/**
 * Shared status pieces for the dashboard / tracking module:
 * - StatusTag: small bordered pill (border + text + subtle bg, never color alone)
 * - StatusTimeline: the six-step vertical progress list used by the report
 *   detail page and the public track page.
 */
import { useI18n, formatDate } from '@/i18n';
import { STATUS_ORDER, type ReportStatus, type TimelineEvent } from '@/lib/types';

export function StatusTag({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  const tone =
    status === 'resolved' ? 'bg-successbg border-success' : 'bg-infobg border-info';
  return (
    <span
      className={`inline-block rounded-full border-2 hc-border px-3 py-0.5 text-sm font-semibold whitespace-nowrap ${tone}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

export function StatusTimeline({
  timeline,
  status,
}: {
  timeline: TimelineEvent[];
  status: ReportStatus;
}) {
  const { t, lang } = useI18n();
  return (
    <ol className="list-none p-0 m-0 max-w-2xl">
      {STATUS_ORDER.map((s) => {
        const event = timeline.find((e) => e.status === s);
        const isCurrent = s === status;
        const reached = event !== undefined;
        const marker = isCurrent ? '●' : reached ? '✓' : '○';
        const markerCls = isCurrent
          ? 'bg-ink text-page border-ink'
          : reached
            ? 'bg-action text-actiontext border-action'
            : 'bg-page text-muted border-border';
        return (
          <li
            key={s}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-start gap-3 py-2"
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 hc-border text-sm font-bold ${markerCls}`}
            >
              {marker}
            </span>
            <span>
              <span
                className={
                  isCurrent ? 'font-bold' : reached ? 'font-medium' : 'text-muted'
                }
              >
                {t(`status.${s}`)}
                {isCurrent && (
                  <span className="ml-2 text-sm font-bold uppercase tracking-wide">
                    ({t('dash.timeline.current')})
                  </span>
                )}
              </span>
              {event ? (
                <span className="block text-sm text-muted">
                  {formatDate(event.at, lang, true)}
                </span>
              ) : (
                <span className="sr-only">{t('dash.timeline.notReached')}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
