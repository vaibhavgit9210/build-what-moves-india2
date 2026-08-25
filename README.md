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

The **authority portal** at `#/admin/login` has its own roster of synthetic
officers, all sharing the password `Officer@123`. Sign in with a badge id, or
press "Use this account" on any row:

| Badge | Officer | Rank | Unit |
| --- | --- | --- | --- |
| `KA-CYB-1042` | SI Meera Nair | Investigating officer | Bengaluru City Cyber Cell |
| `KA-CYB-1188` | SI Arjun Patil | Investigating officer | Bengaluru City Cyber Cell |
| `KA-CYB-2001` | Inspector Lakshmi Rao | Cyber cell in-charge | Bengaluru City Cyber Cell |
| `DL-CYB-3307` | ASI Kavita Reddy | Investigating officer | Delhi North Cyber Cell |
| `DL-CYB-3419` | SI Harpreet Gill | Investigating officer | Delhi North Cyber Cell |
| `DL-CYB-4100` | Inspector Devendra Kumar | Cyber cell in-charge | Delhi North Cyber Cell |

The authority session lives under its own localStorage key, so a citizen
session can never open a ticket and an officer session can never open the
citizen dashboard.

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

## The accountability revamp

The research on the real NCRP (2.4 percent of complaints become FIRs, "Under
process" forever, disposed-without-reason, 1930 that does not connect) drove a
structural redesign, not just a reskin:

- **17 legally-grounded categories** replacing the terminology-first list:
  every category names its statutes (IT Act 2000, Bharatiya Nyaya Sanhita
  2023, POCSO 2012, BUDS Act 2019, DPDP Act 2023). New lanes: investment/job
  scams, loan-app harassment, romance scams, sextortion, data breaches and a
  dedicated child-safety emergency lane, so nothing falls between categories.
- **Every case starts, moves and ends.** `src/content/casePlans.ts` gives each
  category a service standard: officer assigned (1 to 24 h), first contact
  (6 to 72 h), mandatory update cadence (3 to 15 days), resolve-or-close-with-
  written-reason target (30 to 90 days). Eternal "Under process" is not a
  state the system can be in.
- **A named owner from minute one**: every report gets an investigating
  officer (name, unit, masked phone) visible on the case, the success page and
  public tracking.
- **The escalation matrix**: a missed deadline arms a one-click escalation,
  level by level: IO → Cyber Cell In-charge → District Nodal Officer → State
  Nodal + I4C → public escalation, where the portal drafts a social post
  tagging the accountable authorities (non-anonymous reports only; posting is
  always the reporter's choice). Each level owes a response within 48 hours.
- **The clarity packet**: after submitting (form or chat), the reporter sees
  8 sections in plain bullets: what this problem is in law, what happens now
  with dates, who is handling it, how updates arrive, how to track, how to
  escalate, possible outcomes, and what the law provides on conviction. An
  optional AI retelling (gpt-oss via the worker `/brief` route) may only
  restate those facts.
- **First aid stays first**: 1930 golden-hour guidance, 112 and Childline 1098
  are kept at the top of guidance, the success page and `#/promise`.
- **`#/promise`** publishes the whole contract: lifecycle, SLA table per
  category, and the matrix. The report detail page ships demo controls
  (simulate officer update / missed deadline) so the loop can be presented
  end to end. Acknowledgement numbers are 14-digit, matching the real NCRP.

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
  to `api.openai.com`.
- **OpenAI `gpt-oss-120b`, free, the default**: without a key, each free-text
  message goes to the `sahayata-help` worker's `/intake` route, which runs
  OpenAI's open-weight gpt-oss-120b on Cloudflare's keyless Workers AI
  binding (no key, no cost, works for every visitor). The worker returns the
  model's raw JSON; the client validates and merges it.
- **Built-in demo parser** as the last fallback, with a visible per-turn
  notice when a model call fails (`src/services/intakeService.ts`):
  deterministic rules for amounts (`₹20,000`, `2 lakh`, `20k`), UPI handles,
  phone numbers, transaction ids, platforms, relative dates ("yesterday
  evening" is stored through the form's honest "roughly when" mechanism, never
  as an invented timestamp), category keywords and a sentiment/urgency
  lexicon, in English and Hindi. Money moved recently surfaces a "call 1930
  now" banner.

## The authority portal

`#/admin` is the other side of the accountability loop: the officer a report
was assigned to can sign in and work it. It is a separate route tree behind a
separate session, sharing the same design language.

- **Roster, not random.** `src/content/authorityRoster.ts` is the contract file
  for the authority side (the twin of `casePlans.ts`): six synthetic officers
  with badge ids, units, ranks and category specialisations. `reportService`
  assigns officers from it deterministically (specialists first, then round
  robin on the acknowledgement number), so the officer named to the reporter is
  the same person who can log in and see the ticket.
- **Queue.** `#/admin/tickets` lists the tickets assigned to you, with the
  overdue flag read straight off the report's own `nextUpdateDue`. Hold the
  `in-charge` rank and you see every ticket in your unit and can reassign
  them, mirroring level 2 of the escalation matrix.
- **Verification.** A ticket moves through `pending` → `verified` /
  `needs-more-info` / `rejected`, each with a mandatory note and a timestamp.
  The note is shown to the reporter. This is a real workflow step, kept
  visually apart from the reporter-page demo controls that fake the backend.
- **FIR preparation pack.** Unlocked only once a ticket is verified.
  `#/admin/tickets/:id/fir-prep` lays the case out on the standard Indian FIR
  proforma updated for the BNS 2023 regime: acts and sections pulled from
  `casePlans.ts`, dates and place from the record, property particulars,
  evidence list, and an officer checklist covering cognizability,
  jurisdiction, evidence completeness, Zero FIR and the fourteen-day
  preliminary-enquiry window. "Print or save as PDF" uses the browser's own
  print path (A4 `@page` rules, app chrome hidden), so there is no PDF
  library and no server.
- **PII gate.** Identity details render masked. The officer can request them
  with a written reason; the reporter approves or denies it on their own
  report page; only then do they unmask, on that one ticket, with the grant
  timestamped. Anonymous reports never show the request at all, because there
  is nothing to release. Incident evidence (amounts, UPI ids, transaction
  ids, scammer handles) is never masked: that is the case, not the person.
- **Activity log.** Every verification change, update, reassignment and
  identity request with its outcome, in order, on the ticket. This is what
  makes the gate accountable rather than decorative.
- **Updates reach the reporter.** Anything the officer posts is appended to
  the report's existing `updates` array, the same list the tracking page and
  dashboard already render. There is no second notification channel.

The AI half is one new worker route, `/fir-prep`, following the `/ask`
provider chain (Groq `llama-3.3-70b-versatile` when `GROQ_API_KEY` is set,
keyless Workers AI otherwise, canned fallback last). It returns exactly two
things, the officer checklist and a plain-language "brief facts" paragraph;
every other section of the pack is assembled client side from the record, so
the model cannot invent a section. **It is never sent reporter PII** (no name,
contact details, identity document or OCR output) even after identity access
has been granted, which is asserted by the test harness.

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
- **State:** four contexts — `AuthContext` (citizen session),
  `AdminAuthContext` (authority session, deliberately separate), `DraftContext` (the
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
  - `adminAuthService` — authority sign in by badge id, in its own
    localStorage namespace (`ncrpdemo.admin.session`).
  - `adminService` — ticket scoping, verification, officer updates,
    reassignment, the PII request/grant gate and the per-ticket audit log.
  - `firPrepService` — builds the PII-free FIR payload and calls the worker's
    `/fir-prep` route, falling back to the canned pack.
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
`?e2e=adminlogin` signs in to the authority portal as SI Meera Nair;
`?e2e=adminticket` does the same and marks her financial-fraud ticket
verified, so the FIR prep step is one click away.
Examples: `…/build-what-moves-india2/?e2e=login#/dashboard`,
`…/build-what-moves-india2/?e2e=adminlogin#/admin/tickets`.

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
- Hindi + English only for now; the i18n layer is ready for more. The
  `admin` namespace is English only at this stage: `t()` falls back to
  English per key, so the authority portal reads in English even with the
  Hindi switcher on.
- The authority portal's FIR pack "save as PDF" is the browser print dialog,
  not a generated file. Deliberate: no PDF library, nothing server side.
- No real identity verification, geocoding, OCR, or submission — by design.
