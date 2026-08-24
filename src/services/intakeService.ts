/**
 * Chat-intake engine for the "Report by chat" journey.
 *
 * One extraction pass runs after every user message and fills a structured
 * Extraction (category, sentiment, urgency, incident fields, platforms,
 * city/state). The QUESTIONS the assistant asks are always chosen by the
 * deterministic slot policy in nextSlot(), so the conversation is identical
 * and testable whichever brain extracted the answers.
 *
 * Two extraction providers:
 *  - 'openai': OpenAI Chat Completions (gpt-4o-mini, JSON mode) with a key
 *    the user pastes on the chat page. The key lives in this browser's
 *    localStorage only and is sent only to api.openai.com.
 *  - 'demo':   a built-in rule parser (amounts, UPI ids, phones, platforms,
 *    date phrases, category and sentiment keywords) so the prototype works
 *    fully offline. Clearly labeled in the UI.
 */
import { incidentFieldsByCategory, type IncidentField } from '@/content/incidentFields';
import { CATEGORIES } from '@/content/categories';
import { PLATFORM_IDS } from '@/content/platforms';
import { loadJSON, saveJSON, removeKey, KEYS } from '@/lib/storage';
import type { CategoryId, PlatformEntry } from '@/lib/types';

export type Sentiment = 'distressed' | 'anxious' | 'angry' | 'calm';
export type IntakeProvider = 'openai' | 'demo';

export const OPENAI_MODEL = 'gpt-4o-mini';

export interface ChatMsg {
  role: 'assistant' | 'user';
  text: string;
}

export interface Extraction {
  category?: CategoryId;
  /** The user said yes to "did I get the category right?". */
  categoryConfirmed: boolean;
  sentiment: Sentiment;
  urgent: boolean;
  /** The victim's own story (first free-text message, plus additions). */
  description: string;
  /** Keyed by the real incident-form field ids (ff-amount, ph-sender, …). */
  details: Record<string, string>;
  platforms: PlatformEntry[];
  city?: string;
  state?: string;
  citySkipped?: boolean;
  hasEvidence?: 'yes' | 'no';
}

export function emptyExtraction(): Extraction {
  return {
    categoryConfirmed: false,
    sentiment: 'calm',
    urgent: false,
    description: '',
    details: {},
    platforms: [],
  };
}

/* ------------------------------------------------------------------ */
/* Slot policy: what the assistant asks next                          */
/* ------------------------------------------------------------------ */

export type Slot =
  | { kind: 'story' }
  | { kind: 'story-more' }
  | { kind: 'confirm-category'; category: CategoryId }
  | { kind: 'pick-category' }
  | { kind: 'platforms'; field: IncidentField }
  | { kind: 'field'; field: IncidentField }
  | { kind: 'city' }
  | { kind: 'evidence' }
  | { kind: 'done' };

/** Required = the category's non-optional fields (same rule as the form). */
function missingFields(x: Extraction): IncidentField[] {
  if (!x.category) return [];
  return incidentFieldsByCategory[x.category].filter((f) => {
    if (f.optional) return false;
    if (f.type === 'platforms') return x.platforms.length === 0;
    return !x.details[f.id] && !x.details[`${f.id}:note`];
  });
}

export function nextSlot(x: Extraction): Slot {
  if (!x.description.trim()) return { kind: 'story' };
  if (x.description.trim().length < 25) return { kind: 'story-more' };
  if (!x.category) return { kind: 'pick-category' };
  if (!x.categoryConfirmed) return { kind: 'confirm-category', category: x.category };
  const missing = missingFields(x)[0];
  if (missing) {
    return missing.type === 'platforms'
      ? { kind: 'platforms', field: missing }
      : { kind: 'field', field: missing };
  }
  if (!x.city && !x.citySkipped) return { kind: 'city' };
  if (!x.hasEvidence) return { kind: 'evidence' };
  return { kind: 'done' };
}

/* ------------------------------------------------------------------ */
/* Demo brain: rule-based extraction                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_KEYWORDS: { id: CategoryId; words: RegExp }[] = [
  { id: 'sensitive-content', words: /private (photo|video|picture)|nude|morph|intimate|viral (photo|video)|निजी (फोटो|तस्वीर|वीडियो)|अश्लील/i },
  { id: 'ransomware', words: /ransom|files?[^.\n]{0,24}(locked|encrypted)|decrypt|फिरौती/i },
  { id: 'crypto-fraud', words: /crypto|bitcoin|btc|usdt|binance|ethereum|क्रिप्टो|बिटकॉइन/i },
  { id: 'identity-theft', words: /aadhaar|pan card|sim (card|swap)|identity (theft|stolen)|documents? misused|आधार|पैन/i },
  { id: 'account-hacking', words: /hack|password (changed|stolen)|locked out|can'?t log ?in|account (taken|stolen|compromised)|हैक|पासवर्ड/i },
  { id: 'impersonation', words: /fake (profile|account)|impersonat|pretending to be|someone is using my (name|photo)|नकली (प्रोफ|खात)/i },
  { id: 'harassment', words: /harass|threat|blackmail|stalk|abus(e|ive)|bully|extort|धमकी|ब्लैकमेल|पीछा|परेशान कर/i },
  { id: 'phishing', words: /phish|suspicious (link|sms|email)|fake (message|sms|email|website|call)|kyc|lottery|prize|clicked (a|the) link|लिंक|इनाम|लॉटरी/i },
  { id: 'financial-fraud', words: /otp|upi|bank|debit|credit|money|paisa|rupee|₹|rs\.?\s?\d|refund|transaction|payment|scam|fraud|cheat|पैसे|बैंक|ठग|धोखा/i },
];

const SENTIMENT_RULES: { s: Sentiment; words: RegExp }[] = [
  { s: 'distressed', words: /scared|afraid|terrified|crying|panic|helpless|hopeless|can'?t sleep|suicid|डर|रो रह|घबरा|बेबस/i },
  { s: 'angry', words: /angry|furious|disgust|outrage|गुस्सा|नाराज़/i },
  { s: 'anxious', words: /worried|anxious|nervous|tension|stressed|what (do|should) i do|चिंता|टेंशन|क्या करूं/i },
];

const URGENT_WORDS = /just now|minutes? ago|an hour ago|right now|today|इसी वक़्त|अभी|आज ही/i;

const PLATFORM_WORDS: { id: string; words: RegExp }[] = [
  { id: 'whatsapp', words: /whats?app|वॉट्सऐप|व्हाट्सएप/i },
  { id: 'instagram', words: /instagram|insta\b|इंस्टाग्राम/i },
  { id: 'facebook', words: /facebook|fb\b|फेसबुक/i },
  { id: 'x', words: /twitter|\bx\.com\b|ट्विटर/i },
  { id: 'telegram', words: /telegram|टेलीग्राम/i },
  { id: 'youtube', words: /youtube|यूट्यूब/i },
  { id: 'email', words: /e-?mail|gmail|ईमेल/i },
  { id: 'sms', words: /\bsms\b|text message|एसएमएस/i },
  { id: 'website', words: /website|web ?site|\bsite\b|वेबसाइट/i },
];

/** "₹20,000", "rs 20000", "20k", "2 lakh", "20 हज़ार" → rupees. */
export function parseAmount(text: string): string | null {
  const lakh = text.match(/([\d.]+)\s*(lakh|lac|लाख)/i);
  if (lakh) return String(Math.round(parseFloat(lakh[1]) * 100000));
  const thousand = text.match(/([\d.]+)\s*(k\b|thousand|हज़ार|हजार)/i);
  if (thousand) return String(Math.round(parseFloat(thousand[1]) * 1000));
  const cur = text.match(/(?:₹|rs\.?|inr|rupees?|रुपये|रु\.)\s*([\d,]+(?:\.\d+)?)/i)
    ?? text.match(/([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees?|रुपये)/i);
  if (cur) {
    const n = Number(cur[1].replace(/,/g, ''));
    if (Number.isFinite(n) && n > 0) return String(n);
  }
  return null;
}

/** UPI handle = user@suffix where the suffix has no dot (not an email). */
function parseUpi(text: string): string | null {
  const m = text.match(/\b([a-z0-9][\w.-]{1,}@[a-z]{2,})\b/i);
  if (m && !/@[a-z0-9-]+\./i.test(m[0])) return m[1];
  return null;
}

function parseEmail(text: string): string | null {
  const m = text.match(/\b[\w.+-]+@[a-z0-9-]+\.[a-z.]{2,}\b/i);
  return m ? m[0] : null;
}

function parsePhone(text: string): string | null {
  const m = text.match(/(?:\+91[\s-]?)?([6-9]\d{9})\b/);
  return m ? m[1] : null;
}

function parseTxn(text: string): string | null {
  const m = text.match(/\b(?:utr|txn|ref|upi)[-:\s]*([A-Z0-9-]{8,})\b/i) ?? text.match(/\b(\d{12})\b/);
  return m ? m[1] : null;
}

/**
 * "yesterday", "आज", "21/08/2026" → an ISO date when explicit, otherwise a
 * "roughly when" note. `phrase` is the matched wording, used as the note for
 * datetime fields where a bare date would claim a time we do not know.
 */
export function parseWhen(text: string): { iso?: string; note?: string; phrase?: string } | null {
  const explicit = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  if (explicit) {
    const [, d, m, y] = explicit;
    return { iso: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, phrase: explicit[0] };
  }
  const rel = text.match(/day before yesterday|परसों/i)
    ?? text.match(/yesterday(\s+(morning|afternoon|evening|night))?|कल/i)
    ?? text.match(/today|this (morning|afternoon|evening)|just now|आज|अभी/i);
  if (rel) {
    const offset = /day before|परसों/i.test(rel[0]) ? 2 : /yesterday|कल/i.test(rel[0]) ? 1 : 0;
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return { iso: d.toISOString().slice(0, 10), phrase: rel[0] };
  }
  const rough = text.match(/last (week|month)|a (week|month) ago|पिछले (हफ़्ते|हफ्ते|महीने)/i);
  if (rough) {
    return { note: /week|हफ़्ते|हफ्ते/i.test(rough[0]) ? 'about a week ago' : 'about a month ago', phrase: rough[0] };
  }
  return null;
}

/**
 * Store a parsed "when" against a field, honestly: date fields take the ISO
 * date; datetime fields go through the form's unsure/note mechanism instead
 * of inventing a time of day.
 */
function storeWhen(details: Record<string, string>, fieldId: string, when: { iso?: string; note?: string; phrase?: string }): void {
  const field = Object.values(incidentFieldsByCategory).flat().find((f) => f.id === fieldId);
  if (when.iso && field?.type === 'date') {
    details[fieldId] = when.iso;
    return;
  }
  const note = when.note ?? when.phrase ?? when.iso;
  if (!note) return;
  details[`${fieldId}:unsure`] = 'yes';
  details[`${fieldId}:note`] = note;
}

function detectCategory(text: string): CategoryId | null {
  const hasAmount = parseAmount(text) !== null;
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.words.test(text)) {
      // Money actually moved → financial fraud beats phishing wording.
      if (rule.id === 'phishing' && hasAmount) return 'financial-fraud';
      return rule.id;
    }
  }
  return hasAmount ? 'financial-fraud' : null;
}

function detectPlatforms(text: string): PlatformEntry[] {
  return PLATFORM_WORDS.filter((p) => p.words.test(text)).map((p) => ({ id: p.id }));
}

/**
 * Field ids the neutral captures (amount, upi, phone, txn, when) map to,
 * per category. Only listed ids are filled.
 */
const POOL_TARGETS: Partial<Record<CategoryId, { amount?: string; upi?: string; phone?: string; txn?: string; when?: string; contact?: string }>> = {
  'financial-fraud': { amount: 'ff-amount', upi: 'ff-upi', phone: 'ff-phone', txn: 'ff-txn', when: 'ff-when' },
  'crypto-fraud': { amount: 'cf-amount', txn: 'cf-txn' },
  phishing: { contact: 'ph-sender' },
  'account-hacking': { when: 'ah-noticed' },
  ransomware: { when: 'rw-when' },
};

/** Select-option synonyms so a typed answer can hit select fields too. */
const SELECT_WORDS: Record<string, RegExp> = {
  upi: /upi|gpay|google pay|phonepe|paytm|यूपीआई/i,
  card: /card|debit|credit|कार्ड/i,
  'net-banking': /net ?banking|netbank|नेट ?बैंकिंग/i,
  wallet: /wallet|वॉलेट/i,
  sms: /sms|text|एसएमएस/i,
  email: /e-?mail|ईमेल/i,
  call: /call|phone call|कॉल/i,
  whatsapp: /whats?app|वॉट्सऐप/i,
  yes: /^(yes|yeah|yep|haan|ha|हाँ|हां|जी)\b/i,
  no: /^(no|nope|nahi|नहीं|ना)\b/i,
  partially: /partial|some|थोड़/i,
};

/**
 * Opportunistic pass over ANY user message: pull out whatever is present so
 * the assistant never asks for something the user already said.
 */
function absorb(text: string, x: Extraction): Extraction {
  const out: Extraction = { ...x, details: { ...x.details }, platforms: [...x.platforms] };

  for (const rule of SENTIMENT_RULES) {
    if (out.sentiment === 'calm' && rule.words.test(text)) out.sentiment = rule.s;
  }
  if (URGENT_WORDS.test(text) && parseAmount(text)) out.urgent = true;

  if (!out.category) {
    const cat = detectCategory(text);
    if (cat) out.category = cat;
  }

  for (const p of detectPlatforms(text)) {
    if (!out.platforms.some((e) => e.id === p.id)) out.platforms.push(p);
  }

  const targets = out.category ? POOL_TARGETS[out.category] : undefined;
  if (targets) {
    const amount = parseAmount(text);
    if (amount && targets.amount && !out.details[targets.amount]) out.details[targets.amount] = amount;
    const upi = parseUpi(text);
    if (upi && targets.upi && !out.details[targets.upi]) out.details[targets.upi] = upi;
    const phone = parsePhone(text);
    if (phone && targets.phone && !out.details[targets.phone]) out.details[targets.phone] = phone;
    const txn = parseTxn(text);
    if (txn && targets.txn && !out.details[targets.txn]) out.details[targets.txn] = txn;
    const contact = parsePhone(text) ?? parseEmail(text);
    if (contact && targets.contact && !out.details[targets.contact]) out.details[targets.contact] = contact;
    const when = parseWhen(text);
    if (when && targets.when && !out.details[targets.when] && !out.details[`${targets.when}:note`]) {
      storeWhen(out.details, targets.when, when);
    }
  }

  // Category-specific select fields guessable from free text.
  if (out.category === 'financial-fraud' && !out.details['ff-method']) {
    for (const v of ['upi', 'card', 'net-banking', 'wallet'] as const) {
      if (SELECT_WORDS[v].test(text)) { out.details['ff-method'] = v; break; }
    }
  }
  if (out.category === 'phishing' && !out.details['ph-channel']) {
    for (const v of ['sms', 'email', 'call', 'whatsapp'] as const) {
      if (SELECT_WORDS[v].test(text)) { out.details['ph-channel'] = v; break; }
    }
  }

  return out;
}

/**
 * Interpret one user message given the slot it answers.
 * `quickValue` is set when the user tapped a quick-reply chip; chips carry
 * exact machine values so no parsing is involved.
 */
export function applyAnswer(x: Extraction, slot: Slot, text: string, quickValue?: string): Extraction {
  let out = absorb(text, x);

  switch (slot.kind) {
    case 'story':
    case 'story-more':
      out.description = out.description ? `${out.description}\n${text}` : text;
      break;

    case 'confirm-category': {
      const yes = quickValue === 'yes' || (!quickValue && SELECT_WORDS.yes.test(text.trim()));
      const no = quickValue === 'no' || (!quickValue && SELECT_WORDS.no.test(text.trim()));
      if (yes) out.categoryConfirmed = true;
      else if (no) { out.category = undefined; out.categoryConfirmed = false; }
      // Anything else: keep asking (absorb may still have picked things up).
      break;
    }

    case 'pick-category': {
      const id = quickValue ?? detectCategory(text) ?? undefined;
      if (id && CATEGORIES.some((c) => c.id === id)) {
        out.category = id as CategoryId;
        out.categoryConfirmed = true;
      }
      break;
    }

    case 'platforms': {
      // The page sends chips as quickValue; typed text falls back to keywords.
      if (quickValue && quickValue !== 'done') {
        if (PLATFORM_IDS.includes(quickValue as (typeof PLATFORM_IDS)[number])
          && !out.platforms.some((p) => p.id === quickValue)) {
          out.platforms.push({ id: quickValue });
        }
      } else if (!quickValue && out.platforms.length === 0 && text.trim()) {
        out.platforms.push({ id: 'other', handle: text.trim() });
      }
      break;
    }

    case 'field': {
      const f = slot.field;
      const value = quickValue ?? text.trim();
      if (!value) break;
      if (f.type === 'select') {
        const opt = f.options?.find((o) => o.value === value)
          ?? f.options?.find((o) => SELECT_WORDS[o.value]?.test(value));
        if (opt) out.details[f.id] = opt.value;
        else out.details[f.id] = f.options?.[f.options.length - 1]?.value ?? value;
      } else if (f.type === 'number') {
        const n = parseAmount(value) ?? value.replace(/[^\d.]/g, '');
        if (n) out.details[f.id] = n;
      } else if (f.type === 'date' || f.type === 'datetime-local') {
        const when = parseWhen(value);
        if (when) storeWhen(out.details, f.id, when);
        else {
          out.details[`${f.id}:unsure`] = 'yes';
          out.details[`${f.id}:note`] = value;
        }
      } else {
        out.details[f.id] = value;
      }
      break;
    }

    case 'city': {
      if (quickValue === 'skip' || /^skip$/i.test(text.trim())) { out.citySkipped = true; break; }
      const parts = text.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        out.city = parts[0];
        if (parts[1]) out.state = parts[1];
      }
      break;
    }

    case 'evidence': {
      const yes = quickValue === 'yes' || (!quickValue && SELECT_WORDS.yes.test(text.trim()));
      out.hasEvidence = yes ? 'yes' : 'no';
      break;
    }

    case 'done':
      break;
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* OpenAI provider                                                    */
/* ------------------------------------------------------------------ */

export function getOpenAiKey(): string | null {
  return loadJSON<string | null>(KEYS.openaiKey, null);
}
export function setOpenAiKey(key: string | null): void {
  if (key) saveJSON(KEYS.openaiKey, key);
  else removeKey(KEYS.openaiKey);
}

/** Compact English catalog of every incident-field id for the system prompt. */
function fieldCatalog(): string {
  const lines: string[] = [];
  for (const [cat, fields] of Object.entries(incidentFieldsByCategory)) {
    const ids = fields
      .filter((f) => f.type !== 'platforms')
      .map((f) => (f.options ? `${f.id}(one of: ${f.options.map((o) => o.value).join('|')})` : f.id))
      .join(', ');
    lines.push(`${cat}: ${ids}`);
  }
  return lines.join('\n');
}

const OPENAI_SYSTEM = () => `You extract structured cybercrime-report data from a victim's chat messages (English or Hindi).
Return ONLY a JSON object with these keys:
"category": one of ${CATEGORIES.map((c) => c.id).join(', ')} or null if unclear.
"sentiment": one of distressed, anxious, angry, calm.
"urgent": true if money moved or harm happened within roughly the last day.
"fields": object mapping field ids (below, for the chosen category only) to string values the user actually stated. Dates as YYYY-MM-DD or YYYY-MM-DDTHH:mm. Amounts as plain rupee numbers. Never invent values.
"platforms": array of {"id": one of ${PLATFORM_IDS.join(', ')}, "handle": optional string} the user mentioned.
"city": city name or null. "state": Indian state or null.
Field ids per category:
${fieldCatalog()}`;

interface OpenAiPatch {
  category?: string | null;
  sentiment?: string;
  urgent?: boolean;
  fields?: Record<string, string>;
  platforms?: { id?: string; handle?: string }[];
  city?: string | null;
  state?: string | null;
}

/**
 * One extraction turn via OpenAI. Merges what the model found into the
 * extraction; never overwrites a value that is already set. Throws on any
 * network/API failure so the caller can fall back to the demo parser.
 */
export async function openaiExtract(key: string, messages: ChatMsg[], x: Extraction): Promise<Extraction> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: OPENAI_SYSTEM() },
        ...messages.map((m) => ({ role: m.role, content: m.text })),
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('openai empty');
  const patch = JSON.parse(raw) as OpenAiPatch;

  const out: Extraction = { ...x, details: { ...x.details }, platforms: [...x.platforms] };
  if (!out.category && patch.category && CATEGORIES.some((c) => c.id === patch.category)) {
    out.category = patch.category as CategoryId;
  }
  if (patch.sentiment && ['distressed', 'anxious', 'angry', 'calm'].includes(patch.sentiment)) {
    if (out.sentiment === 'calm') out.sentiment = patch.sentiment as Sentiment;
  }
  if (patch.urgent) out.urgent = true;
  const valid = new Set(
    Object.values(incidentFieldsByCategory).flat().map((f) => f.id),
  );
  for (const [id, value] of Object.entries(patch.fields ?? {})) {
    if (valid.has(id) && typeof value === 'string' && value && !out.details[id]) out.details[id] = value;
  }
  for (const p of patch.platforms ?? []) {
    if (p.id && PLATFORM_IDS.includes(p.id as (typeof PLATFORM_IDS)[number])
      && !out.platforms.some((e) => e.id === p.id)) {
      out.platforms.push({ id: p.id, ...(p.handle ? { handle: p.handle } : {}) });
    }
  }
  if (!out.city && patch.city) out.city = patch.city;
  if (!out.state && patch.state) out.state = patch.state;
  return out;
}
