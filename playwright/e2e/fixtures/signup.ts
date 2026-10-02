import type { Page, TestInfo } from "@playwright/test";
import { textCopy } from "../locatorTextCopy/signup.copy";
import { SignupPage } from "../pages/signup.page";

// Opens the signup page in the language of the current project (projects ending in "-fr" run in French).
// The returned page object exposes `locale` and `copy` too.
export async function openSignup(page: Page, testInfo: TestInfo) {
  const locale = testInfo.project.name.endsWith("-fr") ? "fr" : "en";
  const signupPage = new SignupPage(page, locale, textCopy[locale]);
  await signupPage.goto();
  return signupPage;
}
