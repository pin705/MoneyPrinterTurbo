import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * Smoke-level e2e for the web app. The webServer builds the app and serves the
 * production bundle via `vite preview`, so the test exercises the same artifact
 * that ships (HashRouter and all). The backend is not required — the app loads
 * and routes client-side; the "backend offline" state is expected in CI.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
