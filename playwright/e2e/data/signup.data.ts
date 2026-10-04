import { randomUUID } from "node:crypto";

export const VALID_PASSWORD = "ValidPassw0rd!";

export function uniqueEmail(prefix = "qa"): string {
  return `${prefix}+${randomUUID().slice(0, 8)}@example-qa.com`;
}

export function buildUser() {
  const password = VALID_PASSWORD;
  return {
    firstName: "Test",
    lastName: "User",
    phone: "9055555555",
    region: "ON",
    email: uniqueEmail(),
    password,
    passwordConfirmation: password,
    partnerConsent: true,
  };
}

export type SignupUser = ReturnType<typeof buildUser>;

// Body the signup form sends to POST /api/accounts, so the API can be tested without the UI.
export function accountPayload(user: SignupUser = buildUser()) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: toE164(user.phone),
    region: user.region,
    language: "en",
    password: user.password,
    passwordSpecified: true,
    leadDistributeConsentAgreement: user.partnerConsent,
    createdAt: "LOGIN",
    partner: "nesto",
  };
}

// Normalises a national number to the E.164 form the API can
export function toE164(nationalNumber: string, countryCode = "1"): string {
  return `+${countryCode}${nationalNumber.replace(/\D/g, "")}`;
}
