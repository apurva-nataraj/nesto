# Assumptions

## Scope and environment

1. The target is the QA environment at `app.qa.nesto.ca` for creating accounts.
2. After a successful signup the app logs the user in and redirects into a different (out of scope) flow.
3. Chromium is the only browser.
4. Expected behaviour comes from the UI copy (password policy text), the app's own translation files and common signup conventions.

## Languages

1. Language is chosen by URL (`/signup` = EN, `/fr/signup` = FR), which matches the FR/EN toggle links. Browser locale does not change it, so the suite selects the language by URL.
2. Expected copy is kept in one file and compared exactly, including known copy defects as they currently ship. A copy fix is then a one-line update in that file.
3. Language check for French was done with Google translate.
4. Other known defects are written within `Bug_Report.md`.

## Form rules I inferred

1. All text fields, the phone number and the password are required. The partner-consent checkbox is optional (the API accepts `leadDistributeConsentAgreement: false`).
2. Password policy comes from the on-page helper: 12 to 32 characters, at least one uppercase letter, one lowercase letter and one number. A 33-character password is assumed invalid. Spaces are allowed and are covered as a valid edge case in `valid-inputs.ts`.
3. Names reject digits and markup on the form (an error is shown and no POST is sent; the exact "Invalid name" string is not asserted). Very long values showed "Too many characters" at 300 characters in exploration; the limit is unknown and not asserted. Whitespace-only names count as empty. Hyphens, accents and apostrophes are valid.
4. The phone country defaults to Canada and the phone is sent as E.164 (`+1905...`). Tests use a fictitious 905-555-01xx number. QA does not verify it. The form rejects an overlong number on submit; the input itself has no maxlength (BUG-13).
5. Province is pre-filled from IP geolocation. Tests always set it explicitly, so results do not depend on where they run.
6. Email uniqueness is enforced by the API: an exact repeat returns 400 (asserted), and an upper-cased repeat must also be rejected without a 5xx (asserted). The form stays on `/signup` and shows a generic toast ("Something went wrong! … contact your advisor") rather than an email-field message (BUG-06; toast not asserted).
7. Leading and trailing spaces around the email are trimmed by the app. Observed during exploration; not asserted.
8. Plus-addressed emails on a subdomain (`qa+tag@mail.example-qa.com`) are valid.

## API contract

1. The account-creation call is `POST /api/accounts`, discovered by inspecting network traffic. It returns `201` with `{ "account": {...} }`.
2. "Response contains the information entered" is asserted on `account.firstName`, `lastName`, `email`, `phone` (E.164), `region` and `preferredLanguage`. The request body additionally carries `language` and `leadDistributeConsentAgreement`.
3. The password must not appear in the JSON response (asserted). Requests and responses are expected to be JSON. URL and web-storage checks are not in the suite.
4. The API is tested at two levels. The UI specs observe the real request through the browser (`waitForResponse`). `api.spec.ts` calls the endpoint directly with Playwright's `request` fixture (the equivalent of a Postman collection) to check the contract and server-side validation without the form. Nothing is mocked.
5. The endpoint is called without an auth token because the signup form does not send one. The request field set (`passwordSpecified`, `createdAt`, `partner`, `leadDistributeConsentAgreement`, ...) is copied from what the form sends.
6. A client-only rule is not real validation. `api.spec.ts` asserts that the server refuses what the form refuses (BUG-10, 11, 12) under `test.fail()` so the suite stays green until those gaps close.
7. Double-clicking the button must send one request, and Enter in a field must submit the form.

## Test design

1. Every test uses a unique email so tests are independent and can run in parallel and in any order.
2. Because a successful signup authenticates the session and disables the form, tests that create more than one account call `startOver()` (clear cookies, reopen signup).
3. The suite is compact: ten UI tests per language, plus two direct-API tests on the English project only. Repeated cases run as `test.step` blocks so a failure names the case without a huge test count.
4. There is zero test-interdependency.
5. Validation tests also assert that no `POST /api/accounts` was issued, proving the form is blocked client-side.
6. Coverage is risk-based. Highest priority is the path that creates a customer account (201 and data integrity), then validation that protects data quality, then localization, then cosmetic copy. Section priorities map to the bug severities in `Bug_Report.md`.
7. Every locator, message and status code in the suite and both reports was checked against the live QA environment.
8. CI: `.github/workflows/playwright.yml` runs `chromium-en` and `chromium-fr` as parallel jobs on every pull request, type-checks first and uploads an HTML report per language. Because the tests write real accounts to QA, they should run against QA only, never production.

## Not covered

- Full accessibility audit, mobile viewports, visual regression.
- Rate limiting, email verification and password reset flows.
- Login redirect after signup and cleanup of created accounts (no delete endpoint was available to me).
