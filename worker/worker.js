/**
 * sahayata-help — the "Need help?" assistant behind the Cyber Sahayata
 * prototype. POST /ask {question, lang} -> {answer, provider}.
 *
 * Providers, in order:
 *   1. Groq (llama-3.3-70b-versatile) when the GROQ_API_KEY secret is set.
 *   2. Workers AI (llama-3.1-8b-instruct) via the keyless [ai] binding, so
 *      the assistant works free with zero setup, same pattern as ananta-brain.
 *
 * Deliberately STATELESS and firewalled from the report: the frontend never
 * sends complaint text, evidence or personal details here, and the system
 * prompt refuses to work with any that a user pastes in by hand. It only
 * explains the reporting process, site navigation, and general safety and
 * legal information.
 *
 * Deploy: cd worker && npx wrangler deploy
 * Optional: npx wrangler secret put GROQ_API_KEY
 */

const SYSTEM = `You are the help assistant for "Cyber Sahayata", a DEMO prototype of a redesigned Indian cybercrime reporting portal. You sit in a small "Need help?" panel next to the report form.

Scope - you ONLY:
- explain how the reporting process works (steps, anonymous vs registered reporting, what happens after submitting, evidence, categories, tracking);
- help with site navigation and accessibility features;
- give general safety guidance and general information about Indian cybercrime law and helplines (1930 for financial fraud, 112 for emergencies, 1098 Childline).

Hard rules:
- You CANNOT see the user's complaint, and you must never ask for it. If the user pastes personal details, account numbers, or their incident story, do NOT engage with the specifics; gently remind them that this chat cannot see or store their complaint and that those details belong in the form itself.
- This is a demo: no real complaint is filed with the Government of India. Say so if asked whether it is real.
- Anonymous reports here cannot be tracked and nobody can contact the reporter back; never promise otherwise.
- Be calm, plain-language and brief (2-5 short sentences). No emojis. No legal advice; suggest consulting a lawyer or calling the helplines for case-specific questions.
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

async function askGroq(env, messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 400,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('groq empty');
  return { answer: text, provider: 'groq' };
}

async function askWorkersAi(env, messages) {
  const data = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    max_tokens: 400,
    temperature: 0.3,
  });
  const text = (data?.response ?? '').trim();
  if (!text) throw new Error('workers-ai empty');
  return { answer: text, provider: 'workers-ai' };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/ask') return json({ error: 'not-found' }, 404);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad-request' }, 400);
    }
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question || question.length > 600) return json({ error: 'bad-request' }, 400);
    const lang = body?.lang === 'hi' ? 'Hindi' : 'English';

    // Stateless by design: one question in, one answer out, no history.
    const messages = [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `(Answer in ${lang}.) ${question}` },
    ];

    if (env.GROQ_API_KEY) {
      try {
        return json(await askGroq(env, messages));
      } catch {
        // Fall through to Workers AI.
      }
    }
    if (env.AI) {
      try {
        return json(await askWorkersAi(env, messages));
      } catch {
        return json({ error: 'upstream' }, 502);
      }
    }
    return json({ error: 'not-configured' }, 503);
  },
};
