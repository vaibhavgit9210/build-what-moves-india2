# sahayata-help worker

Serverless backend for the in-form "Need help?" assistant. A stateless
Cloudflare Worker that forwards one question at a time to the Anthropic API
(model `claude-opus-5`) with a system prompt that limits it to process,
navigation and general safety questions. It never receives complaint text,
evidence or personal details, and its prompt refuses to engage with any that
a user pastes in by hand.

## Deploy

```bash
cd worker
npm install
npx wrangler deploy                       # Cloudflare account: vaibhavpro9210
npx wrangler secret put ANTHROPIC_API_KEY # required
```

Then point the frontend at it: set `HELP_ENDPOINT` in
`src/services/helpService.ts` to `https://sahayata-help.<account>.workers.dev/ask`.

## TODO before real use

- Put an ANTHROPIC_API_KEY secret in place (no key is available in the dev
  environment; until then the frontend uses its clearly-labeled demo answers).
- Tighten `Access-Control-Allow-Origin` to the site origin.
- Add a per-IP daily limit (KV), mirroring the ananta-brain worker, before
  sharing the URL widely.

## API

`POST /ask` with `{"question": "...", "lang": "en" | "hi"}` →
`{"answer": "...", "provider": "anthropic"}`.
Errors: 400 bad request, 429 rate limited, 502 upstream, 503 not configured
(no key). The frontend treats every error as "fall back to demo answers".
