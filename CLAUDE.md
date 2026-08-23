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
- **In-form help**: floating "Need help?" on /report/* (per-step FAQ + a
  stateless assistant). `worker/` = `sahayata-help` Cloudflare Worker calling
  the Anthropic API (claude-opus-5, wrangler secret ANTHROPIC_API_KEY, NOT
  deployed; see worker/README.md). `HELP_ENDPOINT` in
  `src/services/helpService.ts` is null → clearly-labeled demo answers.
  The assistant never receives draft/complaint data by design.
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
- i18n: en + hi, 8 namespace files per locale under `src/i18n/locales/`
  (incl. `helpPanel`), flattened to dotted keys; `t()` falls back en → key.
  Keep key trees in parity (~880 keys each as of Aug 2026). **No em/en dashes in any copy** (user
  rule). Demo login `demo@example.com` / `Demo@123` (deliberately public).
- Accessibility settings = data attributes on `<html>` + token swap in
  `global.css`. Note the Tailwind v4 trap that bit us once: element-level CSS
  (like `a { color }`) must live in `@layer base` or it beats utility classes.

## Test hooks (query BEFORE the hash)

`?e2e=reset` wipe storage · `?e2e=login` sign in demo user ·
`?e2e=draft` sign in + seed a full financial-fraud draft (works for every
/report/* step incl. review) · `?e2e=anon` same draft as an ANONYMOUS
journey (no login, no identity, location method 'map' so the Leaflet map
opens pre-pinned) · `?lang=hi` Hindi. Example:
`…/build-what-moves-india2/?e2e=draft#/report/review`.
Headless Chrome: pages are rAF-free; use `--virtual-time-budget=8000
--timeout=20000` and a fresh `--user-data-dir` per run (Chrome sometimes hangs
on exit; kill strays with `pkill -f headless=new`).
