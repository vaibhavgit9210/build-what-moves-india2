# Feature-module contracts

You are building one feature module of a cybercrime-reporting-portal **prototype**
(GOV.UK-inspired, Indian public-service context, demo data only). The foundation
is already written and compiles. **Read these files before writing any code:**

- `src/lib/types.ts` — all shared types (User, DraftReport, Report, CategoryId, …)
- `src/lib/steps.ts` — report journey order; use `nextPath()`/`prevPath()`
- `src/i18n/index.tsx` — `useI18n()` gives `{ t, lang, setLang }`; `formatDate(iso, lang, withTime?)`
- `src/i18n/locales/en/common.ts` — shared strings already available (buttons, categories, statuses, docTypes, steps, helpline, errors, resume)
- `src/state/AuthContext.tsx` (`useAuth()`), `src/state/DraftContext.tsx` (`useDraft()`, `mediaCache`), `src/state/SettingsContext.tsx`
- `src/services/*` — auth, reports, geo, ocr, stt, device
- `src/components/ui/Button.tsx` (`Button`, `ButtonLink`), `src/components/ui/Field.tsx` (`TextInput`, `TextArea`, `Select`, `RadioGroup`, `Checkbox`), `src/components/ui/Misc.tsx` (`Alert`, `Card`, `PageTitle`, `ProgressSteps`, `Spinner`, `Modal`, `ErrorSummary`)
- `src/content/categories.ts`
- `src/router.tsx` — routes are already registered; you only replace page files

## Hard rules

1. **Only create/replace the files assigned to you.** Never edit shared files
   (router, contexts, services, common.ts, other modules' files). If you feel a
   shared file needs a change, note it in your final report instead.
2. **No hardcoded user-facing strings.** Every visible string goes through
   `t('...')`. You own one i18n namespace: replace BOTH
   `src/i18n/locales/en/<ns>.ts` AND `src/i18n/locales/hi/<ns>.ts` with real,
   well-written dictionaries (natural Hindi, not transliteration; keep official
   terms like UPI, OTP, Aadhaar as-is). The two files must have identical key
   structure. Access keys as `t('<ns>.section.key')` — the namespace object is
   mounted under its name. Reuse `common.*`/`nav.*`/`categories.*` keys from
   common.ts where they exist instead of duplicating.
3. **Do NOT run npm/tsc/vite or any build command** — other agents are writing
   files concurrently; the orchestrator builds after everyone finishes. Write
   careful, strict-TypeScript-clean code (`strict: true`, verbatim JSX, React 18).
4. **Imports use the `@/` alias** (maps to `src/`).
5. **Pages are default exports** (the router lazy-loads them by file path —
   keep the exact file paths you were assigned).
6. **Accessibility is non-negotiable:** one `<h1>` per page via `PageTitle`;
   logical heading order; every input via the Field primitives (they wire
   label/hint/error/aria); `ErrorSummary` at top of invalid forms; min 44px tap
   targets (the primitives handle this); never color alone to convey state;
   text alternatives for icons (`aria-hidden` + visible text).
7. **Demo honesty:** never imply real verification/submission. Use the existing
   `common.demoData` label and `Alert` for demo notices where relevant.
8. **Style:** Tailwind utilities with the theme tokens
   (`bg-page text-ink border-border bg-surface text-muted text-link bg-brand
   text-brandtext bg-action bg-errorbg border-error bg-successbg bg-infobg
   bg-warnbg text-saffron bg-focus text-focustext`). Calm, restrained,
   content-first: white background, generous whitespace, max-w-2xl/3xl content
   columns, minimal shadows, no gradients, no decorative animation. Mobile-first
   responsive (test at 320px mentally: single column, full-width buttons via
   `fullWidth` where it helps).
9. **Report-flow pages** (if assigned): render `<ProgressSteps />` directly
   above the `PageTitle`, guard against a missing draft
   (`const { draft } = useDraft(); if (!draft) return <Navigate to="/report" replace />;`),
   persist every answer through `updateDraft(...)` immediately on change or on
   continue (draft must survive refresh), navigate with
   `nextPath('/report/<this>')` / `prevPath(...)` from `@/lib/steps`, and always
   render a Back link/button. No dead ends: every state has a way forward.
10. Keep components in your page files or under `src/components/<area>/` with
    filenames unlikely to clash (prefix with your area, e.g. `report/VoiceRecorder.tsx`).

## Design language

Headings bold and large (`text-3xl/4xl`), body `text-base/lg`, one primary
action per screen (green `Button`), secondary actions as `variant="secondary"`
or plain links. Emergency info (1930 / 112) uses `Alert variant="emergency"`
with big phone numbers as `tel:` links. Question screens: one question, big
`RadioGroup big` options, Continue below.
