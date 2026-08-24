# Cyber Sahayata — cybercrime reporting portal prototype

A working prototype of a redesigned Indian cybercrime reporting experience,
inspired by the clarity and accessibility principles of GOV.UK (without copying
its branding). The reference for the *current* experience is the National Cyber
Crime Reporting Portal (https://cybercrime.gov.in/): form-heavy, dense, and
terminology-first. This prototype flips it to:

> **“Tell us what happened. We’ll help you report it.”**

> **This project is a prototype and is not connected to the National Cyber
> Crime Reporting Portal, Government of India systems, Aadhaar, police
> databases, banks, or other government identity systems.** All data is
> synthetic and everything is stored only in your browser.

**Live demo:** https://vaibhavkumar.is-a.dev/build-what-moves-india2/

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## Demo login

| Field | Value |
| --- | --- |
| Login | `demo@example.com` |
| Password | `Demo@123` |

You can also register a new account with any (fake) identifier — Aadhaar, PAN,
passport, voter ID, driving licence, ration card, email or mobile. Nothing is
validated against any real database.

## The journey

Landing → login/register → location (consent-first, simulated reverse
geocoding) → identity (upload a document, simulated OCR, review & edit) →
"What happened?" decision tree (plain-language yes/no questions, irrelevant
questions skipped) → suggested category (changeable) → immediate "do these
things now" guidance (1930 / 112 / bank steps) → describe it by typing or
voice (in-browser Whisper transcription with an editable transcript) →
category-specific incident form → evidence → review → submit → reference
number → dashboard with a status timeline. No dead-end screens; every step has
a manual fallback.

## Report by chat

The "Report by chat" button in the header (top right, every page) opens a
conversational alternative to the form journey at `#/chat`. The user chooses
anonymous or signed-in filing, then tells their story in free text; the intake
engine extracts the category, sentiment, urgency and the real incident-form
fields from each message and asks only for what is still missing (quick-reply
chips for yes/no, categories, platforms and select options). A live "What we
understood" panel fills in beside the conversation. When everything required
is present, "Review and submit" morphs the chat into a pre-filled, editable
form (staggered transition, honours reduced motion) that submits through the
same `reportService` as the classic journey; "Open in the full form" hands the
same data to the regular review page instead.

Understanding providers, honestly labeled in the UI:

- **OpenAI (`gpt-4o-mini`)** when the user saves an API key under "AI
  settings" on the chat page. The key stays in localStorage and is sent only
  to `api.openai.com`; on any failure the turn falls back to the demo parser
  with a visible notice.
- **Built-in demo parser** otherwise (`src/services/intakeService.ts`):
  deterministic rules for amounts (`₹20,000`, `2 lakh`, `20k`), UPI handles,
  phone numbers, transaction ids, platforms, relative dates ("yesterday
  evening" is stored through the form's honest "roughly when" mechanism, never
  as an invented timestamp), category keywords and a sentiment/urgency
  lexicon, in English and Hindi. Money moved recently surfaces a "call 1930
  now" banner.

## Architecture

```
UI (React pages/components)
        ↓
Demo API / service layer   src/services/*  ← swap these to go real
        ↓
Mock data                  localStorage + src/data/demoData.ts
```

- **Stack:** React 18 + TypeScript (strict) + Vite + Tailwind CSS v4 +
  React Router (hash routing, so deep links work on GitHub Pages).
- **State:** three contexts — `AuthContext` (session), `DraftContext` (the
  in-progress report; persisted to localStorage on every change so a refresh
  resumes where you left off), `SettingsContext` (accessibility preferences).
- **Services (`src/services/`):** each is an isolated module with a clean
  signature so a real backend can replace it later:
  - `authService` — localStorage users, SHA-256 password hashing, login by ID
    number / email / mobile.
  - `reportService` — report store, submission (fake `NCRP-DEMO-…` reference
    numbers), public tracking by reference number.
  - `geoService` — asks the browser for real coordinates (only on explicit
    button press), then maps them to the nearest of six synthetic Indian
    addresses instead of calling a geocoder.
  - `ocrService` — simulated document classification/extraction (deterministic
    from the filename; nothing is read from the image; nothing leaves the
    browser).
  - `sttService` — speech-to-text abstraction: Whisper-tiny running fully
    in-browser via `@huggingface/transformers` (free, no API key; ~40 MB model
    downloaded from the Hugging Face Hub on first use), with an automatic
    clearly-labeled demo-transcript fallback when the model can't load.
  - `deviceService` — simulated technical/audit info (documentation-range IP).
- **Decision tree (`src/content/decisionTree.ts`):** declarative question list
  with `showIf` skip logic and a `classify()` that maps answers to a suggested
  category + priority. Guidance content lives in `src/content/guidance.ts`,
  incident-form definitions in `src/content/incidentFields.ts` — all editable
  content, not hard-coded into components.

## Languages

English and Hindi ship working; the header switcher changes the whole UI.
Dictionaries live in `src/i18n/locales/<lang>/` split by namespace (`common`,
`publicPages`, `auth`, `flow`, `tree`, `media`, `dash`). To add a language:
copy the `en/` folder, translate, register the locale in `src/i18n/index.tsx`
(`LANGS` + the `DICTS` import). `t()` falls back to English per key, so a
partial translation never breaks the UI.

## Accessibility

Semantic HTML, keyboard navigation, GOV.UK-style focus indicators, error
summaries linked to inputs, skip link, one `h1` per page, ≥44 px tap targets,
and a header Accessibility panel with text size / high contrast / reduced
motion (persisted per device; high contrast swaps the whole token palette in
CSS).

## Test hooks

Append query params **before** the hash: `?e2e=login` signs in the demo
account, `?e2e=reset` wipes all demo storage, `?lang=hi` starts in Hindi.
`?e2e=chat` seeds a finished chat-intake conversation on `#/chat` (the
"Review and submit" state); `?e2e=chatform` seeds the same conversation
already morphed into the pre-filled form.
Example: `…/build-what-moves-india2/?e2e=login#/dashboard`.

## Replacing mocks with real APIs later

Each service module is the seam: keep the exported signatures, replace the
bodies with `fetch` calls (auth → real OTP/KYC flows, geoService → a real
reverse geocoder, ocrService → a document-AI endpoint, sttService already
supports pluggable providers, reportService → the NCRP backend). The UI never
talks to storage directly.

## Known limitations

- Everything is per-browser: reports are only trackable where they were filed.
- Uploaded files and recorded audio are held in memory, not persisted — after
  a refresh the metadata list remains but file contents are gone (labeled in
  the UI).
- The Whisper model needs a first-time download (~40 MB); offline or on very
  slow devices the demo transcript fallback is used and labeled as such.
- Hindi + English only for now; the i18n layer is ready for more.
- No real identity verification, geocoding, OCR, or submission — by design.
