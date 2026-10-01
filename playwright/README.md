# nesto signup suite (Playwright + TypeScript)

Automated tests for new sign up flow in English and French.

Deliverables that travel with this code:

- [`Assumptions.md`](./Assumptions.md)
- [`Bug_Report.md`](./Bug_Report.md)

## Run

```bash
yarn test            # both languages
yarn test:en         # English only  (project chromium-en, /signup)
yarn test:fr         # French only   (project chromium-fr, /fr/signup)
yarn run:e2e:ui      # watch it run
yarn report          # open the last HTML report
```

## How the two languages work

Each Playwright project (`chromium-en`, `chromium-fr`) runs the same specs. The `locale` fixture reads the project name and selects the copy in `e2e/i18n/signup.copy.ts` and the URL prefix (`""` or `/fr`). The app picks its language from the URL, not from the browser locale.

## Notes

- The happy-path tests create real accounts on the QA environment, using unique emails.
- Defects listed in `BUG_REPORT.md` are either left unasserted or, where the intended behaviour is clear, checked with `test.fail()` so the test starts reporting as soon as the bug is fixed.