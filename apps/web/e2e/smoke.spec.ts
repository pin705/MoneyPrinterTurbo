import { expect, test, type Page } from "@playwright/test";

/** Dev sign-in (Supabase disabled via VITE_FORCE_DEV_AUTH) → reveals the app shell. */
async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill("tester@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // Sidebar appears once authenticated.
  await expect(page.getByRole("link", { name: "Create" })).toBeVisible();
}

test.describe("auth gate", () => {
  test("signed out shows full-screen login — no app shell behind it", async ({ page }) => {
    await page.goto("/#/create");
    // The login screen overlays everything: its button shows, the sidebar does not.
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Library" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Create" })).toHaveCount(0);
  });

  test("dev sign-in reveals the app", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("link", { name: "Library" })).toBeVisible();
  });
});

test.describe("app (signed in)", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("/ redirects to /create", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/#\/create$/);
  });

  test("navigates to the Library page", async ({ page }) => {
    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL(/#\/library$/);
    await expect(page.getByText("Your generated videos")).toBeVisible();
  });

  test("shows a not-found placeholder for unknown routes", async ({ page }) => {
    await page.goto("/#/does-not-exist");
    await expect(page.getByText("Coming soon")).toBeVisible();
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("renders the aspect-ratio CardSelect as an accessible radio group", async ({
    page,
  }) => {
    await page.goto("/#/create");
    await page.getByRole("textbox").first().fill("Morning productivity habits");
    await page.getByRole("button", { name: "Next" }).click();
    const aspect = page.getByRole("radiogroup", { name: "Aspect ratio" });
    await expect(aspect).toBeVisible();
    await expect(aspect.getByRole("radio")).toHaveCount(3);
  });

  test("batch topic count gates against the plan limit", async ({ page }) => {
    await page.goto("/#/batch");
    await expect(page.getByText("Topics")).toBeVisible();
    await page
      .getByPlaceholder("One topic per line…")
      .fill("morning habits\nproductivity tips");
    // No cloud in smoke → limit is 1, so two topics trips the upgrade prompt.
    await expect(page.getByText(/plan allows/i)).toBeVisible();
  });
});
