import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { requireE2eCredentials } from "./env";
import {
  ensureOwnerAccount,
  expectAdminDashboard,
  isAdminPath,
  portfolioProfile,
} from "./helpers/fill-register-form";
import { generateTotp } from "./helpers/totp";
import {
  disconnectTwoFactorPrisma,
  resetTwoFactorForEmail,
} from "./helpers/two-factor-state";

/**
 * Dedicated account: enabling 2FA on a shared worker account would lock every
 * other spec out of its stored session.
 */
function buildTwoFactorAccount() {
  const { email, password } = requireE2eCredentials();
  const atIndex = email.lastIndexOf("@");
  return {
    name: `${portfolioProfile.name} (E2E 2FA)`,
    username: `${portfolioProfile.username}-e2e2fa`,
    email:
      atIndex === -1
        ? `${email}-e2e-2fa`
        : `${email.slice(0, atIndex)}-e2e-2fa${email.slice(atIndex)}`,
    password,
  };
}

async function submitCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back!" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function expectTwoFactorPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/two-factor(\?|$)/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Confirm it's you" }),
  ).toBeVisible();
}

test.describe("two-factor authentication", () => {
  test.describe.configure({ mode: "serial" });

  const account = buildTwoFactorAccount();
  let totpSecret = "";
  let backupCodes: string[] = [];

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    await resetTwoFactorForEmail(account.email);

    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureOwnerAccount(page, account);
    await context.close();
  });

  test.afterAll(async () => {
    await resetTwoFactorForEmail(account.email);
    await disconnectTwoFactorPrisma();
  });

  test("enables TOTP from Admin → Settings and reveals backup codes", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await ensureOwnerAccount(page, account);
    await page.goto("/admin/settings");

    const section = page.getByRole("region", {
      name: "Two-factor authentication",
    });
    await expect(section.getByText("Off", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await section.getByRole("button", { name: "Enable 2FA" }).click();
    await section.getByLabel("Confirm your password").fill(account.password);
    await section.getByRole("button", { name: "Continue" }).click();

    const secret = await section
      .getByTestId("totp-secret")
      .textContent({ timeout: 30_000 });
    expect(secret?.trim()).toMatch(/^[A-Z2-7]+=*$/);
    totpSecret = secret!.trim();

    await section
      .getByLabel("Code from the app")
      .fill(generateTotp(totpSecret));
    await section.getByRole("button", { name: "Verify and enable" }).click();

    const codes = section.getByTestId("backup-code");
    await expect(codes).toHaveCount(10, { timeout: 30_000 });
    backupCodes = (await codes.allTextContents()).map((code) => code.trim());
    expect(new Set(backupCodes).size).toBe(10);

    await section
      .getByRole("button", { name: "I've saved my backup codes" })
      .click();
    await expect(section.getByText("On", { exact: true })).toBeVisible();

    await context.close();
  });

  test("password alone no longer signs in; an authenticator code does", async ({
    browser,
  }) => {
    test.skip(!totpSecret, "depends on the enable step");
    const context = await browser.newContext();
    const page = await context.newPage();

    await submitCredentials(page, account.email, account.password);
    await expectTwoFactorPage(page);

    // No session yet: the admin must still be locked.
    const probe = await context.newPage();
    await probe.goto("/admin");
    await expect(probe).toHaveURL(/\/login/, { timeout: 30_000 });
    expect(isAdminPath(probe.url())).toBe(false);
    await probe.close();

    await page.getByRole("tab", { name: "Authenticator" }).click();
    await page.getByLabel("Verification code").fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/two-factor/);

    await page.getByLabel("Verification code").fill(generateTotp(totpSecret));
    await page.getByRole("button", { name: "Verify" }).click();
    await expectAdminDashboard(page);

    await context.close();
  });

  test("a backup code works exactly once", async ({ browser }) => {
    test.skip(backupCodes.length === 0, "depends on the enable step");
    const [code] = backupCodes;

    const first = await browser.newContext();
    const firstPage = await first.newPage();
    await submitCredentials(firstPage, account.email, account.password);
    await expectTwoFactorPage(firstPage);
    await firstPage.getByRole("tab", { name: "Backup code" }).click();
    await firstPage.getByLabel("Backup code").fill(code);
    await firstPage.getByRole("button", { name: "Verify" }).click();
    await expectAdminDashboard(firstPage);
    await first.close();

    const second = await browser.newContext();
    const secondPage = await second.newPage();
    await submitCredentials(secondPage, account.email, account.password);
    await expectTwoFactorPage(secondPage);
    await secondPage.getByRole("tab", { name: "Backup code" }).click();
    await secondPage.getByLabel("Backup code").fill(code);
    await secondPage.getByRole("button", { name: "Verify" }).click();
    await expect(secondPage.getByRole("alert")).toBeVisible({
      timeout: 30_000,
    });
    await expect(secondPage).toHaveURL(/\/two-factor/);
    await second.close();
  });

  test("disables 2FA again from settings", async ({ browser }) => {
    test.skip(!totpSecret, "depends on the enable step");
    const context = await browser.newContext();
    const page = await context.newPage();

    await submitCredentials(page, account.email, account.password);
    await expectTwoFactorPage(page);
    await page.getByLabel("Verification code").fill(generateTotp(totpSecret));
    await page.getByRole("button", { name: "Verify" }).click();
    await expectAdminDashboard(page);

    await page.goto("/admin/settings");
    const section = page.getByRole("region", {
      name: "Two-factor authentication",
    });
    await section.getByRole("button", { name: "Disable 2FA" }).click();
    await section.getByLabel("Confirm your password").fill(account.password);
    await section.getByRole("button", { name: "Disable" }).click();
    await expect(section.getByText("Off", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await context.close();
  });
});

test.describe("security headers", () => {
  test("every response carries the hardening headers", async ({ request }) => {
    const response = await request.get("/login");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'self'",
    );
    expect(headers["permissions-policy"]).toContain(
      "publickey-credentials-get=(self)",
    );
  });
});
