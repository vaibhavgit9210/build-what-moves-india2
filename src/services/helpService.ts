/**
 * The "Need help?" assistant seam. Questions go to the sahayata-help
 * Cloudflare Worker (see worker/), which answers server-side via the Groq
 * API when its GROQ_API_KEY secret is set, falling back to keyless Workers
 * AI; no key ever touches the client. If the worker fails, a clearly-labeled
 * DEMO fallback answers from a small set of canned, keyword-matched
 * responses so the UX still works offline.
 *
 * The assistant is stateless and never receives the draft, evidence or
 * personal details: only the user's typed question and the UI language.
 */

export const HELP_ENDPOINT: string | null =
  'https://sahayata-help.vaibhavpro9210.workers.dev/ask';

export interface HelpAnswer {
  /** 'live' = worker/Anthropic; 'demo' = canned local answer. */
  provider: 'live' | 'demo';
  /** For 'live': the answer text. For 'demo': an i18n key id under helpPanel.demo. */
  text: string;
}

/** Keyword rules for the demo fallback; ids resolve to helpPanel.demo.<id>. */
const DEMO_RULES: { id: string; pattern: RegExp }[] = [
  { id: 'anonymous', pattern: /anonym|गुमनाम|पहचान/i },
  { id: 'afterSubmit', pattern: /after|submit|next|happens|जमा|बाद|आगे/i },
  { id: 'proof', pattern: /proof|evidence|screenshot|सबूत|प्रमाण/i },
  { id: 'track', pattern: /track|status|reference|ट्रैक|स्थिति|संदर्भ/i },
  { id: 'real', pattern: /real|actual|government|असली|सरकार/i },
  { id: 'danger', pattern: /danger|urgent|emergency|threat|खतर|आपात|धमक/i },
  { id: 'language', pattern: /language|hindi|english|भाषा|हिंदी|अंग्रेज़/i },
  { id: 'wrongCategory', pattern: /category|wrong|mistake|श्रेणी|गलत/i },
];

function demoAnswer(question: string): HelpAnswer {
  const rule = DEMO_RULES.find((r) => r.pattern.test(question));
  return { provider: 'demo', text: rule?.id ?? 'fallback' };
}

export async function askHelp(question: string, lang: string): Promise<HelpAnswer> {
  if (HELP_ENDPOINT) {
    try {
      const res = await fetch(HELP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, lang }),
      });
      if (res.ok) {
        const data = (await res.json()) as { answer?: string };
        if (data.answer) return { provider: 'live', text: data.answer };
      }
    } catch {
      // Fall through to the demo answers.
    }
  }
  return demoAnswer(question);
}
