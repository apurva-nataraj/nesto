import { test, expect } from "@playwright/test";
import { accountPayload, buildUser } from "../data/signup.data";

test("POST /api/accounts creates an account with a valid payload", async ({
  request,
}) => {
  const user = buildUser();

  const response = await request.post("/api/accounts", {
    data: accountPayload(user),
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.account.email).toBe(user.email);
});
