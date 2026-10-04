import { test, expect } from "@playwright/test";
import { openSignup } from "../fixtures/signup";
import { accountPayload, buildUser, toE164 } from "../data/signup.data";
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
        leadDistributeConsentAgreement: user.partnerConsent,
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

  test("Accepts valid edge-case inputs", async ({ page }, testInfo) => {
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

  test("Rejects a duplicate email", async ({ page }, testInfo) => {
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

test.describe("Account API: direct calls (no UI)", () => {
  test.beforeEach(({}, testInfo) => {
    // The API is language-independent, so it runs once (English project) instead of once per language.
    test.skip(
      testInfo.project.name.endsWith("-fr"),
      "language-independent, covered by the EN run",
    );
  });

  test("API accepts valid data and rejects malformed requests", async ({
    request,
  }) => {
    // Bypasses the form to check the contract the front end relies on, and that the API rejects bad input itself.
    const user = buildUser();

    await test.step("valid payload returns 201 with the account", async () => {
      const response = await request.post("/api/accounts", {
        data: accountPayload(user),
      });
      expect(response.status()).toBe(201);
      const { account } = await response.json();
      expect(account).toMatchObject({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: toE164(user.phone),
        region: user.region,
        preferredLanguage: "en",
      });
      expect(JSON.stringify(account)).not.toContain(user.password);
    });

    await test.step("French is an accepted language", async () => {
      const response = await request.post("/api/accounts", {
        data: { ...accountPayload(), language: "fr" },
      });
      expect(response.status()).toBe(201);
      expect((await response.json()).account.preferredLanguage).toBe("fr");
    });

    for (const [name, bad, parameter] of [
      ["invalid email", { email: "not-an-email" }, "email"],
      ["unknown region", { region: "ZZ" }, "region"],
      ["unknown language", { language: "xx" }, "language"],
    ] as const) {
      await test.step(`${name} returns 422 naming the field`, async () => {
        const response = await request.post("/api/accounts", {
          data: { ...accountPayload(), ...bad },
        });
        expect(response.status()).toBe(422);
        expect((await response.json()).parameters).toContain(parameter);
      });
    }

    await test.step("password shorter than 12, longer than 32 or without a digit is refused", async () => {
      for (const password of [
        "Short1abcde",
        "Aa1" + "x".repeat(30),
        "NoNumbersHereAtAll",
      ]) {
        const response = await request.post("/api/accounts", {
          data: { ...accountPayload(), password },
        });
        expect(response.ok(), `password "${password}"`).toBe(false);
      }
    });

    await test.step("malformed JSON returns 400", async () => {
      const response = await request.post("/api/accounts", {
        data: "{not json",
        headers: { "content-type": "application/json" },
      });
      expect(response.status()).toBe(400);
    });
  });

  // Known server-side gaps (BUG-11 to BUG-13). test.fail() keeps the suite green while they exist and turns it red
  // as soon as every one is fixed, which is the prompt to delete this marker and promote the checks to regular tests.
  test("API enforces the same rules as the form", async ({ request }) => {
    test.fail(
      true,
      "BUG-11, BUG-12 and BUG-13: server-side validation is weaker than the form",
    );

    await test.step("password without an uppercase or lowercase letter is refused", async () => {
      for (const password of ["alllowercase123", "ALLUPPERCASE123"]) {
        const response = await request.post("/api/accounts", {
          data: { ...accountPayload(), password },
        });
        expect
          .soft(response.ok(), `password "${password}" should be refused`)
          .toBe(false);
      }
    });

    await test.step("missing or invalid names are refused", async () => {
      for (const body of [
        { firstName: "" },
        { lastName: "" },
        { firstName: "12345" },
        { firstName: "<b>Odd Name</b>" },
      ]) {
        const response = await request.post("/api/accounts", {
          data: { ...accountPayload(), ...body },
        });
        expect
          .soft(response.ok(), `${JSON.stringify(body)} should be refused`)
          .toBe(false);
      }
    });

    await test.step("invalid phone is refused", async () => {
      const response = await request.post("/api/accounts", {
        data: { ...accountPayload(), phone: "123" },
      });
      expect.soft(response.ok(), "phone 123 should be refused").toBe(false);
    });

    await test.step("empty body is a client error, not a 500", async () => {
      const response = await request.post("/api/accounts", { data: {} });
      expect.soft(response.status(), "empty body").toBeLessThan(500);
    });
  });
});
