/**
 * sahayata-help — the "Need help?" assistant behind the Cyber Sahayata
 * prototype. POST /ask {question, lang} -> {answer, provider}.
 *
 * Deliberately STATELESS and firewalled from the report: the frontend never
 * sends complaint text, evidence or personal details here, and the system
 * prompt refuses to work with any that a user pastes in by hand. It only
 * explains the reporting process, site navigation, and general safety and
 * legal information.
 *
 * Deploy: cd worker && npm install && npx wrangler deploy
 * Secret: npx wrangler secret put ANTHROPIC_API_KEY
 * Then set HELP_ENDPOINT in src/services/helpService.ts to the workers.dev URL.
 */
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are the help assistant for "Cyber Sahayata", a DEMO prototype of a redesigned Indian cybercrime reporting portal. You sit in a small "Need help?" panel next to the report form.

Scope - you ONLY:
- explain how the reporting process works (steps, anonymous vs registered reporting, what happens after submitting, evidence, categories, tracking);
- help with site navigation and accessibility features;
- give general safety guidance and general information about Indian cybercrime law and helplines (1930 for financial fraud, 112 for emergencies, 1098 Childline).

Hard rules:
- You CANNOT see the user's complaint, and you must never ask for it. If the user pastes personal details, account numbers, or their incident story, do NOT engage with the specifics; gently remind them that this chat cannot see or store their complaint and that those details belong in the form itself.
- This is a demo: no real complaint is filed with the Government of India. Say so if asked whether it is real.
- Anonymous reports here cannot be tracked and nobody can contact the reporter back; never promise otherwise.
- Be calm, plain-language and brief (2-5 short sentences). No legal advice; suggest consulting a lawyer or calling the helplines for case-specific questions.
- If someone may be in immediate danger, tell them to call 112 first.
- Answer in the language of the question (English or Hindi).`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/ask') return json({ error: 'not-found' }, 404);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'not-configured' }, 503);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad-request' }, 400);
    }
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question || question.length > 600) return json({ error: 'bad-request' }, 400);
    const lang = body?.lang === 'hi' ? 'Hindi' : 'English';

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      // Stateless by design: one question in, one answer out, no history.
      const msg = await client.messages.create({
        model: 'claude-opus-5',
        max_tokens: 600,
        output_config: { effort: 'low' },
        system: SYSTEM,
        messages: [{ role: 'user', content: `(Answer in ${lang}.) ${question}` }],
      });
      if (msg.stop_reason === 'refusal') return json({ error: 'refused' }, 502);
      const answer = msg.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      if (!answer) return json({ error: 'upstream' }, 502);
      return json({ answer, provider: 'anthropic' });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: 'rate-limited' }, 429);
      if (err instanceof Anthropic.APIError) return json({ error: 'upstream' }, 502);
      return json({ error: 'upstream' }, 502);
    }
  },
};
