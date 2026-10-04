import { buildUser, type SignupUser } from "./signup.data";

// One entry = one otherwise-valid form that must still create an account.
export type ValidEdgeCase = {
  name: string;
  user: SignupUser;
  // Extra fields that must appear on the POST body after a 201.
  request?: Record<string, unknown>;
  // Extra fields that must appear on the returned account after a 201.
  account?: Record<string, unknown>;
};

export function validSignupEdgeCases(): ValidEdgeCase[] {
  return [
    {
      name: "12-character password (minimum)",
      user: {
        ...buildUser(),
        password: "Abcdefghij1k",
        passwordConfirmation: "Abcdefghij1k",
      },
    },
    {
      name: "32-character password (maximum)",
      user: {
        ...buildUser(),
        password: "Abcdefghijklmnopqrstuvwxyz12345k",
        passwordConfirmation: "Abcdefghijklmnopqrstuvwxyz12345k",
      },
    },
    {
      name: "password containing spaces",
      user: {
        ...buildUser(),
        password: "Valid Pass 12345",
        passwordConfirmation: "Valid Pass 12345",
      },
    },
    {
      name: "hyphenated and accented names",
      user: {
        ...buildUser(),
        firstName: "Jean-François",
        lastName: "Côté-Lévesque",
      },
      account: {
        firstName: "Jean-François",
        lastName: "Côté-Lévesque",
      },
    },
    {
      name: "apostrophe in last name",
      user: { ...buildUser(), lastName: "O'Brien" },
      account: { lastName: "O'Brien" },
    },
    {
      name: "plus-addressed email on a subdomain",
      user: {
        ...buildUser(),
        email: `qa+tag${Date.now()}@mail.example-qa.com`,
      },
    },
    {
      name: "partner consent left unchecked",
      user: { ...buildUser(), partnerConsent: false },
      request: { leadDistributeConsentAgreement: false },
    },
    {
      name: "non-default province",
      user: { ...buildUser(), region: "BC" },
      account: { region: "BC" },
    },
  ];
}
