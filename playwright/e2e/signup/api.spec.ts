import { test, expect } from "@playwright/test";
import { openSignup } from "../fixtures/signup";
import {
  buildUser,
  toE164,
} from "../data/signup.data";
import { validSignupEdgeCases } from "../data/valid-inputs";

// Everything about POST /api/accounts lives in this file.
//   1. Through the form : submit the real UI, inspect the request/response the browser made (runs in EN and FR).
//   2. Direct calls     : hit the endpoint without the UI to check the contract and server-side rules (runs once).

test.describe("Account API: through the signup form", () => {
  test("POST /api/accounts returns 201 and echoes the submitted data", async ({
    page,
  }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    const { locale } = signupPage;
    // Core requirement: a valid signup creates the account and the response reflects what was typed.
    const user = buildUser();

    await test.step("fill and submit a valid form", async () => {
      await signupPage.fill(user);
    });
    const response =
      await test.step("capture the account-creation response", () =>
        signupPage.submitAndWaitForAccount());

    await test.step("status is 201", async () => {
      expect(response.status()).toBe(201);
    });

    await test.step("request carries the entered values and page language", async () => {
      expect(response.request().postDataJSON()).toMatchObject({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: toE164(user.phone),
        region: user.region,
        language: locale,
        consentAgreement: user.partnerConsent,
      });
    });

    await test.step("response body echoes the entered values and hides the password", async () => {
      const body = await response.json();
      expect(body.account).toMatchObject({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: toE164(user.phone),
        region: user.region,
        preferredLanguage: locale,
      });
      expect(body.account.id).toEqual(expect.any(Number));
      expect(JSON.stringify(body)).not.toContain(user.password);
    });
  });

  test("accepts valid edge-case inputs", async ({ page }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    // Boundary and special-character inputs that must still succeed; each gets a clean session.
    for (const c of validSignupEdgeCases()) {
      await test.step(`${c.name} returns 201`, async () => {
        await signupPage.startOver();
        await signupPage.fill(c.user);
        const response = await signupPage.submitAndWaitForAccount();
        expect(response.status()).toBe(201);
        if (c.request) {
          expect(response.request().postDataJSON()).toMatchObject(c.request);
        }
        if (c.account) {
          expect((await response.json()).account).toMatchObject(c.account);
        }
      });
    }
  });

  test("rejects a duplicate email", async ({ page }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    // The same email cannot register twice; the second attempt fails and the user stays on the form.
    const email = buildUser().email;

    await test.step("register the email once", async () => {
      await signupPage.fill({ ...buildUser(), email });
      expect((await signupPage.submitAndWaitForAccount()).status()).toBe(201);
    });

    await test.step("register it again from a clean session", async () => {
      await signupPage.startOver();
      await signupPage.fill({ ...buildUser(), email });
      const response = await signupPage.submitAndWaitForAccount();
      expect(response.status()).toBe(400);
      await expect(signupPage.page).toHaveURL(/\/signup/);
    });

    await test.step("an upper-cased version of the email is also a duplicate", async () => {
      await signupPage.startOver();
      await signupPage.fill({ ...buildUser(), email: email.toUpperCase() });
      const response = await signupPage.submitAndWaitForAccount();
      expect(response.status()).toBeLessThan(500);
      expect(response.ok()).toBe(false);
    });
  });
});
