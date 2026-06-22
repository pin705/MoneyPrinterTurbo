import { expect, test } from "@playwright/test";

// End-to-end against the real cloud backend (dev auth + SQLite). Exercises the
// account → credit → billing → admin path the way a user actually hits it.

test("sign in shows the account's credits and plan from the cloud", async ({
  page,
}) => {
  await page.goto("/#/login");
  await page.getByLabel("Email").fill("e2e@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/#\/dashboard$/);

  // me() resolved from the cloud → entitlements section renders (not the error).
  await expect(page.getByText("What's unlocked")).toBeVisible();
  await expect(page.getByText("Credit balance")).toBeVisible();
  await expect(
    page.getByText("Couldn’t reach the cloud backend"),
  ).toHaveCount(0);
});

test("billing lists plans from the cloud catalog", async ({ page }) => {
  await page.goto("/#/login");
  await page.getByLabel("Email").fill("e2e@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.goto("/#/billing");

  await expect(page.getByRole("heading", { name: "Creator" })).toBeVisible();
  await expect(page.getByText("199.000đ")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
});

test("admin panel loads stats with the admin key", async ({ page }) => {
  // Sign in first (the route is gated by RequireAuth).
  await page.goto("/#/login");
  await page.getByLabel("Email").fill("e2e@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await page.goto("/#/admin");
  await page.getByPlaceholder("X-Admin-Key").fill("e2e-admin");
  await page.getByRole("button", { name: "Connect" }).click();

  await expect(page.getByText("Revenue")).toBeVisible();
  await expect(page.getByText("Users", { exact: true })).toBeVisible();
});
