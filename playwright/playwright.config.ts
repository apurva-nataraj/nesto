import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://app.qa.nesto.ca",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Language is selected by URL (/signup vs /fr/signup), not by browser locale.
  // The project name is read by the fixture to pick the locale.
  projects: [
    {
      name: "chromium-en",
      use: { ...devices["Desktop Chrome"], locale: "en-CA" },
    },
    {
      name: "chromium-fr",
      use: { ...devices["Desktop Chrome"], locale: "fr-CA" },
    },
  ],
});
