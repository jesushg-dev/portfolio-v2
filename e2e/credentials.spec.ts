import { expect, test } from "./authenticated-test";

test.describe("Admin Credentials & Integrations", () => {
  test("renders integration cards in a grid", async ({ page }) => {
    await page.goto("/admin/credentials");

    await expect(
      page.getByRole("heading", {
        name: /Credentials & Integrations|Credenciales e Integraciones|Inloggegevens & Integraties/,
      }),
    ).toBeVisible();

    await expect(page.locator('[data-integration="resend"]')).toBeVisible();
    await expect(page.locator('[data-integration="spotify"]')).toBeVisible();
    await expect(
      page.locator('[data-integration="uploadthing"]'),
    ).toBeVisible();
    await expect(page.locator('[data-integration="ai"]')).toBeVisible();
  });

  test("shows available integrations separately from connected ones", async ({
    page,
  }) => {
    await page.goto("/admin/credentials");

    const resendCard = page.locator('[data-integration="resend"]');
    const isResendConnected = await resendCard
      .getByText(/Configured|Configurado|Geconfigureerd/i)
      .isVisible()
      .catch(() => false);

    if (isResendConnected) {
      await expect(
        page.getByText(/Connected|Conectadas|Verbonden/i),
      ).toBeVisible();
    } else {
      await expect(
        page.locator('[data-integration="resend"][data-available]'),
      ).toBeVisible();
    }
  });

  test("opens Resend form in a modal", async ({ page }) => {
    await page.goto("/admin/credentials");

    const connectLink = page
      .locator('[data-integration="resend"]')
      .getByRole("link", { name: /Connect|Conectar|Verbinden/i });

    await connectLink.click();

    await expect(page).toHaveURL(
      /\/admin\/credentials\/resend|\/panel\/credenciales\/resend|\/beheer\/inloggegevens\/resend/,
    );

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#resend-api-key")).toBeVisible();
  });

  test("opens Spotify modal with setup guide", async ({ page }) => {
    await page.goto("/admin/credentials");

    await page
      .locator('[data-integration="spotify"]')
      .getByRole("link", { name: /Connect|Conectar|Verbinden/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#spotify-client-id")).toBeVisible();
    await expect(
      dialog.getByText(/Premium|premium|Premium-account/i),
    ).toBeVisible();
  });

  test("legacy /admin/spotify redirects to Spotify modal route", async ({
    page,
  }) => {
    await page.goto("/admin/spotify");
    await expect(page).toHaveURL(
      /\/admin\/credentials\/spotify|\/panel\/credenciales\/spotify|\/beheer\/inloggegevens\/spotify/,
    );
  });
});
