import { defineConfig, devices } from "@playwright/test";

/** Puerto propio: no reutilizar `next dev` en 3002 (deja la app colgada en «Cargando»). */
const E2E_PORT = Number(process.env.PLAYWRIGHT_PORT || 3003);
const E2E_ORIGIN = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${E2E_PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: E2E_ORIGIN,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next start --port ${E2E_PORT}`,
        url: E2E_ORIGIN,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
