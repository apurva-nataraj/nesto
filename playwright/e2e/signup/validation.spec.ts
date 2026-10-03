import { test, expect } from "@playwright/test";
import { openSignup } from "../fixtures/signup";
import { buildUser } from "../data/signup.data";
import {
  INVALID_EMAILS_AND_PHONES,
  INVALID_NAMES,
  INVALID_PASSWORDS,
} from "../data/invalid-inputs";

test.describe("Signup page: validation", () => {
  // Submitting an otherwise valid form with one bad value must show that field's error and never hit the API.
  for (const [title, cases] of [
    ["names", INVALID_NAMES],
    ["email and phone", INVALID_EMAILS_AND_PHONES],
    ["password", INVALID_PASSWORDS],
  ] as const) {
    test(`Rejects invalid ${title}`, async ({ page }, testInfo) => {
      const signupPage = await openSignup(page, testInfo);
      const { copy } = signupPage;
      const requests = signupPage.trackAccountRequests();

      for (const bad of cases) {
        await test.step(`${bad.name} is rejected`, async () => {
          const { field, message, ...fields } = bad;
          await signupPage.goto();
          await signupPage.fill({ ...buildUser(), ...fields });
          await signupPage.submit();
          if (message)
            await expect(signupPage.error(field)).toContainText(message(copy));
          else await expect(signupPage.error(field)).toBeVisible();
        });
      }

      expect(requests.count(), "no account request should be sent").toBe(0);
    });
  }

  test("Empty submit flags required fields, then errors clear once corrected", async ({
    page,
  }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    // Covers the blank-form path and the recovery path after fixing a field.
    const requests = signupPage.trackAccountRequests();

    await test.step("submit the untouched form", async () => {
      await signupPage.submit();
    });

    // Exact messages per field are asserted in the table-driven tests above.
    await test.step("every required field reports an error", async () => {
      for (const field of [
        "first-name",
        "last-name",
        "phone",
        "email",
        "password",
      ] as const) {
        await expect(signupPage.error(field)).toBeVisible();
      }
      await expect(signupPage.firstName).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    await test.step("focus moves to the first invalid field", async () => {
      await expect(signupPage.firstName).toBeFocused();
    });

    await test.step("fixing the email removes its error", async () => {
      await signupPage.email.fill(buildUser().email);
      await signupPage.submit();
      await expect(signupPage.error("email")).toHaveCount(0);
    });

    expect(requests.count(), "no account request should be sent").toBe(0);
  });

  test("Multiple clicks of Submit button, and Enter key submission works", async ({
    page,
  }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    // Double-clicking must not create two accounts; pressing Enter must submit like the button does.
    await test.step("double-clicking submit sends a single request", async () => {
      await signupPage.startOver();
      const requests = signupPage.trackAccountRequests();
      await signupPage.fill(buildUser());
      const responsePromise = signupPage.page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          new URL(r.url()).pathname === "/api/accounts",
      );
      await signupPage.submitButton.dblclick();
      expect((await responsePromise).status()).toBe(201);
      await signupPage.page.waitForTimeout(1_000);
      expect(requests.count()).toBe(1);
    });

    await test.step("pressing Enter in a field submits the form", async () => {
      await signupPage.startOver();
      await signupPage.fill(buildUser());
      const responsePromise = signupPage.page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          new URL(r.url()).pathname === "/api/accounts",
      );
      await signupPage.email.press("Enter");
      expect((await responsePromise).status()).toBe(201);
    });
  });
});
