import { expect, test } from "@playwright/test";

test.describe("GitVista browser shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const welcomeScreen = page.getByTestId("welcome-screen");
    await expect(welcomeScreen).toBeVisible();
    await expect(
      welcomeScreen.getByRole("heading", { name: "GitVista" }),
    ).toBeVisible();
  });

  test("opens a recent repository and renders its commit history", async ({ page }) => {
    await page.getByText("project-v3", { exact: true }).click();

    await expect(
      page.getByText("feat(m1): visual git viewer", { exact: true }),
    ).toBeVisible();
  });

  test("opens and closes the command palette from the keyboard", async ({ page }) => {
    await page.keyboard.press("Control+K");

    const palette = page.getByRole("dialog", { name: "Command Palette" });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole("textbox")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();
  });
});
