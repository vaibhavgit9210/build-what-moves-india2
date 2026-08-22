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
Instead, `.github/workflows/deploy.yml` builds on CI and force-pushes
`gh-pages` on every push to `main`. So a deploy = `git push origin main`, wait
~1 min, done. Source lines with the demo password carry `gitleaks:allow`
annotations, which is why `main` commits pass the scan.

Pages gotcha (Aug 2026): a gh-pages branch created by the Actions bot does NOT
auto-enable Pages, and when auto-enable did fire (after a placeholder push with
user SSH creds) GitHub picked `main` as the source. The user set
Settings → Pages → branch `gh-pages` `/(root)` manually in Brave.

## Shape

- Vite base `/build-what-moves-india2/`, HashRouter (deep links work on Pages).
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
- i18n: en + hi, 7 namespace files per locale under `src/i18n/locales/`,
  flattened to dotted keys; `t()` falls back en → key. Keep key trees in
  parity (740 keys each as of Aug 2026). **No em/en dashes in any copy** (user
  rule). Demo login `demo@example.com` / `Demo@123` (deliberately public).
- Accessibility settings = data attributes on `<html>` + token swap in
  `global.css`. Note the Tailwind v4 trap that bit us once: element-level CSS
  (like `a { color }`) must live in `@layer base` or it beats utility classes.

## Test hooks (query BEFORE the hash)

`?e2e=reset` wipe storage · `?e2e=login` sign in demo user ·
`?e2e=draft` sign in + seed a full financial-fraud draft (works for every
/report/* step incl. review) · `?lang=hi` Hindi. Example:
`…/build-what-moves-india2/?e2e=draft#/report/review`.
Headless Chrome: pages are rAF-free; use `--virtual-time-budget=8000
--timeout=20000` and a fresh `--user-data-dir` per run (Chrome sometimes hangs
on exit; kill strays with `pkill -f headless=new`).
