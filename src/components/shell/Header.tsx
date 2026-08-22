import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LANGS, useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { useSettings } from '@/state/SettingsContext';
import { useDraft } from '@/state/DraftContext';
import { Modal } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import type { Lang } from '@/lib/types';

function navClass({ isActive }: { isActive: boolean }) {
  return (
    'block px-3 py-2 rounded-sm font-medium no-underline text-brandtext hover:bg-white/10 ' +
    (isActive ? 'border-b-4 border-focus font-bold' : 'border-b-4 border-transparent')
  );
}

function AccessibilityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { settings, update } = useSettings();

  const group = (
    legend: string,
    name: 'textSize' | 'contrast' | 'motion',
    opts: { v: string; label: string }[],
  ) => (
    <fieldset className="mb-5 border-0 p-0">
      <legend className="font-bold mb-2">{legend}</legend>
      <div className="flex flex-col gap-1.5">
        {opts.map((o) => (
          <label key={o.v} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-surface">
            <input
              type="radio"
              name={name}
              className="h-5 w-5 accent-[var(--tok-action)]"
              checked={settings[name] === o.v}
              onChange={() => update({ [name]: o.v } as never)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <Modal open={open} onClose={onClose} title={t('a11y.title')}>
      <p className="text-muted mb-4">{t('a11y.intro')}</p>
      {group(t('a11y.textSize'), 'textSize', [
        { v: 'small', label: t('a11y.textSmall') },
        { v: 'normal', label: t('a11y.textNormal') },
        { v: 'large', label: t('a11y.textLarge') },
      ])}
      {group(t('a11y.contrast'), 'contrast', [
        { v: 'standard', label: t('a11y.contrastStandard') },
        { v: 'high', label: t('a11y.contrastHigh') },
      ])}
      {group(t('a11y.motion'), 'motion', [
        { v: 'standard', label: t('a11y.motionStandard') },
        { v: 'reduced', label: t('a11y.motionReduced') },
      ])}
      <Button onClick={onClose}>{t('a11y.done')}</Button>
    </Modal>
  );
}

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const { clearDraft } = useDraft();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acctOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAcctOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [acctOpen]);

  const links = user
    ? [
        { to: '/report', label: t('nav.report') },
        { to: '/dashboard', label: t('nav.myReports') },
        { to: '/help', label: t('nav.help') },
      ]
    : [
        { to: '/report', label: t('nav.report') },
        { to: '/track', label: t('nav.track') },
        { to: '/help', label: t('nav.help') },
        { to: '/safety', label: t('nav.safety') },
      ];

  const utilities = (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="flex items-center gap-1.5 text-brandtext text-sm">
        <span className="sr-only">{t('nav.language')}</span>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="bg-brand text-brandtext border border-white/40 rounded-sm px-1.5 py-1 text-sm cursor-pointer"
          aria-label={t('nav.language')}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={() => setA11yOpen(true)}
        className="text-brandtext text-sm border border-white/40 rounded-sm px-2.5 py-1.5 hover:bg-white/10 cursor-pointer"
      >
        {t('nav.accessibility')}
      </button>
      {user ? (
        <div className="relative" ref={acctRef}>
          <button
            onClick={() => setAcctOpen((v) => !v)}
            aria-expanded={acctOpen}
            className="text-brandtext text-sm font-semibold border border-white/40 rounded-sm px-2.5 py-1.5 hover:bg-white/10 cursor-pointer"
          >
            {user.name.split(' ')[0]} ▾
          </button>
          {acctOpen && (
            <div className="absolute right-0 top-full mt-1 z-40 bg-page text-ink border-2 border-border rounded-md shadow-lg min-w-44 py-1">
              <Link to="/profile" onClick={() => setAcctOpen(false)} className="block px-4 py-2 no-underline text-ink hover:bg-surface">
                {t('nav.profile')}
              </Link>
              <Link to="/settings" onClick={() => setAcctOpen(false)} className="block px-4 py-2 no-underline text-ink hover:bg-surface">
                {t('nav.settings')}
              </Link>
              <button
                onClick={() => {
                  setAcctOpen(false);
                  clearDraft();
                  logout();
                  navigate('/');
                }}
                className="block w-full text-left px-4 py-2 hover:bg-surface cursor-pointer"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="text-brandtext text-sm font-semibold border border-white/40 rounded-sm px-2.5 py-1.5 no-underline hover:bg-white/10">
          {t('nav.login')}
        </Link>
      )}
    </div>
  );

  return (
    <header className="bg-brand text-brandtext border-b-4 border-saffron">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-2.5 no-underline text-brandtext shrink-0">
            <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2.5 4 6v6c0 5 3.4 8.3 8 9.5 4.6-1.2 8-4.5 8-9.5V6l-8-3.5z" />
              <path d="M9 12.2l2.2 2.2L15.5 10" />
            </svg>
            <span className="leading-tight">
              <span className="block font-bold text-lg">{t('app.name')}</span>
              <span className="block text-xs opacity-90">
                {t('app.tagline')} · <span className="bg-saffron text-white font-bold px-1 rounded-sm">{t('app.prototypeTag')}</span>
              </span>
            </span>
          </Link>

          <div className="hidden md:block">{utilities}</div>

          <button
            className="md:hidden text-brandtext border border-white/50 rounded-sm px-3 py-2 font-semibold cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? t('nav.closeMenu') : t('nav.menu')}
          </button>
        </div>

        <nav aria-label={t('nav.primaryNav')} className="hidden md:flex gap-1 pb-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" aria-label={t('nav.primaryNav')} className="md:hidden border-t border-white/20 px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass} onClick={() => setMenuOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/profile" className={navClass} onClick={() => setMenuOpen(false)}>
              {t('nav.profile')}
            </NavLink>
          )}
          <div className="pt-3 border-t border-white/20 mt-2">{utilities}</div>
        </nav>
      )}

      <AccessibilityPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />
    </header>
  );
}
