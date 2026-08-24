/**
 * sahayata-help — the AI backend behind the Cyber Sahayata prototype.
 *
 * POST /ask {question, lang} -> {answer, provider}
 *   The "Need help?" assistant. Providers, in order:
 *   1. Groq (llama-3.3-70b-versatile) when the GROQ_API_KEY secret is set.
 *   2. Workers AI (llama-3.3-70b) via the keyless [ai] binding, so
 *      the assistant works free with zero setup, same pattern as ananta-brain.
 *
 * POST /intake {spec, messages} -> {raw, provider}
 *   Extraction turn for the "Report by chat" journey: `spec` is the
 *   extraction instruction (JSON schema + field catalog, built by the
 *   frontend from its content modules), `messages` the conversation so far.
 *   Runs OpenAI's open-weight gpt-oss-120b on the keyless Workers AI binding
 *   (falling back to gpt-oss-20b, then llama), so the chat gets a free
 *   OpenAI-model brain with no key anywhere. Returns the model's raw text;
 *   the frontend parses/validates the JSON and merges it.
 *
 * The /ask assistant is deliberately STATELESS and firewalled from the
 * report: the frontend never sends complaint text there. /intake by contrast
 * IS the intake channel: it receives what the user typed into the chat, uses
 * it for the single extraction call, and stores nothing.
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

/**
 * One gpt-oss call. The gpt-oss models on Workers AI speak the Responses-API
 * schema (instructions/input) rather than chat messages; the result shape
 * has varied across releases, so accept every known variant.
 */
async function runGptOss(env, model, instructions, input) {
  const data = await env.AI.run(model, { instructions, input });
  let text = '';
  if (typeof data?.output_text === 'string') text = data.output_text;
  else if (Array.isArray(data?.output)) {
    text = data.output
      .filter((o) => o?.type === 'message')
      .flatMap((o) => (Array.isArray(o?.content) ? o.content : []))
      .map((c) => (typeof c?.text === 'string' ? c.text : ''))
      .join('');
  } else if (typeof data?.response === 'string') text = data.response;
  text = (text || '').trim();
  if (!text) throw new Error(`${model} empty`);
  return text;
}

async function handleIntake(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-request' }, 400);
  }
  const spec = typeof body?.spec === 'string' ? body.spec.trim() : '';
  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!spec || spec.length > 8000 || !messages || messages.length === 0 || messages.length > 16) {
    return json({ error: 'bad-request' }, 400);
  }
  const lines = [];
  for (const m of messages) {
    const role = m?.role === 'user' ? 'User' : m?.role === 'assistant' ? 'Assistant' : null;
    const content = typeof m?.content === 'string' ? m.content.slice(0, 1500) : '';
    if (!role || !content) return json({ error: 'bad-request' }, 400);
    lines.push(`${role}: ${content}`);
  }
  const instructions = `${spec}\nRespond with ONLY the JSON object, no prose, no code fences.`;
  const input = `Conversation so far:\n${lines.join('\n')}`;

  if (!env.AI) return json({ error: 'not-configured' }, 503);
  for (const model of ['@cf/openai/gpt-oss-120b', '@cf/openai/gpt-oss-20b']) {
    try {
      return json({ raw: await runGptOss(env, model, instructions, input), provider: model });
    } catch {
      // Try the next model.
    }
  }
  try {
    const data = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: input },
      ],
      max_tokens: 800,
      temperature: 0,
    });
    const text = (data?.response ?? '').trim();
    if (!text) throw new Error('llama empty');
    return json({ raw: text, provider: 'workers-ai-llama' });
  } catch {
    return json({ error: 'upstream' }, 502);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/intake') return handleIntake(request, env);
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
