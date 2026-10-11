import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Demo state is deliberately shared per process; mutation journeys run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    env: { DEMO_MODE: "true" },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "webkit",
      testMatch: /workbench\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
