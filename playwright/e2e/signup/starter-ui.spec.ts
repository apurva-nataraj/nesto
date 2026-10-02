import { test, expect } from "@playwright/test";
import { openSignup } from "../fixtures/signup";

test("signup page loads with the form and submit button", async ({
  page,
}, testInfo) => {
  const signupPage = await openSignup(page, testInfo);

  await expect(signupPage.heading).toBeVisible();
  await expect(signupPage.firstName).toBeVisible();
  await expect(signupPage.email).toBeVisible();
  await expect(signupPage.password).toBeVisible();
  await expect(signupPage.submitButton).toBeEnabled();
});
