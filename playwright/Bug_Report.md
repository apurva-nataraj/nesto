# Bug report: `app.qa.nesto.ca/signup`

Environment: QA, Chromium, tested 2026-09-30, English (`/signup`) and French (`/fr/signup`).

Severity:

- **High** = bad data can enter the system or a customer is blocked
- **Medium** = confusing or inconsistent behaviour
- **Low** = cosmetic or copy.

The suite stays green against current QA. It does not assert intended-but-broken UI behaviour. Copy defects that the page still ships are stored in `signup.copy.ts`. BUG-10 to BUG-12 are the exception: `api.spec.ts` uses `test.fail()` so the checks run, the suite stays green while they fail, and it turns red when the API fixes are shipped.


| ID     | Severity | Area            | Summary                                                                             | Suite                                     |
| ------ | -------- | --------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| BUG-01 | Low      | FR copy         | Password helper is ungrammatical ("au entre")                                       | Shipped copy                              |
| BUG-02 | Medium   | Validation      | Empty email/phone show "invalid" instead of "required"                              | Not asserted                              |
| BUG-03 | Low      | Validation copy | Password minimum message says "letters" instead of "characters"                     | Shipped copy                              |
| BUG-04 | Medium   | Validation      | Empty "Confirm password" shows no error                                             | Not asserted                              |
| BUG-05 | Low      | i18n            | Phone country selector is not localized in French                                   | Not asserted                              |
| BUG-06 | Medium   | API / UX        | API returns 400 `bad format` but UI shows `Something went wrong!`. Not descriptive. | Toast not descriptive in UI               |
| BUG-07 | Medium   | FR copy / legal | French consent text is not a translation of the English text                        | Not asserted                              |
| BUG-08 | Low      | EN copy         | Province option spelled "British-Columbia"                                          | Not asserted                              |
| BUG-09 | Medium   | Security        | Tenant/Auth0 config and third-party keys in the page payload (to verify)            | Not asserted                              |
| BUG-10 | High     | API validation  | API accepts passwords missing an uppercase or lowercase letter                      | `test.fail()` in `api.spec.ts`            |
| BUG-11 | High     | API validation  | API accepts missing names, digits/HTML in names, and invalid phones                 | `test.fail()` in `api.spec.ts`            |
| BUG-12 | Medium   | API             | Empty request body returns 500                                                      | `test.fail()` in `api.spec.ts`            |
| BUG-13 | Low      | Validation / UX | Phone accepts unlimited digits; error only appears on submit                        | Submit blocked; typing limit not asserted |


IDs are stable. BUG-10 to 12 were found by a direct API call. Rest were identified during manual & exploratory testing.

---

## BUG-01: French password helper text is ungrammatical

- **Steps:** open `/fr/signup`, read the text under "Mot de passe".
- **Actual:** "Le mot de passe doit contenir **au entre** 12 et 32 caractères et contenir au moins une lettre majuscule…"
- **Expected:** "entre" (drop leftover "au"); avoid repeating "contenir". English is fine.

## BUG-02: Empty email and phone show "invalid" instead of "required"

- **Steps:** open `/signup`, submit with all fields empty.
- **Actual:** names show "The field is required". Email shows "Invalid email". Phone shows "Invalid value". (FR: "Courriel invalide", "Valeur invalide".)
- **Expected:** empty required fields use the required message. Format messages stay for values that are present but invalid.

## BUG-03: Password minimum-length message says "letters"

- **Steps:** submit the empty form, or enter `Short1abcde`.
- **Actual:** "Minimum of 12 **letters** required" (FR: "Minimum de 12 **lettres** requises").
- **Expected:** "characters" / "caractères". Digits are allowed; the helper already says "characters".

## BUG-04: Empty "Confirm password" is not flagged

- **Steps:** submit the empty form.
- **Actual:** errors on first name, last name, phone, email and password. Confirm password has none (EN and FR).
- **Expected:** a required error. Mismatch is already reported once a password is typed.

## BUG-05: Phone country selector is not localized in French

- **Steps:** open `/fr/signup`, inspect the country selector next to "Téléphone".
- **Actual:** accessible name is "Phone number country"; country names stay in English; first option is "International".
- **Expected:** French accessible name and country names.

## BUG-06: Duplicate email returns a misleading API error and a generic toast

- **Steps:** create an account, then submit the same email again from a clean session (upper-cased repeat behaves the same).
- **Actual:** `POST /api/accounts` returns **400** `{"error":"bad format","description":"error creating account"}`. The form stays filled and on `/signup`. A toast appears: **"Something went wrong! Please try again and if you continue to have trouble feel free to contact your advisor"**. There is no message on the email field.
- **Expected:** 409 (or a specific 4xx such as `email_already_registered`). The UI should name the problem (this email is already registered) and point to login or password reset. Retrying will not help; the toast reads as a transient/ambiguous failure.

## BUG-07: French consent copy differs from English

- **Actual EN:** "…You agree to nesto sharing your mortgage information with its partners. You can opt-out at any time."
- **Actual FR:** "…Vous acceptez que nesto partage vos informations de demande hypothécaire avec ses partenaires, **si nous ne sommes pas en mesure de vous fournir nos services**. Vous pouvez vous désinscrire à tout moment."
- **Expected:** the same legal meaning in both languages. Compliance should confirm which wording is correct.

## BUG-08: "British-Columbia" spelling

- **Steps:** open "Province of purchase" on `/signup`.
- **Actual:** "British-Columbia" (value `BC`).
- **Expected:** "British Columbia". French already reads "Colombie-Britannique".

## BUG-09: Configuration and third-party keys in `__NEXT_DATA__` (needs verification)

Medium, not High: public Auth0 client IDs and similar keys are normal. It becomes High only if a key is unrestricted or is a secret.

- **Steps:** open `/signup` and read `document.getElementById('__NEXT_DATA__').textContent`.
- **Actual:** tenant, Auth0 config, and third-party API keys are in the payload.
- **Expected:** only values the browser needs. Restrict third-party keys by domain/referrer or scope. Keep secrets server-side. Values are not reproduced here.

## BUG-10: API does not enforce the full password policy

Anyone calling the API directly can create accounts weaker than the form promises.

- **Steps:** `POST /api/accounts` with `password` `alllowercase123`, then `ALLUPPERCASE123`.
- **Actual:** both **201**. Length (12–32) and "at least one number" are enforced (`401 {"error":"invalid password"}`).
- **Expected:** 4xx for missing uppercase or lowercase, matching the helper. 401 is the wrong status for a validation failure (400 or 422).

## BUG-11: API does not validate names or phone

Low-quality or hostile data reaches the customer record. Markup such as `<b>x</b>` is stored as typed.

- **Steps:** valid payload with (a) no `firstName`, (b) no `lastName`, (c) `firstName` = `12345`, (d) `firstName` = `<b>x</b>`, (e) `phone` = `123`.
- **Actual:** all **201**. The form rejects (c)–(e) and blocks empty names.
- **Expected:** same rules as the form, 422 naming the field (as for `email`, `region`, `language`).

## BUG-12: Empty request body returns 500

- **Steps:** `POST /api/accounts` with `{}`.
- **Actual:** **500**.
- **Expected:** 422 listing missing fields. Malformed JSON already returns 400; a body missing only `email` already returns 422.

## BUG-13: Phone field accepts unlimited digits with no inline feedback

- **Steps:** type 35 digits into Phone and leave the field.
- **Actual:** every digit is accepted; no `maxlength`, mask, or error until "Create your account". Submit then blocks and sends no request (`validation.spec.ts`).
- **Expected:** stop at 15 digits (E.164 max) or show an error on blur.
- **Related:** BUG-11 (API still accepts invalid phones).

---

## Observations (not filed)

- Email casing is stored as typed; uniqueness is case-insensitive. Consider normalizing.
- Leading and trailing spaces around the email are trimmed (not asserted).
- `/api/accounts` status codes are inconsistent: 201, 400 (malformed JSON and duplicates), 401 (bad password), 422 (bad email/region/language), 500 (empty body).
- Signup logs the user in and disables the form, so several signups need separate sessions.
- Third-party scripts (tag manager, pixels, session replay) load on the page; whether any fire before consent was not verified.

## Checked and working (automated)

- Account creation returns 201 in EN and FR and echoes name, email, E.164 phone, province and language; the password is not in the JSON response.
- API rejects invalid email, unknown region and unknown language (422), malformed JSON (400), and passwords that are too short, too long, or have no digit.
- Form password boundaries (12 and 32 valid, 11 and 33 invalid). A password containing spaces is accepted (`valid-inputs.ts`).
- Markup in a name (`<script>…</script>`) shows a field error and does not POST. That is not an XSS or SQL check.
- Double-click submit sends one request; Enter submits.

