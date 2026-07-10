import type { Page, Response } from "@playwright/test";
import { expect } from "@playwright/test";

import { requireE2eCredentials } from "../env";
import { portfolioProfile } from "../fixtures/portfolio-profile";

export type RegisterOwnerInput = {
  name: string;
  username: string;
  email: string;
  password: string;
};

const ADMIN_URL = /\/(admin|panel|beheer)\/?$/;

async function parseSignInResponse(response: Response): Promise<void> {
  const text = await response.text().catch(() => "");
  if (!response.ok()) {
    throw new Error(
      `sign-in request failed: ${response.status()} ${text}`.trim(),
    );
  }

  if (!text.trim()) return;

  try {
    const payload = JSON.parse(text) as { error?: { message?: string } };
    if (payload.error?.message) {
      throw new Error(`sign-in failed: ${payload.error.message}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

async function assertAuthMutationSucceeded(
  response: Response,
  label: string,
): Promise<void> {
  const text = await response.text().catch(() => "");
  if (!response.ok()) {
    throw new Error(
      `${label} request failed: ${response.status()} ${text}`.trim(),
    );
  }

  if (!text.trim()) return;

  try {
    const payload = JSON.parse(text) as {
      error?: { message?: string };
      code?: string;
    };
    if (payload.error?.message) {
      throw new Error(`${label} mutation failed: ${payload.error.message}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

export function buildRegisterOwnerInput(): RegisterOwnerInput {
  const { email, password } = requireE2eCredentials();

  return {
    name: portfolioProfile.name,
    username: portfolioProfile.username,
    email,
    password,
  };
}

export async function signInOwner(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back!" }),
  ).toBeVisible({ timeout: 15_000 });

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);

  const signInResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/sign-in/email") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const response = await signInResponse;

  try {
    await parseSignInResponse(response);
  } catch {
    return false;
  }

  try {
    await expect(page).toHaveURL(ADMIN_URL, { timeout: 30_000 });
    return true;
  } catch {
    throw new Error(
      "Sign-in API succeeded but the session cookie was not applied. " +
        "Ensure the app origin matches E2E_BASE_URL (e.g. http://localhost:3000).",
    );
  }
}

export async function fillRegisterOwnerForm(
  page: Page,
  input: RegisterOwnerInput = buildRegisterOwnerInput(),
): Promise<void> {
  await page.goto("/register?next=/admin");
  await expect(
    page.getByRole("heading", {
      name: /Create your portfolio|Crea tu portafolio|Maak je portfolio/i,
    }),
  ).toBeVisible({ timeout: 15_000 });

  await page.locator("#register-name").fill(input.name);
  await page.locator("#register-username").fill(input.username);
  await page.locator("#register-email").fill(input.email);
  await page.locator("#register-password").fill(input.password);

  const signUpResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/sign-up/email") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );
  const profileResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/trpc/cv.upsertProfile") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.locator("#register-form-submit").click();
  await assertAuthMutationSucceeded(await signUpResponse, "sign-up");
  await assertAuthMutationSucceeded(await profileResponse, "upsertProfile");

  await expect(page).toHaveURL(ADMIN_URL, { timeout: 60_000 });
}

export async function ensureOwnerAccount(page: Page): Promise<void> {
  const { email, password } = requireE2eCredentials();

  try {
    const signedIn = await signInOwner(page, email, password);
    if (signedIn) return;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("session cookie was not applied")
    ) {
      throw error;
    }
  }

  await fillRegisterOwnerForm(page, buildRegisterOwnerInput());
}

export { portfolioProfile };
