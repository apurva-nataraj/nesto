import { test, expect } from "@playwright/test";
import { openSignup } from "../fixtures/signup";
import {
  buildUser,
  toE164,
} from "../data/signup.data";

test.describe("API verification with UI sign up", () => {
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
        leadDistributeConsentAgreement: user.partnerConsent,
      });
    });

    await test.step("response body persists the entered values and hides the password", async () => {
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
});
