# build-what-moves-india2 (Cyber Sahayata)

Prototype of a redesigned Indian cybercrime reporting portal (GOV.UK-principled,
demo data only). Repo `vaibhavgit9210/build-what-moves-india2`, live at
https://vaibhavkumar.is-a.dev/build-what-moves-india2/ (GitHub Pages from the
`gh-pages` branch). Built from the spec in
`../build-what-moves-india/Claude Prompt — Accessible Cybercrime Reporting Portal Prototype.md`.

## Deploy — this repo is DIFFERENT from the others

React+TS+Vite app, so `gh-pages` holds the **built dist**, not the source.
**Never build and commit dist locally**: the machine's gitleaks git-shim
(`/usr/local/share/gitleaks/bin/git` shadows real git; `--no-verify` is
intercepted and still scans) blocks the minified bundle because it contains the
intentional demo credential and a false-positive in the transformers.js chunk.
Instead, `.github/workflows/deploy.yml` builds on CI and deploys on every push
to `main`. So a deploy = `git push origin main`, wait ~1.5 min, done. Source
lines with the demo password carry `gitleaks:allow` annotations, which is why
`main` commits pass the scan.

How the deploy actually lands (learned the hard way, Aug 2026): the repo's
Pages config is stuck at `build_type: legacy, source: main` and CANNOT be
changed from CI (`PUT /pages` with `GITHUB_TOKEN` returns 403 "Resource not
accessible by integration"; `actions/configure-pages` only creates sites, it
never converts an existing legacy one). Serving `main` means serving the raw
Vite source `index.html`, which is a blank white page. The workflow therefore
deploys through the **Pages deployments API** (`actions/upload-pages-artifact`
+ `actions/deploy-pages`), which serves the built dist regardless of the
branch setting. It also still force-pushes `gh-pages` (kept as an inspectable
copy of the build). Consequence of the leftover legacy config: every push to
`main` first triggers a legacy build FROM main (site goes blank for ~1 min)
until the Actions deployment lands last and wins. If the user ever flips
Settings → Pages → Source to "GitHub Actions" in Brave, the blank window
disappears; do not ask them to pick a branch there again.

## Shape

- Vite base `/build-what-moves-india2/`, HashRouter (deep links work on Pages).
- **Accountability revamp (Aug 2026)**: 17 legally-grounded categories
  (6 new: investment-job-fraud, loan-app-abuse, romance-scam, sextortion,
  data-breach, child-safety). `src/content/casePlans.ts` = CONTRACT FILE:
  per-category statutes/owner/SLAs (ack, first contact, update cadence,
  resolve-by) + specials/outcomes/guilty + the shared 5-level ESCALATION_MATRIX
  (L5 = portal-drafted public social post via twitter intent, non-anonymous
  only). Reports carry officer/nextUpdateDue/updates/escalationLevel
  (reportService assigns a deterministic mock officer; escalateReport is
  gated by entitledLevel: L2 unlocks the moment a deadline is missed, L3/4/5
  at 7/14/21 days overdue, one level per click, each resets a 48h clock).
  `CasePlanPanel` renders the 8-section clarity packet (statutes, staged
  dates, officer, cadence, track, matrix, outcomes, punishments) on
  success/detail pages + an AI rephrase via worker `/brief` (gpt-oss,
  facts-grounded). ReportDetail has DEMO CONTROLS (simulate officer update /
  missed deadline, the latter sets due 30 days back so all levels can be
  walked). `/promise` = public service-promise page (lifecycle, matrix, SLA
  table). refNumber is now a 14-digit numeric ack (real-NCRP shape). Demo
  seed v2 replaces seeded reports r-1..r-8 with officered ones; **r-2 is
  deliberately overdue** so `?e2e=login` demos land on an armed escalation.
  i18n namespaces `plan` + `promise` (en+hi, keep parity).
- **Authority portal (Aug 2026)**: `#/admin/*`, the officer side of the
  accountability loop. Own route tree behind its OWN session
  (`ncrpdemo.admin.session`, `AdminAuthContext`, `AdminShell` guards the tree),
  fully separate from the citizen `AuthContext` in both directions.
  `src/content/authorityRoster.ts` = CONTRACT FILE (twin of casePlans.ts): 6
  synthetic officers, badge-id login, shared demo password `Officer@123`
  (`gitleaks:allow`), units, `officer`/`in-charge` ranks, category
  specialisations. **reportService no longer invents an officer** per report:
  it draws from the roster deterministically (specialists first, then round
  robin on refNumber) so the officer named to the reporter is the one who can
  log in. Seeded reports assign officers EXPLICITLY (seed v3) because seeded
  refNumbers move with today's date and a demo login must find the same
  tickets every morning. Report model gained `verificationStatus`
  (pending/verified/needs-more-info/rejected) + notes + `verifiedAt`,
  `piiRequests[]`, `audit[]`; `CaseUpdate` gained optional `text` (verbatim,
  authority-written), `note` and `actor`, so `textKey` is now OPTIONAL and the
  reporter's update list renders `text ?? t(textKey)`. Pages:
  `#/admin/login` (whole roster listed, one-click sign in),
  `#/admin/tickets` (own tickets; in-charge gets a unit toggle + reassign),
  `#/admin/tickets/:id` (masked identity + always-visible evidence,
  verification form, post-update, activity log),
  `#/admin/tickets/:id/fir-prep`. **PII gate**: identity masked by default,
  officer requests with a reason, the REPORTER approves/denies on their own
  report page (`PiiRequestPanel` in ReportDetail), grant unlocks that one
  ticket only and is logged. Anonymous reports never show the request.
  Evidence (amounts, UPI ids, txn ids, handles) is NOT PII and never masked.
  **FIR prep pack**: unlocked only when verified; standard Indian FIR
  proforma on the BNS 2023 regime, statutes from `casePlans.ts`, printed via
  `window.print()` (A4 `@page` + `.no-print`), no PDF library. Worker route
  `/fir-prep` (same provider chain as `/ask`, but **gpt-oss before llama**
  inside the keyless step: llama wraps the JSON in prose essentially every
  time, so llama-first just cost ~15s before the retry that works; a failed
  PARSE falls through to the next provider, not just a thrown error; live
  generation takes 10-25s) returns ONLY `{checklist, briefFacts}`; every other section is assembled client side so
  the model cannot invent one, and **the payload never contains reporter PII
  even after a grant** (asserted). The worker `tidy()`s model output:
  gpt-oss emits non-breaking hyphens (U+2011) and narrow spaces, which
  **corrupted a transaction id** on a pack an officer copies from. i18n
  namespace `admin` is **en only** for now (t() falls back en → key, so Hindi
  shows English there).
- **Two report modes** chosen on /report: `draft.mode = 'tracked' | 'anonymous'`.
  Anonymous skips the identity step everywhere (steps.ts helpers take an
  `anonymous` flag; stepper shows 4 steps; report gets `anonymous: true`, no
  `userId`; Track answers honestly instead of showing status). The triage
  questions are skippable ("I already know the category" → browse-first list).
- Location has a Leaflet + OSM pin picker (`leaflet` npm dep, lazy chunk;
  pins snap to the nearest synthetic demo city via `reverseGeocode`, no real
  geocoding; `location.method` gained `'map'`). Needs network for tiles only.
- `draft.platforms` = multi-select where-it-happened picker (chips + per
  -platform handle) used by harassment/social-media/impersonation/hacking/
  sensitive categories. Date fields with `allowUnsure` store `<id>:unsure` /
  `<id>:note` in incidentDetails.
- **Report by chat** (`#/chat`, top-right header button on every page):
  conversational intake that fills the form. Anonymous/signed-in gate mirrors
  /report modes. `src/services/intakeService.ts` = extraction engine: the
  deterministic slot policy (`nextSlot`) always chooses the next question;
  extraction runs per free-text user message via OpenAI `gpt-4o-mini`
  (user-pasted key in localStorage `ncrpdemo.openaiKey`, sent only to
  api.openai.com) or, DEFAULT with no key, OpenAI's open-weight
  **gpt-oss-120b free on keyless Workers AI** through the sahayata-help
  worker's `/intake` route (client sends the extraction spec + last 12
  messages; worker returns raw model JSON; falls back gpt-oss-20b → llama).
  Model failure falls back per-turn, with a visible notice, to the built-in
  demo parser (amount/UPI/phone/txn/date-phrase regexes + category/sentiment
  keyword lexicons, en+hi). Relative dates for datetime fields go through the `<id>:unsure`/
  `<id>:note` mechanism, never invented timestamps. "Review and submit"
  morphs chat → pre-filled editable form (CSS stagger, reduced-motion safe)
  submitting via the same reportService; "Open in the full form" hands the
  built draft to /report/review. Conversation persists in `ncrpdemo.chatIntake`.
  i18n namespace `chat` (en+hi, keep parity).
- **In-form help**: floating "Need help?" on /report/* (per-step FAQ + a
  stateless assistant). `worker/` = `sahayata-help` Cloudflare Worker
  (vaibhavpro9210 account, DEPLOYED at
  sahayata-help.vaibhavpro9210.workers.dev): `/ask` = Groq
  llama-3.3-70b-versatile when the GROQ_API_KEY secret is set (it is not
  yet), else keyless Workers AI llama-3.3-70b-instruct-fp8-fast (the 3.1-8b
  model is deprecated). `HELP_ENDPOINT` in `src/services/helpService.ts`
  points at it; worker failure → clearly-labeled canned demo answers.
  The /ask assistant never receives draft/complaint data by design; the
  worker's `/intake` route (chat-report extraction) DOES receive the chat
  messages, uses them for one model call and stores nothing.
- **Look**: plain-government styling after police.gov.sg (white header, navy
  #10508c actions/links, slim gray demo strip, no emojis anywhere in the UI).
- `src/services/*` = the mock backend seam (auth, reports, geo, ocr, stt,
  device). `sttService` runs Whisper-tiny in-browser via
  `@huggingface/transformers` (lazy chunk, model downloads from HF hub on first
  use) with an honest canned-demo fallback labeled `provider:'demo'`.
- Draft report lives in `DraftContext` + localStorage (`ncrpdemo.*` keys);
  blobs/files stay in the in-memory `mediaCache` only. Journey order is defined
  once in `src/lib/steps.ts`.
- Decision tree + classify() in `src/content/decisionTree.ts`; per-category
  guidance in `content/guidance.ts` (contract shared with the review page);
  per-category incident form defs in `content/incidentFields.ts` (field ids are
  prefixed, e.g. `ff-amount`; labels resolve through `labelKey`, never
  humanize the id).
- i18n: en + hi, 11 namespace files per locale under `src/i18n/locales/`
  (incl. `helpPanel`, `chat`, `plan`, `promise`), flattened to dotted keys; `t()` falls back en → key.
  Keep key trees in parity (1223 keys each as of Aug 2026). **No em/en dashes in any copy** (user
  rule). Demo login `demo@example.com` / `Demo@123` (deliberately public).
- Accessibility settings = data attributes on `<html>` + token swap in
  `global.css`. Note the Tailwind v4 trap that bit us once: element-level CSS
  (like `a { color }`) must live in `@layer base` or it beats utility classes.

## Test hooks (query BEFORE the hash)

`?e2e=reset` wipe storage · `?e2e=login` sign in demo user ·
`?e2e=draft` sign in + seed a full financial-fraud draft (works for every
/report/* step incl. review) · `?e2e=anon` same draft as an ANONYMOUS
journey (no login, no identity, location method 'map' so the Leaflet map
opens pre-pinned) · `?e2e=chat` seed a finished chat-intake conversation on
`#/chat` ("Review and submit" visible) · `?e2e=chatform` same but already
morphed into the pre-filled form · `?e2e=adminlogin` sign in to the authority
portal as SI Meera Nair (badge KA-CYB-1042) · `?e2e=adminticket` same, plus
r-2 already verified so FIR prep is unlocked · `?lang=hi` Hindi. Examples:
`…/build-what-moves-india2/?e2e=draft#/report/review`,
`…/build-what-moves-india2/?e2e=adminlogin#/admin/tickets`.

**Driving the interactive flows**: screenshots cannot click, so verification /
PII-grant / reassign were verified with a throwaway CDP harness (Chrome with
`--remote-debugging-port`, plain `WebSocket` from node, `Runtime.evaluate`).
Two gotchas if you rebuild it: `timeout` does not exist on this machine (use a
background process + poll for the PNG, since headless Chrome hangs on exit
even after writing the screenshot), and `Page.navigate` to a URL differing only
in the HASH does not reload, so a localStorage session swap is not picked up
(vary the query string to force a real load).
Headless Chrome: pages are rAF-free; use `--virtual-time-budget=8000
--timeout=20000` and a fresh `--user-data-dir` per run (Chrome sometimes hangs
on exit; kill strays with `pkill -f headless=new`).
