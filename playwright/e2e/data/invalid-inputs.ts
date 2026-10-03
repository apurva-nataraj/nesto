import type { SignupUser } from "./signup.data";
import type { SignupCopy } from "../locatorTextCopy/signup.copy";

// One entry = one bad value on an otherwise valid form, and the error we expect to see.
type BadInput = {
  name: string;
  // Which field shows the error (the data-testid prefix of its error message).
  field:
    | "first-name"
    | "last-name"
    | "email"
    | "phone"
    | "password"
    | "passwordConfirmation";
  // Expected message; leave out when we only check that an error is shown.
  message?: (copy: SignupCopy) => string;
} & Partial<SignupUser>;

export const INVALID_NAMES = [
  {
    name: "empty first name",
    firstName: "",
    field: "first-name",
    message: (c) => c.errors.required,
  },
  {
    name: "empty last name",
    lastName: "",
    field: "last-name",
    message: (c) => c.errors.required,
  },
  {
    name: "whitespace-only first name",
    firstName: "   ",
    field: "first-name",
    message: (c) => c.errors.required,
  },
  {
    name: "digits in first name",
    firstName: "12345",
    field: "first-name",
  },
  {
    name: "markup in first name",
    firstName: "<script>alert(1)</script>",
    field: "first-name",
  },
] satisfies BadInput[];

export const INVALID_EMAILS_AND_PHONES = [
  {
    name: "email without @",
    email: "plainaddress",
    field: "email",
    message: (c) => c.errors.invalidEmail,
  },
  {
    name: "email without @ (with domain)",
    email: "missing-at.example.com",
    field: "email",
    message: (c) => c.errors.invalidEmail,
  },
  {
    name: "email without domain",
    email: "user@",
    field: "email",
    message: (c) => c.errors.invalidEmail,
  },
  {
    name: "email without local part",
    email: "@example.com",
    field: "email",
    message: (c) => c.errors.invalidEmail,
  },
  {
    name: "email with two @",
    email: "user@@example.com",
    field: "email",
    message: (c) => c.errors.invalidEmail,
  },
  {
    name: "email with a space",
    email: "user name@example.com",
    field: "email",
    message: (c) => c.errors.invalidEmail,
  },
  {
    name: "phone too short",
    phone: "123",
    field: "phone",
    message: (c) => c.errors.invalidValue,
  },
  {
    name: "phone with letters",
    phone: "abcdefghij",
    field: "phone",
    message: (c) => c.errors.invalidValue,
  },
  {
    name: "phone of zeros",
    phone: "000",
    field: "phone",
    message: (c) => c.errors.invalidValue,
  },
  {
    name: "phone too long",
    phone: "9051111111111111111",
    field: "phone",
    message: (c) => c.errors.invalidValue,
  },
] satisfies BadInput[];

export const INVALID_PASSWORDS = [
  {
    name: "11 characters",
    password: "Short1abcde",
    passwordConfirmation: "Short1abcde",
    field: "password",
    message: (c) => c.errors.passwordMin,
  },
  {
    name: "33 characters",
    password: "Aa1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    passwordConfirmation: "Aa1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    field: "password",
  },
  {
    name: "no uppercase",
    password: "alllowercase123",
    passwordConfirmation: "alllowercase123",
    field: "password",
    message: (c) => c.errors.weakPassword,
  },
  {
    name: "no lowercase",
    password: "ALLUPPERCASE123",
    passwordConfirmation: "ALLUPPERCASE123",
    field: "password",
    message: (c) => c.errors.weakPassword,
  },
  {
    name: "no number",
    password: "NoNumbersHereAtAll",
    passwordConfirmation: "NoNumbersHereAtAll",
    field: "password",
    message: (c) => c.errors.weakPassword,
  },
  {
    name: "confirmation does not match",
    passwordConfirmation: "DifferentPassw0rd1",
    field: "passwordConfirmation",
    message: (c) => c.errors.passwordMismatch,
  },
] satisfies BadInput[];
