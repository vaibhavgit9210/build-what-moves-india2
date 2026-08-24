/**
 * "Report by chat": conversational intake instead of the form journey.
 *
 * The user tells their story in free text; the intake engine (OpenAI when a
 * key is saved, otherwise the built-in demo parser) extracts category,
 * sentiment, urgency and the real incident-form fields, and the assistant
 * asks only for what is still missing. When everything required is present,
 * "Review and submit" morphs the conversation into a pre-filled, editable
 * form that submits through the same reportService as the classic journey.
 *
 * Anonymous and signed-in modes mirror /report: anonymous reports carry no
 * identity and cannot be tracked.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/state/AuthContext';
import { useDraft } from '@/state/DraftContext';
import { CATEGORIES, categoryById } from '@/content/categories';
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import { PLATFORM_IDS, platformLabelKey } from '@/content/platforms';
import { submitReport } from '@/services/reportService';
import {
  applyAnswer,
  emptyExtraction,
  getOpenAiKey,
  setOpenAiKey,
  nextSlot,
  openaiExtract,
  OPENAI_MODEL,
  type ChatMsg,
  type Extraction,
  type Slot,
} from '@/services/intakeService';
import { loadJSON, saveJSON, removeKey, KEYS } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Checkbox, Select, TextArea, TextInput } from '@/components/ui/Field';
import { Alert, Card, PageTitle } from '@/components/ui/Misc';
import type { DraftReport, ReportMode } from '@/lib/types';

/** Persisted shape (KEYS.chat) so a refresh never loses the conversation. */
export interface ChatIntakeState {
  mode: ReportMode;
  messages: ChatMsg[];
  extraction: Extraction;
  phase: 'chat' | 'form';
}

type Phase = 'gate' | 'chat' | 'morphing' | 'form';

type T = (key: string, params?: Record<string, string | number>) => string;

/** Field definition lookup across every category (for ack lines / labels). */
const FIELD_BY_ID = new Map<string, IncidentField>();
for (const fields of Object.values(incidentFieldsByCategory)) {
  for (const f of fields) if (!FIELD_BY_ID.has(f.id)) FIELD_BY_ID.set(f.id, f);
}

function questionFor(slot: Slot, t: T): string {
  switch (slot.kind) {
    case 'story': return t('chat.q.story');
    case 'story-more': return t('chat.q.storyMore');
    case 'confirm-category':
      return t('chat.q.confirmCategory', { category: t(categoryById(slot.category).labelKey) });
    case 'pick-category': return t('chat.q.pickCategory');
    case 'field': return t('chat.q.field', { label: t(slot.field.labelKey) });
    case 'platforms': return t('chat.q.platforms');
    case 'city': return t('chat.q.city');
    case 'evidence': return t('chat.q.evidence');
    case 'done': return t('chat.q.done');
  }
}

/** Newly-understood items between two extractions, as short display lines. */
function ackItems(prev: Extraction, next: Extraction, t: T): string[] {
  const items: string[] = [];
  for (const [id, v] of Object.entries(next.details)) {
    if (prev.details[id] === v || id.endsWith(':unsure')) continue;
    const baseId = id.endsWith(':note') ? id.slice(0, -':note'.length) : id;
    const f = FIELD_BY_ID.get(baseId);
    let value = v;
    if (f?.type === 'select') {
      const opt = f.options?.find((o) => o.value === v);
      if (opt) value = t(opt.labelKey);
    }
    items.push(`${f ? t(f.labelKey) : baseId}: ${value}`);
  }
  for (const p of next.platforms) {
    if (!prev.platforms.some((q) => q.id === p.id)) items.push(t(platformLabelKey(p.id)));
  }
  if (next.city && next.city !== prev.city) {
    items.push(`${t('chat.panel.place')}: ${next.city}${next.state ? `, ${next.state}` : ''}`);
  }
  return items.slice(0, 4);
}

function loadState(): ChatIntakeState | null {
  return loadJSON<ChatIntakeState | null>(KEYS.chat, null);
}

export default function ChatReport() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { updateDraft } = useDraft();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>(() => {
    const s = loadState();
    return s ? s.phase : 'gate';
  });
  const [mode, setMode] = useState<ReportMode>(() => loadState()?.mode ?? 'anonymous');
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadState()?.messages ?? []);
  const [extraction, setExtraction] = useState<Extraction>(() => loadState()?.extraction ?? emptyExtraction());
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [fellBack, setFellBack] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [hasKey, setHasKey] = useState(() => Boolean(getOpenAiKey()));
  const [confirmed, setConfirmed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const slot = useMemo(() => nextSlot(extraction), [extraction]);
  const anonymous = mode === 'anonymous';

  // Persist the conversation so a refresh never loses it.
  useEffect(() => {
    if (phase === 'gate') return;
    const state: ChatIntakeState = {
      mode,
      messages,
      extraction,
      phase: phase === 'form' ? 'form' : 'chat',
    };
    saveJSON(KEYS.chat, state);
  }, [phase, mode, messages, extraction]);

  // Scroll the message pane only; scrollIntoView would drag the whole page.
  useEffect(() => {
    const pane = paneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [messages, busy]);

  const start = (m: ReportMode) => {
    if (m === 'tracked' && !user) {
      navigate('/login?next=%2Fchat');
      return;
    }
    setMode(m);
    setMessages([{ role: 'assistant', text: t('chat.q.story') }]);
    setExtraction(emptyExtraction());
    setPhase('chat');
  };

  const restart = () => {
    removeKey(KEYS.chat);
    setMessages([]);
    setExtraction(emptyExtraction());
    setConfirmed(false);
    setPhase('gate');
  };

  /** One conversational turn: user text or a tapped quick-reply chip. */
  const advance = async (text: string, quickValue?: string) => {
    if (busy || !text.trim()) return;
    const current = nextSlot(extraction);
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    setFellBack(false);

    let x = applyAnswer(extraction, current, text, quickValue);
    const key = getOpenAiKey();
    if (key && !quickValue) {
      try {
        x = await openaiExtract(key, [...messages, { role: 'user', text }], x);
      } catch {
        setFellBack(true);
      }
    }

    const parts: string[] = [];
    if (extraction.sentiment === 'calm' && x.sentiment !== 'calm') {
      parts.push(t(`chat.empathy.${x.sentiment}`));
    }
    const acked = ackItems(extraction, x, t);
    if (acked.length) parts.push(t('chat.ack', { items: acked.join('; ') }));
    parts.push(questionFor(nextSlot(x), t));

    setExtraction(x);
    setMessages((m) => [...m, { role: 'assistant', text: parts.join(' ') }]);
    setBusy(false);
    inputRef.current?.focus();
  };

  const togglePlatform = (id: string) => {
    setExtraction((x) => {
      const has = x.platforms.some((p) => p.id === id);
      return {
        ...x,
        platforms: has ? x.platforms.filter((p) => p.id !== id) : [...x.platforms, { id }],
      };
    });
  };

  const finishPlatforms = () => {
    if (extraction.platforms.length === 0) return;
    const labels = extraction.platforms.map((p) => t(platformLabelKey(p.id))).join(', ');
    void advance(labels, 'done');
  };

  const beginMorph = () => {
    setPhase('morphing');
    window.setTimeout(() => setPhase('form'), 500);
  };

  const updateDetail = (id: string, value: string) => {
    setExtraction((x) => ({ ...x, details: { ...x.details, [id]: value } }));
  };

  const buildDraft = (): DraftReport => {
    const category = extraction.category ?? 'other';
    let priority = categoryById(category).defaultPriority;
    if (extraction.urgent && priority === 'standard') priority = 'immediate';
    const incidentDetails = Object.fromEntries(
      Object.entries(extraction.details).filter(([, v]) => v !== ''),
    );
    return {
      startedAt: new Date().toISOString(),
      lastPath: '/report/review',
      mode,
      triageSkipped: true,
      consent: {},
      answers: {},
      category,
      priority,
      guidanceAcknowledged: true,
      description: { mode: 'typed', text: extraction.description, language: lang },
      ...(extraction.platforms.length ? { platforms: extraction.platforms } : {}),
      incidentDetails,
      evidence: [],
      ...(extraction.city
        ? {
            location: {
              method: 'manual' as const,
              address: {
                house: '', street: '', locality: '',
                city: extraction.city, district: '',
                state: extraction.state ?? '', pin: '',
              },
            },
          }
        : {}),
    };
  };

  const onSubmit = () => {
    if (!extraction.category) { setFormError(t('chat.form.needCategory')); return; }
    if (!extraction.description.trim()) { setFormError(t('chat.form.needDescription')); return; }
    if (!confirmed) { setFormError(t('dash.review.confirmError')); return; }
    const report = submitReport(buildDraft(), anonymous ? null : user, undefined, lang);
    removeKey(KEYS.chat);
    navigate('/report/success', { state: { reportId: report.id } });
  };

  const openFullForm = () => {
    updateDraft(buildDraft());
    removeKey(KEYS.chat);
    navigate('/report/review');
  };

  /* ------------------------------------------------------------ */
  /* Rendering                                                    */
  /* ------------------------------------------------------------ */

  const providerBadge = hasKey
    ? t('chat.provider.liveBadge', { model: OPENAI_MODEL })
    : t('chat.provider.demoBadge');

  const quickChips = (() => {
    if (busy || phase !== 'chat') return null;
    const chip =
      'rounded-full border-2 border-border hc-border bg-page px-3.5 py-1.5 text-sm font-medium cursor-pointer hover:bg-surface';
    if (slot.kind === 'confirm-category' || slot.kind === 'evidence') {
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} onClick={() => void advance(t('common.yes'), 'yes')}>{t('common.yes')}</button>
          <button type="button" className={chip} onClick={() => void advance(t('common.no'), 'no')}>{t('common.no')}</button>
        </div>
      );
    }
    if (slot.kind === 'pick-category') {
      return (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={chip} onClick={() => void advance(t(c.labelKey), c.id)}>
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      );
    }
    if (slot.kind === 'platforms') {
      return (
        <div className="flex flex-wrap gap-2 items-center">
          {PLATFORM_IDS.map((id) => {
            const active = extraction.platforms.some((p) => p.id === id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                className={`${chip} ${active ? 'border-action bg-infobg font-semibold' : ''}`}
                onClick={() => togglePlatform(id)}
              >
                {t(platformLabelKey(id))}
              </button>
            );
          })}
          <button
            type="button"
            className={`${chip} bg-action text-actiontext border-action`}
            disabled={extraction.platforms.length === 0}
            onClick={finishPlatforms}
          >
            {t('chat.quick.done')}
          </button>
        </div>
      );
    }
    if (slot.kind === 'city') {
      return (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip} onClick={() => void advance(t('chat.quick.skip'), 'skip')}>
            {t('chat.quick.skip')}
          </button>
        </div>
      );
    }
    if (slot.kind === 'field' && slot.field.type === 'select' && slot.field.options) {
      return (
        <div className="flex flex-wrap gap-2">
          {slot.field.options.map((o) => (
            <button key={o.value} type="button" className={chip} onClick={() => void advance(t(o.labelKey), o.value)}>
              {t(o.labelKey)}
            </button>
          ))}
        </div>
      );
    }
    return null;
  })();

  /** Understanding-panel rows; the same order animates into the form. */
  const understood: { key: string; label: string; value: string }[] = (() => {
    const rows: { key: string; label: string; value: string }[] = [];
    if (extraction.category) {
      rows.push({ key: 'category', label: t('chat.panel.category'), value: t(categoryById(extraction.category).labelKey) });
    }
    if (extraction.description) {
      const text = extraction.description.length > 90
        ? `${extraction.description.slice(0, 90)}…`
        : extraction.description;
      rows.push({ key: 'description', label: t('chat.panel.description'), value: text });
    }
    for (const [id, v] of Object.entries(extraction.details)) {
      if (id.endsWith(':unsure') || v === '') continue;
      const baseId = id.endsWith(':note') ? id.slice(0, -':note'.length) : id;
      const f = FIELD_BY_ID.get(baseId);
      let value = v;
      if (f?.type === 'select') {
        const opt = f.options?.find((o) => o.value === v);
        if (opt) value = t(opt.labelKey);
      }
      rows.push({ key: id, label: f ? t(f.labelKey) : baseId, value });
    }
    if (extraction.platforms.length) {
      rows.push({
        key: 'platforms',
        label: t('chat.panel.platforms'),
        value: extraction.platforms.map((p) => t(platformLabelKey(p.id))).join(', '),
      });
    }
    if (extraction.city) {
      rows.push({ key: 'place', label: t('chat.panel.place'), value: `${extraction.city}${extraction.state ? `, ${extraction.state}` : ''}` });
    }
    if (extraction.hasEvidence) {
      rows.push({
        key: 'evidence',
        label: t('chat.panel.evidence'),
        value: extraction.hasEvidence === 'yes' ? t('chat.panel.evidenceYes') : t('chat.panel.evidenceNo'),
      });
    }
    return rows;
  })();

  const showUrgent1930 = extraction.urgent
    && (extraction.category === 'financial-fraud' || extraction.category === 'crypto-fraud');

  if (phase === 'gate') {
    return (
      <div className="max-w-2xl">
        <PageTitle caption={t('chat.caption')}>{t('chat.title')}</PageTitle>
        <p className="text-lg mb-6">{t('chat.intro')}</p>
        <h2 className="text-xl font-bold mb-3">{t('chat.gate.heading')}</h2>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => start('tracked')}
            className="text-left rounded-md border-2 border-border hc-border bg-page p-4 cursor-pointer hover:bg-surface"
          >
            <span className="block font-bold text-lg">{t('chat.gate.signedIn')}</span>
            <span className="block text-muted text-sm mt-0.5">{t('chat.gate.signedInHint')}</span>
            <span className="block text-sm mt-1 font-medium">
              {user ? t('chat.gate.signedInAs', { name: user.name }) : t('chat.gate.loginFirst')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => start('anonymous')}
            className="text-left rounded-md border-2 border-border hc-border bg-page p-4 cursor-pointer hover:bg-surface"
          >
            <span className="block font-bold text-lg">{t('chat.gate.anonymous')}</span>
            <span className="block text-muted text-sm mt-0.5">{t('chat.gate.anonymousHint')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'form') {
    const category = extraction.category ?? 'other';
    const fields = incidentFieldsByCategory[category];
    let row = 0;
    const delay = () => ({ animationDelay: `${Math.min(row++ * 70, 700)}ms` });
    return (
      <div className="max-w-2xl">
        <PageTitle caption={t('chat.caption')}>{t('chat.form.heading')}</PageTitle>
        <p className="text-lg mb-6 chat-row-in" style={delay()}>{t('chat.form.intro')}</p>

        <div className="chat-row-in" style={delay()}>
          <Alert variant="info">
            <p className="m-0">
              {anonymous ? t('chat.form.filingAnonymously') : t('chat.form.filingAs', { name: user?.name ?? '' })}
            </p>
          </Alert>
        </div>

        {showUrgent1930 && (
          <div className="chat-row-in" style={delay()}>
            <Alert variant="warning" title={t('chat.panel.urgent')}>
              <p className="m-0">{t('chat.urgent1930')}</p>
            </Alert>
          </div>
        )}

        <Card className="mb-5">
          <div className="chat-row-in" style={delay()}>
            <Select
              label={t('chat.form.category')}
              value={category}
              onChange={(e) => setExtraction((x) => ({ ...x, category: e.target.value as typeof category }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
              ))}
            </Select>
          </div>
          <div className="chat-row-in" style={delay()}>
            <TextArea
              label={t('chat.form.description')}
              value={extraction.description}
              onChange={(e) => setExtraction((x) => ({ ...x, description: e.target.value }))}
            />
          </div>

          {fields.map((f) => {
            if (f.type === 'platforms') {
              if (!extraction.platforms.length) return null;
              return (
                <div key={f.id} className="mb-5 chat-row-in" style={delay()}>
                  <p className="font-semibold mb-1">{t(f.labelKey)}</p>
                  <p className="m-0">
                    {extraction.platforms.map((p) => t(platformLabelKey(p.id))).join(', ')}
                  </p>
                </div>
              );
            }
            const noteKey = `${f.id}:note`;
            if (extraction.details[noteKey] !== undefined) {
              return (
                <div key={f.id} className="chat-row-in" style={delay()}>
                  <TextInput
                    label={`${t(f.labelKey)} (${t('media.details.reviewApprox')})`}
                    value={extraction.details[noteKey]}
                    onChange={(e) => updateDetail(noteKey, e.target.value)}
                  />
                </div>
              );
            }
            const value = extraction.details[f.id] ?? '';
            if (!value && f.optional) return null;
            // A date/datetime input silently renders blank for values that do
            // not fit its format (e.g. a bare date from the model); fall back
            // to a text input rather than losing the value.
            const inputType =
              f.type === 'number' ? 'number'
              : f.type === 'date' ? (!value || /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'date' : 'text')
              : f.type === 'datetime-local' ? (!value || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? 'datetime-local' : 'text')
              : 'text';
            return (
              <div key={f.id} className="chat-row-in" style={delay()}>
                {f.type === 'select' ? (
                  <Select label={t(f.labelKey)} value={value} onChange={(e) => updateDetail(f.id, e.target.value)}>
                    <option value="" />
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                    ))}
                  </Select>
                ) : f.type === 'textarea' ? (
                  <TextArea label={t(f.labelKey)} rows={3} value={value} onChange={(e) => updateDetail(f.id, e.target.value)} />
                ) : (
                  <TextInput
                    label={t(f.labelKey)}
                    type={inputType}
                    value={value}
                    onChange={(e) => updateDetail(f.id, e.target.value)}
                  />
                )}
              </div>
            );
          })}

          <div className="chat-row-in" style={delay()}>
            <TextInput
              label={t('chat.form.city')}
              value={extraction.city ?? ''}
              onChange={(e) => setExtraction((x) => ({ ...x, city: e.target.value }))}
            />
          </div>
          <div className="chat-row-in" style={delay()}>
            <TextInput
              label={t('chat.form.state')}
              value={extraction.state ?? ''}
              onChange={(e) => setExtraction((x) => ({ ...x, state: e.target.value }))}
            />
          </div>
        </Card>

        {extraction.hasEvidence === 'yes' && (
          <div className="chat-row-in" style={delay()}>
            <Alert variant="info">
              <p className="m-0">{t('chat.form.evidenceReminder')}</p>
            </Alert>
          </div>
        )}

        <div className="chat-row-in" style={delay()}>
          {formError && (
            <Alert variant="error" title={formError} role="alert" />
          )}
          <Checkbox
            label={t('dash.review.confirmLabel')}
            checked={confirmed}
            onChange={(v) => { setConfirmed(v); if (v) setFormError(null); }}
          />
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={onSubmit}>{t('chat.form.submit')}</Button>
            <Button variant="secondary" onClick={openFullForm}>{t('chat.form.openFull')}</Button>
            <Button variant="plain" onClick={() => setPhase('chat')}>{t('chat.form.backToChat')}</Button>
          </div>
        </div>
      </div>
    );
  }

  // phase 'chat' | 'morphing'
  return (
    <div>
      <PageTitle caption={t('chat.caption')}>{t('chat.title')}</PageTitle>

      <div className="md:grid md:grid-cols-[minmax(0,1fr)_290px] md:gap-6 max-w-4xl">
        <div className={`transition-all duration-500 ${phase === 'morphing' ? 'chat-out' : ''}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">{providerBadge}</span>
            <details className="text-sm">
              <summary className="cursor-pointer text-link underline underline-offset-2">
                {t('chat.provider.settings')}
              </summary>
              <div className="border-2 border-border hc-border rounded-md p-3 mt-2 bg-surface max-w-md">
                <p className="text-sm text-muted mt-0 mb-2">{t('chat.provider.privacyNote')}</p>
                <TextInput
                  label={t('chat.provider.keyLabel')}
                  hint={t('chat.provider.keyHint')}
                  type="password"
                  autoComplete="off"
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => { if (keyDraft.trim()) { setOpenAiKey(keyDraft.trim()); setHasKey(true); setKeyDraft(''); } }}
                  >
                    {t('chat.provider.save')}
                  </Button>
                  {hasKey && (
                    <Button variant="plain" onClick={() => { setOpenAiKey(null); setHasKey(false); }}>
                      {t('chat.provider.remove')}
                    </Button>
                  )}
                </div>
              </div>
            </details>
            <Button variant="plain" onClick={restart} className="text-sm">{t('chat.restart')}</Button>
          </div>

          {showUrgent1930 && (
            <Alert variant="warning" title={t('chat.panel.urgent')}>
              <p className="m-0">{t('chat.urgent1930')}</p>
            </Alert>
          )}

          <section
            aria-label={t('chat.chatRegion')}
            className="border-2 border-border hc-border rounded-md bg-page"
          >
            <div ref={paneRef} aria-live="polite" className="p-4 flex flex-col gap-3 min-h-64 max-h-[26rem] overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chat-msg-in max-w-[85%] rounded-md px-3.5 py-2.5 ${
                    m.role === 'user'
                      ? 'self-end bg-action text-actiontext'
                      : 'self-start bg-surface border border-border'
                  }`}
                >
                  <span className="sr-only">
                    {m.role === 'user' ? t('chat.inputLabel') : t('app.name')}:{' '}
                  </span>
                  <span className="whitespace-pre-wrap">{m.text}</span>
                </div>
              ))}
              {busy && (
                <div className="self-start bg-surface border border-border rounded-md px-4 py-3" aria-label={t('chat.typing')}>
                  <span className="typing-dot inline-block h-2 w-2 rounded-full bg-muted mr-1" />
                  <span className="typing-dot inline-block h-2 w-2 rounded-full bg-muted mr-1" />
                  <span className="typing-dot inline-block h-2 w-2 rounded-full bg-muted" />
                </div>
              )}
              {fellBack && (
                <p className="text-xs text-muted m-0">{t('chat.provider.turnFellBack')}</p>
              )}
            </div>

            <div className="border-t border-border p-3">
              {quickChips && <div className="mb-3">{quickChips}</div>}

              {slot.kind === 'done' ? (
                <Button onClick={beginMorph} fullWidth className="sm:w-auto">
                  {t('chat.reviewCta')}
                </Button>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); void advance(input); }}
                  className="flex items-end gap-2"
                >
                  <label className="flex-1">
                    <span className="sr-only">{t('chat.inputLabel')}</span>
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void advance(input);
                        }
                      }}
                      aria-label={t('chat.inputLabel')}
                      placeholder={t('chat.inputHint')}
                      className="block w-full rounded-sm border-2 border-ink/60 bg-page px-3 py-2 text-base hc-border"
                    />
                  </label>
                  <Button type="submit" loading={busy}>{t('chat.send')}</Button>
                </form>
              )}
            </div>
          </section>
        </div>

        <aside
          aria-label={t('chat.panel.heading')}
          className={`mt-6 md:mt-0 transition-all duration-500 ${phase === 'morphing' ? 'md:scale-[1.03]' : ''}`}
        >
          <div className="border-2 border-border hc-border rounded-md bg-surface p-4 md:sticky md:top-4">
            <h2 className="text-base font-bold mt-0 mb-3">{t('chat.panel.heading')}</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="rounded-full border border-border bg-page px-2.5 py-0.5 text-xs font-semibold">
                {t('chat.panel.tone')}: {t(`chat.sentiments.${extraction.sentiment}`)}
              </span>
              {extraction.urgent && (
                <span className="rounded-full border border-warn bg-warnbg px-2.5 py-0.5 text-xs font-semibold">
                  {t('chat.panel.urgent')}
                </span>
              )}
            </div>
            {understood.length === 0 ? (
              <p className="text-sm text-muted m-0">{t('chat.panel.empty')}</p>
            ) : (
              <dl className="m-0">
                {understood.map((row, i) => (
                  <div
                    key={row.key}
                    className="chat-msg-in border-b border-border last:border-b-0 py-1.5"
                    style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
                  >
                    <dt className="text-xs uppercase tracking-wide text-muted font-semibold">{row.label}</dt>
                    <dd className="m-0 text-sm font-medium break-words">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
