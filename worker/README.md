# sahayata-help worker

Serverless backend for the AI features of the Cyber Sahayata prototype:
the in-form "Need help?" assistant (`/ask`), chat-report extraction
(`/intake`), the grounded case-plan rephrase (`/brief`) and the authority
portal's FIR preparation pack (`/fir-prep`).

A stateless, dependency-free Cloudflare Worker (vaibhavpro9210 account).
`/ask` forwards one question at a time to:

1. **Groq** (`llama-3.3-70b-versatile`) when the `GROQ_API_KEY` secret is set;
2. **Workers AI** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) via the keyless
   `[ai]` binding otherwise, so it runs free with zero setup (same pattern as
   the ananta-brain worker). Note: `@cf/meta/llama-3.1-8b-instruct` was
   deprecated May 2026; do not switch back to it.

The system prompt limits it to process, navigation and general safety
questions. It never receives complaint text, evidence or personal details,
and refuses to engage with any that a user pastes in by hand.

Deployed at: `https://sahayata-help.vaibhavpro9210.workers.dev`
(the frontend's `HELP_ENDPOINT` in `src/services/helpService.ts` points at
`/ask`; any worker error makes the frontend fall back to labeled demo answers).

## Deploy / update

```bash
cd worker
npx wrangler deploy
npx wrangler secret put GROQ_API_KEY   # optional, upgrades answers to Groq
```

## TODO before real use

- Set the GROQ_API_KEY secret (free tier) so Groq handles answers.
- Tighten `Access-Control-Allow-Origin` to the site origin.
- Add a per-IP daily limit (KV), mirroring the ananta-brain worker, before
  sharing the URL widely.

## API

`POST /ask` with `{"question": "...", "lang": "en" | "hi"}` →
`{"answer": "...", "provider": "groq" | "workers-ai"}`.
Errors: 400 bad request, 502 upstream, 503 not configured.

`POST /intake` with `{"spec": "...", "messages": [...]}` →
`{"raw": "...", "provider": "..."}`. Extraction turn for the chat report;
runs gpt-oss-120b, falling back to gpt-oss-20b then llama.

`POST /brief` with `{"facts": "...", "lang": "..."}` → `{"raw", "provider"}`.
Rephrases case-plan facts, hard-grounded to the facts given.

`POST /fir-prep` with the case facts
(`{category, statutes, description, details, evidence, financial, dates,
place, lang}`) → `{"checklist": [...], "briefFacts": "...", "provider"}`.
Same provider chain as `/ask`. It returns only those two things; the client
assembles every other section of the pack from the report record, so the
model cannot invent a section.

**This route receives the case and never the person.** The frontend
(`src/services/firPrepService.ts`) strips reporter name, contact details,
identity document and OCR output out of the payload, including on tickets
where the reporter has granted the officer identity access. Incident evidence
(amounts, UPI ids, transaction ids, scammer handles) IS sent, because that is
the evidentiary substance of the case.
