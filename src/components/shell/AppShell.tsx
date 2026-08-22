/** Layout route: skip link, demo banner, header, main outlet, footer.
 * Also moves focus to <main> on route change for screen-reader users. */
import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Header } from './Header';

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t-8 border-brand bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav aria-label={t('footer.help')} className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          <Link to="/help" className="text-ink">{t('footer.help')}</Link>
          <Link to="/safety" className="text-ink">{t('footer.safety')}</Link>
          <Link to="/privacy" className="text-ink">{t('footer.privacy')}</Link>
          <Link to="/accessibility" className="text-ink">{t('footer.accessibilityStatement')}</Link>
        </nav>
        <p className="text-sm text-muted max-w-3xl">{t('footer.disclaimer')}</p>
        <p className="text-sm text-muted mt-2">{t('footer.builtNote')}</p>
      </div>
    </footer>
  );
}

export default function AppShell() {
  const { t } = useI18n();
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

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-focus focus:text-focustext focus:px-4 focus:py-2 focus:font-bold"
      >
        {t('app.skipToContent')}
      </a>
      <p className="bg-focus text-focustext text-center text-sm font-bold px-3 py-1.5">
        {t('app.demoBanner')}
      </p>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto max-w-5xl px-4 py-8 w-full">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
