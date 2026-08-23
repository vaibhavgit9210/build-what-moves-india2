/**
 * Persistent "Need help?" affordance for the report journey: a floating
 * button opening a dialog with (1) a short FAQ specific to the current step
 * and (2) a stateless assistant for open-ended process questions. The
 * assistant never sees the draft: only the typed question and UI language
 * leave this panel (see services/helpService).
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { groupOf } from '@/lib/steps';
import { askHelp } from '@/services/helpService';
import { HELP_ENDPOINT } from '@/services/helpService';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Field';
import { Alert, Modal } from '@/components/ui/Misc';

const FAQ_IDS = [1, 2, 3] as const;

interface Exchange {
  q: string;
  a: string;
  demo: boolean;
}

export default function HelpPanel() {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  const group = groupOf(pathname) ?? 'generic';

  const ask = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    try {
      const res = await askHelp(q, lang);
      const a = res.provider === 'demo' ? t(`helpPanel.demo.${res.text}`) : res.text;
      setExchanges((x) => [...x, { q, a, demo: res.provider === 'demo' }]);
      setQuestion('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="fixed bottom-4 right-4 z-40 rounded-sm bg-brand text-brandtext font-semibold px-5 py-3 min-h-[44px] shadow-md border border-brand hc-border cursor-pointer hover:bg-actionhover"
      >
        {t('helpPanel.button')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('helpPanel.title')}>
        <h3 className="text-base font-bold mb-2">{t('helpPanel.faqHeading')}</h3>
        <ul className="list-none p-0 m-0 mb-5 border-t border-border">
          {FAQ_IDS.map((n) => {
            const expanded = openFaq === n;
            return (
              <li key={n} className="border-b border-border">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`help-faq-${n}`}
                  onClick={() => setOpenFaq(expanded ? null : n)}
                  className="w-full text-left py-2.5 font-medium cursor-pointer flex justify-between gap-3 hover:bg-surface"
                >
                  {t(`helpPanel.faq.${group}.q${n}`)}
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                <div id={`help-faq-${n}`} role="region" hidden={!expanded} className="pb-3 text-muted">
                  {t(`helpPanel.faq.${group}.a${n}`)}
                </div>
              </li>
            );
          })}
        </ul>

        <h3 className="text-base font-bold mb-2">{t('helpPanel.assistant.heading')}</h3>
        <Alert variant="info">
          <p className="m-0 text-sm">{t('helpPanel.assistant.privacyNote')}</p>
        </Alert>
        <p className="text-sm text-muted mb-3">
          {HELP_ENDPOINT
            ? t('helpPanel.assistant.aiNote')
            : `${t('common.demoData')}: ${t('helpPanel.assistant.demoNote')}`}
        </p>

        <div aria-live="polite">
          {exchanges.map((x, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold mb-1">
                {t('helpPanel.assistant.youAsked')}: {x.q}
              </p>
              <p className="m-0 bg-surface rounded-md p-3">
                {x.demo && (
                  <span className="block text-xs font-bold uppercase tracking-wide text-muted mb-1">
                    {t('helpPanel.assistant.demoTag')}
                  </span>
                )}
                {x.a}
              </p>
            </div>
          ))}
          {busy && <p className="text-muted">{t('helpPanel.assistant.thinking')}</p>}
        </div>

        <TextArea
          label={t('helpPanel.assistant.inputLabel')}
          hint={t('helpPanel.assistant.inputHint')}
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button onClick={() => void ask()} loading={busy} variant="secondary">
          {t('helpPanel.assistant.ask')}
        </Button>
      </Modal>
    </>
  );
}
