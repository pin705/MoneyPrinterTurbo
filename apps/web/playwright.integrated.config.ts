import { defineConfig, devices } from "@playwright/test";

const WEB = 4173;
const CLOUD = 8787;

/**
 * Integrated e2e: the web app served against a REAL cloud backend (dev-auth +
 * SQLite), so the full account/credit/billing flow runs end-to-end. Heavier than
 * the web-only smoke (it boots a Python service via uv), so it's a separate
 * config run locally / on demand rather than in the default CI e2e job.
 *
 *   pnpm --filter @mpt/web exec playwright test --config playwright.integrated.config.ts
 */
export default defineConfig({
  testDir: "./e2e-integrated",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: `http://localhost:${WEB}`, trace: "on-first-retry" },
  webServer: [
    {
      command: `pnpm build && pnpm preview --port ${WEB} --strictPort`,
      url: `http://localhost:${WEB}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `uv run --no-project --with-requirements requirements.txt uvicorn app.main:app --port ${CLOUD}`,
      cwd: "../cloud",
      url: `http://localhost:${CLOUD}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        AUTH_DEV_MODE: "1",
        ADMIN_API_KEY: "e2e-admin",
        DATABASE_URL: "sqlite:///./e2e.db",
        CORS_ALLOWED_ORIGINS: "*",
      },
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
