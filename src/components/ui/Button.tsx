import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'warning' | 'plain';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-base font-semibold ' +
  'min-h-[44px] cursor-pointer select-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-action text-actiontext hover:bg-actionhover shadow-[0_2px_0_rgba(0,0,0,0.35)]',
  secondary: 'bg-surface text-ink border-2 border-border hover:bg-page hc-border',
  warning: 'bg-error text-white hover:opacity-90 shadow-[0_2px_0_rgba(0,0,0,0.35)]',
  plain: 'bg-transparent text-link underline underline-offset-4 px-2 py-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', fullWidth, loading, children, className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BASE} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

/** A router link styled as a button (for primary CTAs that navigate). */
export function ButtonLink({ to, variant = 'primary', fullWidth, children, className = '' }: ButtonLinkProps) {
  return (
    <Link to={to} className={`${BASE} no-underline ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {children}
    </Link>
  );
}
