import { test, expect } from "@playwright/test";
import { openSignup } from "../fixtures/signup";
import { textCopy } from "../locatorTextCopy/signup.copy";

test.describe("Signup page: fields and labels", () => {
  test("Untouched page shows localized chrome, defaults and form extras", async ({
    page,
  }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    const { copy } = signupPage;

    await test.step("title, heading and CTA are localized", async () => {
      await expect(page).toHaveTitle(copy.pageTitle);
      await expect(signupPage.heading).toHaveText(copy.heading);
      await expect(signupPage.submitButton).toHaveText(copy.submit);
      await expect(signupPage.submitButton).toBeEnabled();
    });

    await test.step("each field shows its localized floating label", async () => {
      const labels = [
        [signupPage.firstNameLabel, copy.firstName],
        [signupPage.lastNameLabel, copy.lastName],
        [signupPage.phoneLabel, copy.phone],
        [signupPage.regionLabel, copy.region],
        [signupPage.emailLabel, copy.email],
        [signupPage.passwordLabel, copy.password],
        [signupPage.passwordConfirmationLabel, copy.passwordConfirmation],
      ] as const;
      for (const [label, text] of labels) await expect(label).toHaveText(text);
    });

    await test.step("labels are wired to inputs as accessible names", async () => {
      await expect(signupPage.firstName).toHaveAccessibleName(copy.firstName);
      await expect(signupPage.lastName).toHaveAccessibleName(copy.lastName);
      await expect(signupPage.phone).toHaveAccessibleName(copy.phone);
      await expect(signupPage.email).toHaveAccessibleName(copy.email);
      await expect(signupPage.password).toHaveAccessibleName(copy.password);
      await expect(signupPage.passwordConfirmation).toHaveAccessibleName(
        copy.passwordConfirmation,
      );
    });

    await test.step("input types are correct and passwords are masked", async () => {
      await expect(signupPage.phone).toHaveAttribute("type", "tel");
      await expect(signupPage.password).toHaveAttribute("type", "password");
      await expect(signupPage.passwordConfirmation).toHaveAttribute(
        "type",
        "password",
      );
    });

    await test.step("password policy helper is displayed", async () => {
      await expect(page.getByText(copy.passwordHelper)).toBeVisible();
    });

    await test.step("text inputs are empty and consent is unchecked", async () => {
      for (const field of [
        signupPage.firstName,
        signupPage.lastName,
        signupPage.phone,
        signupPage.email,
        signupPage.password,
        signupPage.passwordConfirmation,
      ]) {
        await expect(field).toHaveValue("");
      }
      await expect(signupPage.partnerConsent).not.toBeChecked();
    });

    await test.step("Phone country defaults to Canada", async () => {
      await expect(signupPage.phoneCountry).toHaveValue("CA");
    });

    await test.step("Province list has all 13 provinces and territories", async () => {
      const values = await signupPage.region
        .locator("option:not([disabled])")
        .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
      expect(values.sort()).toEqual([
        "AB",
        "BC",
        "MB",
        "NB",
        "NL",
        "NS",
        "NT",
        "NU",
        "ON",
        "PE",
        "QC",
        "SK",
        "YT",
      ]);
    });

    await test.step("login, terms and privacy links are localized", async () => {
      await expect(signupPage.headerLogin).toHaveText(copy.loginHeader);
      await expect(signupPage.loginLink).toHaveText(copy.loginLink);
      await expect(signupPage.termsLink).toHaveText(copy.termsLinkText);
      await expect(signupPage.termsLink).toHaveAttribute("href", copy.termsUrl);
      await expect(signupPage.termsLink).toHaveAttribute("target", "_blank");
      await expect(
        page.getByRole("link", { name: copy.privacyLinkText }),
      ).toBeVisible();
    });

    await test.step("tab order follows the visual field order", async () => {
      await signupPage.firstName.focus();
      const order = [
        signupPage.lastName,
        signupPage.phoneCountry,
        signupPage.phone,
        signupPage.region,
        signupPage.email,
        signupPage.password,
        signupPage.passwordConfirmation,
      ];
      for (const next of order) {
        await page.keyboard.press("Tab");
        await expect(next).toBeFocused();
      }
    });

    await test.step("consent text is shown and clicking it toggles the checkbox", async () => {
      await expect(page.getByText(copy.consentStart)).toBeVisible();
      await page.getByText(copy.consentStart).click();
      await expect(signupPage.partnerConsent).toBeChecked();
      await signupPage.partnerConsent.uncheck();
      await expect(signupPage.partnerConsent).not.toBeChecked();
    });
  });

  test("Language toggle switches the page and errors follow the page language", async ({
    page,
  }, testInfo) => {
    const signupPage = await openSignup(page, testInfo);
    const { locale, copy } = signupPage;
    const other = locale === "en" ? "fr" : "en";

    await test.step("toggle advertises the other language and points to the same route", async () => {
      await expect(signupPage.languageSwitch).toHaveText(
        copy.switchLanguageLabel,
      );
      await expect(signupPage.languageSwitch).toHaveAttribute(
        "href",
        new RegExp(`${textCopy[other].urlPrefix}/signup$`),
      );
    });

    await test.step("validation errors use the current language", async () => {
      await signupPage.submit();
      await expect(signupPage.error("first-name")).toContainText(
        copy.errors.required,
      );
    });

    await test.step("clicking the toggle swaps URL, title, heading and CTA", async () => {
      await signupPage.languageSwitch.click();
      await expect(page).toHaveURL(
        new RegExp(`${textCopy[other].urlPrefix}/signup$`),
      );
      await expect(page).toHaveTitle(textCopy[other].pageTitle);
      await expect(signupPage.heading).toHaveText(textCopy[other].heading);
      await expect(signupPage.submitButton).toHaveText(textCopy[other].submit);
    });
  });
});
