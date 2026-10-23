import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'warning' | 'plain';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold ' +
  'min-h-[44px] cursor-pointer select-none transition-[background-color,color,scale] duration-150 ease-out ' +
  '[&:active:not(:disabled)]:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-action text-actiontext hover:bg-actionhover shadow-action',
  secondary: 'bg-fill text-ink border-2 border-capline hover:bg-fillhover',
  warning: 'bg-error text-white hover:opacity-90 shadow-error',
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
