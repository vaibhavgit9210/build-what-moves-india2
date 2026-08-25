/**
 * Layout route for everything under #/admin. Same design language as the
 * citizen shell (white chrome, navy actions, skip link, 44px targets), with a
 * different header so an officer always knows which side of the product they
 * are on. Unauthenticated visits bounce to the admin sign-in page.
 */
import { useEffect, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LANGS, useI18n } from '@/i18n';
import { useAdminAuth } from '@/state/AdminAuthContext';
import { rankKeyOf } from '@/content/authorityRoster';
import type { Lang } from '@/lib/types';

export default function AdminShell() {
  const { t, lang, setLang } = useI18n();
  const { authority, logout } = useAdminAuth();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  const onLogin = pathname === '/admin/login';
  if (!authority && !onLogin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-focus focus:text-focustext focus:px-4 focus:py-2 focus:font-bold"
      >
        {t('app.skipToContent')}
      </a>
      <p className="bg-surface text-ink text-xs px-4 py-1.5 border-b border-border m-0 no-print">
        <span className="mx-auto max-w-5xl block">{t('admin.banner')}</span>
      </p>

      <header className="bg-page text-ink border-b-4 border-brand no-print">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={authority ? '/admin/tickets' : '/admin/login'}
            className="flex items-center gap-2.5 no-underline text-ink shrink-0"
          >
            <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand">
              <path d="M12 2.5 4 6v6c0 5 3.4 8.3 8 9.5 4.6-1.2 8-4.5 8-9.5V6l-8-3.5z" />
              <path d="M9 12.2l2.2 2.2L15.5 10" />
            </svg>
            <span className="leading-tight">
              <span className="block font-bold text-lg">{t('app.name')}</span>
              <span className="block text-xs text-muted">
                {t('admin.areaName')} · <span className="font-semibold">{t('admin.areaTag')}</span>
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-ink text-sm">
              <span className="sr-only">{t('nav.language')}</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-page text-ink border border-border rounded-sm px-1.5 py-1 text-sm cursor-pointer min-h-[36px]"
                aria-label={t('nav.language')}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </label>
            <Link
              to="/"
              className="text-ink text-sm font-semibold border border-border rounded-sm px-2.5 py-1.5 no-underline hover:bg-surface"
            >
              {t('admin.backToCitizen')}
            </Link>
            {authority && (
              <>
                <span className="text-sm text-muted">
                  {t('admin.signedInAs')}{' '}
                  <span className="font-semibold text-ink">{authority.name}</span> ·{' '}
                  {t(rankKeyOf(authority))}
                </span>
                <button
                  onClick={logout}
                  className="text-ink text-sm font-semibold border border-border rounded-sm px-2.5 py-1.5 hover:bg-surface cursor-pointer min-h-[36px]"
                >
                  {t('admin.signOut')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto max-w-5xl px-4 py-8 w-full">
          <Outlet />
        </div>
      </main>

      <footer className="mt-16 border-t-8 border-brand bg-surface no-print">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-sm text-muted max-w-3xl m-0">{t('footer.disclaimer')}</p>
        </div>
      </footer>
    </div>
  );
}
