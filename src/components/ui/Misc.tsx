/** Small shared pieces: alerts, cards, page titles, progress, spinner, modal. */
import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useDraft } from '@/state/DraftContext';
import { stepGroups, groupOf, firstPathOfGroup } from '@/lib/steps';

type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'emergency';

const ALERT_STYLES: Record<AlertVariant, string> = {
  info: 'border-info bg-infobg',
  success: 'border-success bg-successbg',
  warning: 'border-warn bg-warnbg',
  error: 'border-error bg-errorbg',
  emergency: 'border-error bg-errorbg',
};

export function Alert({
  variant = 'info', title, children, role,
}: {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  role?: 'alert' | 'status';
}) {
  return (
    <div
      role={role ?? (variant === 'error' ? 'alert' : undefined)}
      className={`border-l-8 hc-border rounded-r-md p-4 mb-5 max-w-2xl ${ALERT_STYLES[variant]}`}
    >
      {title && <p className="font-bold text-lg mb-1">{title}</p>}
      {children && <div className="text-base [&_a]:font-medium">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border-2 border-border hc-border bg-page p-5 ${className}`}>{children}</div>;
}

/** Sets document.title and renders the page's single h1. */
export function PageTitle({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const text = ref.current?.textContent ?? '';
    document.title = `${text} · ${t('app.name')} (${t('app.prototypeTag')})`;
  });
  return (
    <div className="mb-6">
      {caption && <p className="text-muted font-semibold uppercase tracking-wide text-sm mb-1">{caption}</p>}
      <h1 ref={ref} className="text-3xl sm:text-4xl font-bold leading-tight">
        {children}
      </h1>
    </div>
  );
}

/**
 * The "Your report" progress indicator. Reads the current route and draft
 * mode. Completed steps are links, so the keyboard can jump back without
 * losing anything (the draft persists every answer). On small screens the
 * labels of other steps collapse away, leaving the numbers plus the
 * "Step N of M: label" line.
 */
export function ProgressSteps() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { draft } = useDraft();
  const anonymous = draft?.mode === 'anonymous';
  const groups = stepGroups(anonymous);
  const current = groupOf(pathname);
  const currentIdx = groups.findIndex((g) => g.id === current);
  if (currentIdx < 0) return null;
  return (
    <nav aria-label={t('steps.heading')} className="mb-6">
      <p className="text-sm text-muted font-semibold mb-2">
        {t('steps.stepOf', { current: currentIdx + 1, total: groups.length })}
        <span className="sm:hidden">: {t(groups[currentIdx].labelKey)}</span>
      </p>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-sm sm:text-base p-0 m-0 list-none">
        {groups.map((g, i) => {
          const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo';
          const backTo = state === 'done' ? firstPathOfGroup(g.id, anonymous) : null;
          const circle = (
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border-2 hc-border ${
                state === 'done'
                  ? 'bg-action text-actiontext border-action'
                  : state === 'current'
                    ? 'bg-ink text-page border-ink'
                    : 'bg-page text-muted border-border'
              }`}
            >
              {state === 'done' ? '✓' : i + 1}
            </span>
          );
          const label = (
            <span
              className={`${state === 'current' ? 'font-bold' : state === 'done' ? '' : 'text-muted'} ${
                state === 'current' ? '' : 'hidden sm:inline'
              }`}
            >
              {t(g.labelKey)}
            </span>
          );
          return (
            <li
              key={g.id}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex items-center gap-1.5"
            >
              {backTo ? (
                <Link
                  to={backTo}
                  aria-label={t('steps.goTo', { label: t(g.labelKey) })}
                  className="flex items-center gap-1.5 text-ink hover:underline underline-offset-2"
                >
                  {circle}
                  {label}
                </Link>
              ) : (
                <>
                  {circle}
                  {label}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <p role="status" className="flex items-center gap-3 text-muted py-6">
      <span
        aria-hidden="true"
        className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-current border-t-transparent"
      />
      {label ?? t('common.loading')}
    </p>
  );
}

/** Accessible modal on the native <dialog> element. */
export function Modal({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="modal-title"
      className="rounded-md border-2 border-ink p-0 w-[min(92vw,560px)] m-auto"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-2xl leading-none px-2 py-1 rounded hover:bg-surface cursor-pointer"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/**
 * GOV.UK-style error summary shown at the top of an invalid form. Each item
 * is a link-style button that moves focus to the matching invalid control
 * (fields flag themselves with aria-invalid, in the same order the page
 * validates them).
 */
export function ErrorSummary({ errors }: { errors: string[] }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [errors]);
  if (!errors.length) return null;

  const focusInvalid = (i: number) => {
    const nodes = document.querySelectorAll<HTMLElement>('[aria-invalid="true"]');
    if (nodes.length === 0) return;
    const target = nodes[Math.min(i, nodes.length - 1)];
    target.focus();
    target.scrollIntoView({ block: 'center' });
  };

  return (
    <div ref={ref} tabIndex={-1} role="alert" className="border-4 border-error p-4 mb-6 max-w-2xl rounded-md">
      <h2 className="text-lg font-bold text-error mb-2">{t('errors.formHasErrors')}</h2>
      <ul className="list-disc pl-5">
        {errors.map((e, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => focusInvalid(i)}
              className="text-error font-medium underline underline-offset-2 text-left cursor-pointer"
            >
              {e}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
