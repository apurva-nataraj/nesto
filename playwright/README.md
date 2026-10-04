# nesto signup suite (Playwright + TypeScript)

End-to-end tests for the new signup flow on QA (`https://app.qa.nesto.ca`), in English (`/signup`) and French (`/fr/signup`).

Chromium only. Language comes from the URL, not from the browser locale. The same specs run under two Playwright projects (`chromium-en`, `chromium-fr`); `openSignup` reads the project name and loads the matching copy and path prefix.

Nothing is mocked. Happy-path tests create real accounts on QA with unique `qa+<uuid>@example-qa.com` emails. Direct API tests hit `POST /api/accounts` with Playwright’s `request` fixture.

Companion notes (not required to run the suite):

- [Assumptions.md](./Assumptions.md) — inferred product rules, API contract, and what is out of scope
- [Bug_Report.md](./Bug_Report.md) — defects found during QA and how (or whether) the suite tracks them

## Setup

```bash
npm install
npx playwright install chromium
```

Default `baseURL` is `https://app.qa.nesto.ca`. Override with `BASE_URL` if needed. Do not point this suite at production: it writes real accounts.

## Run

```bash
npm test            # both languages
npm run test:en     # English only  (project chromium-en, /signup)
npm run test:fr     # French only   (project chromium-fr, /fr/signup)
npm run test:headed # headed browser
npm run run:e2e:ui  # Playwright UI
npm run report      # last HTML report
npm run typecheck
```

## Layout

```
playwright.config.ts               chromium-en + chromium-fr, baseURL, HTML + list reporters
e2e/
  fixtures/signup.ts               openSignup(page, testInfo) — locale, copy, page object
  pages/signup.page.ts             locators and flows (goto, fill, submit, startOver)
  locatorTextCopy/signup.copy.ts   EN/FR chrome, errors, URL prefixes (as the page ships today)
  data/
    signup.data.ts                 unique users, E.164 helper, API payload
    invalid-inputs.ts              table-driven bad names, emails, phones, passwords
    valid-inputs.ts                boundary / special-character cases that must still 201
  signup/
    fields-and-labels.spec.ts      untouched page, a11y names, tab order, language toggle
    validation.spec.ts             client-side rejects (no POST), empty form, double-click + Enter
    api.spec.ts                    POST /api/accounts via the form and as direct calls
.github/workflows/playwright.yml   typecheck + EN/FR jobs in parallel on PR/push
```

Repeated cases (invalid emails, password edges, and so on) run as `test.step` blocks inside one test so the report names the failing case without a huge test count.

A successful signup logs the browser in and disables the form. Tests that create more than one account call `startOver()` (clear cookies, reopen signup).

## What the specs cover

**fields-and-labels** — localized chrome, locator names, input types, defaults (Canada phone, 13 provinces), links, tab order, consent, language toggle.

**validation** — invalid names, emails, phones, and passwords never hit `POST /api/accounts`. Empty submit flags required fields; double-click sends one request; Enter submits.

**api (form, EN and FR)** — 201 with echoed name, email, E.164 phone, region, and language; password not returned. Edge cases and duplicate email (400, stays on `/signup`).

**api (direct, English project)** — contract checks (201, 422, 400). BUG-11, 12 and 13 (API weaker than the form) use `test.fail()` so the suite stays green until the server catches up.

Other bugs live in `Bug_Report.md`.

## CI

`.github/workflows/playwright.yml` type-checks, then runs `chromium-en` and `chromium-fr` as parallel jobs on push/PR to `main`/`master` (and on `workflow_dispatch`). Each job uploads an HTML report.