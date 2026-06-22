import { expect, test } from "@playwright/test";

// Smoke test for the app shell + router. Asserts the foundation built in
// Phase 0: HashRouter navigation, the sidebar, and the placeholder pages.
test.describe("app shell", () => {
  test("loads, redirects to /create, and renders the sidebar", async ({ page }) => {
    await page.goto("/");
    // "/" redirects to the Create surface.
    await expect(page).toHaveURL(/#\/create$/);
    await expect(page.getByRole("link", { name: "Create" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Library" })).toBeVisible();
  });

  test("navigates to the Library page", async ({ page }) => {
    await page.goto("/#/create");
    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL(/#\/library$/);
    // Subtitle is unique to the Library page (the sidebar also has "Library").
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
    // Step 1 (Content) gates "Next" until there's a subject/script. Fill the
    // subject, advance to the Video & Audio step, then assert the card selector.
    await page.getByRole("textbox").first().fill("Morning productivity habits");
    await page.getByRole("button", { name: "Next" }).click();

    const aspect = page.getByRole("radiogroup", { name: "Aspect ratio" });
    await expect(aspect).toBeVisible();
    // The three aspect options render as cards, not a dropdown (UI/UX standard).
    await expect(aspect.getByRole("radio")).toHaveCount(3);
  });
});

test.describe("auth", () => {
  test("a protected route redirects to /login when signed out", async ({ page }) => {
    await page.goto("/#/dashboard");
    await expect(page).toHaveURL(/#\/login$/);
  });

  test("dev sign-in routes to the dashboard", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByLabel("Email").fill("tester@example.com");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(/#\/dashboard$/);
    // Dashboard chrome renders even if the cloud backend is unreachable in CI.
    await expect(page.getByRole("button", { name: /Upgrade/ })).toBeVisible();
  });
});

test.describe("batch", () => {
  test("topic count gates against the plan limit", async ({ page }) => {
    await page.goto("/#/batch");
    await expect(page.getByText("Topics")).toBeVisible();
    await page
      .getByPlaceholder("One topic per line…")
      .fill("morning habits\nproductivity tips");
    // Signed out (no cloud) the limit is 1, so two topics trips the upgrade prompt.
    await expect(page.getByText(/plan allows/i)).toBeVisible();
  });
});
