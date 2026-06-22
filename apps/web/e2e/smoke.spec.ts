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

  test("shows a Coming soon placeholder for account routes", async ({ page }) => {
    await page.goto("/#/dashboard");
    await expect(page.getByText("Coming soon")).toBeVisible();
    await expect(page.getByText("Planned for Phase 1")).toBeVisible();
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
