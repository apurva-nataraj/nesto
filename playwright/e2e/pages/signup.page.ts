import { expect, type Locator, type Page } from "@playwright/test";
import type { Locale, SignupCopy } from "../locatorTextCopy/signup.copy";
import type { SignupUser } from "../data/signup.data";

type SignupField =
  | "first-name"
  | "last-name"
  | "phone"
  | "region"
  | "email"
  | "password"
  | "passwordConfirmation";

export class SignupPage {
  readonly firstName: Locator;
  readonly firstNameLabel: Locator;
  readonly lastName: Locator;
  readonly lastNameLabel: Locator;
  readonly phone: Locator;
  readonly phoneLabel: Locator;
  readonly phoneCountry: Locator;
  readonly region: Locator;
  readonly regionLabel: Locator;
  readonly email: Locator;
  readonly emailLabel: Locator;
  readonly password: Locator;
  readonly passwordLabel: Locator;
  readonly passwordConfirmation: Locator;
  readonly passwordConfirmationLabel: Locator;
  readonly partnerConsent: Locator;
  readonly submitButton: Locator;
  readonly languageSwitch: Locator;
  readonly headerLogin: Locator;
  readonly loginLink: Locator;
  readonly termsLink: Locator;
  readonly heading: Locator;

  constructor(
    readonly page: Page,
    readonly locale: Locale,
    readonly copy: SignupCopy,
  ) {
    this.firstName = page.getByTestId("first-name-input");
    this.firstNameLabel = page.getByTestId("first-name-input-placeholder");
    this.lastName = page.getByTestId("last-name-input");
    this.lastNameLabel = page.getByTestId("last-name-input-placeholder");
    this.phone = page.getByTestId("phoneInput");
    this.phoneLabel = page.getByTestId("input-placeholder");
    this.phoneCountry = page.locator("select.PhoneInputCountrySelect");
    this.region = page.getByTestId("region-select");
    this.regionLabel = page.getByTestId("select-placeholder");
    this.email = page.getByTestId("email-input");
    this.emailLabel = page.getByTestId("email-input-placeholder");
    this.password = page.getByTestId("password-input");
    this.passwordLabel = page.getByTestId("password-input-placeholder");
    this.passwordConfirmation = page.getByTestId("passwordConfirmation-input");
    this.passwordConfirmationLabel = page.getByTestId(
      "passwordConfirmation-input-placeholder",
    );
    this.partnerConsent = page.getByTestId("agreement-checkbox");
    this.submitButton = page.getByTestId("submit-button");
    this.languageSwitch = page.getByTestId("header-language-switch");
    this.headerLogin = page.getByTestId("header-login-button");
    this.loginLink = page.getByTestId("login-link");
    this.termsLink = page.getByTestId("terms-link");
    this.heading = page.getByRole("heading", { level: 2 });
  }

  async goto() {
    await this.page.goto(`${this.copy.urlPrefix}/signup`);
    await expect(this.submitButton).toBeVisible();
    // The province of purchase is rendered asynchronously; wait until it settles.
    await expect(this.region).not.toHaveValue("");
  }

  // Logs out (a successful signup logs the browser in) and reopens an empty signup form.
  async startOver() {
    await this.page.goto("about:blank");
    await this.page.context().clearCookies();
    await this.goto();
  }

  error(field: SignupField) {
    return this.page.getByTestId(`${field}-error-message-typography`);
  }

  async fill(user: SignupUser) {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.phone.fill(user.phone);
    await this.region.selectOption(user.region);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.passwordConfirmation.fill(user.passwordConfirmation);
    await this.partnerConsent.setChecked(user.partnerConsent);
  }

  async submit() {
    await this.submitButton.click();
  }

  // Clicks submit and resolves with the account-creation response.
  async submitAndWaitForAccount() {
    const responsePromise = this.page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname === "/api/accounts",
    );
    await this.submit();
    return responsePromise;
  }

  // True if the app fired an account-creation request. Used to prove invalid forms are blocked client-side.
  trackAccountRequests(): { count: () => number } {
    let n = 0;
    this.page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        new URL(r.url()).pathname === "/api/accounts"
      )
        n += 1;
    });
    return { count: () => n };
  }
}
