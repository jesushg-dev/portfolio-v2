import type { Page, Response } from "@playwright/test";
import { expect } from "@playwright/test";

import { requireE2eCredentials } from "../env";
import { portfolioProfile } from "../fixtures/portfolio-profile";

export interface RegisterOwnerInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

/** True when the URL *pathname* is the admin dashboard (not `?next=/admin`). */
export function isAdminPath(url: URL | string): boolean {
  const pathname =
    typeof url === "string" ? new URL(url).pathname : url.pathname;
  return /\/(admin|panel|beheer)\/?$/.test(pathname);
}

export async function expectAdminDashboard(
  page: Page,
  timeout = 60_000,
): Promise<void> {
  await expect(page).toHaveURL((url) => isAdminPath(url), { timeout });
  await expect(
    page.getByRole("heading", {
      name: /Welcome to your Portfolio Admin|Bienvenido a tu administrador de portafolio|Welkom in je Portfolio Admin/,
    }),
  ).toBeVisible({ timeout: Math.min(timeout, 30_000) });
}

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

export function buildOwnerAccountInput(): RegisterOwnerInput {
  const { email, password } = requireE2eCredentials();
  return {
    name: portfolioProfile.name,
    username: portfolioProfile.username,
    email,
    password,
  };
}

/**
 * Worker accounts are always distinct from the seeded owner so mutating
 * admin tests cannot wipe the public portfolio that locale tests read.
 */
export function buildRegisterOwnerInput(workerIndex = 0): RegisterOwnerInput {
  const owner = buildOwnerAccountInput();
  const atIndex = owner.email.lastIndexOf("@");
  const workerEmail =
    atIndex !== -1
      ? `${owner.email.slice(0, atIndex)}-e2e-${workerIndex}${owner.email.slice(atIndex)}`
      : `${owner.email}-e2e-${workerIndex}`;

  return {
    name: `${owner.name} (E2E ${workerIndex})`,
    username: `${portfolioProfile.username}-e2e${workerIndex}`,
    email: workerEmail,
    password: owner.password,
  };
}

export async function signInOwner(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  await page.goto("/login");
  if (isAdminPath(page.url())) {
    const cookies = await page.context().cookies();
    if (cookies.length > 0) {
      return true;
    }
    await page.goto("/login", { waitUntil: "domcontentloaded" });
  }

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
    await expectAdminDashboard(page, 30_000);
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
  input: RegisterOwnerInput = buildOwnerAccountInput(),
): Promise<void> {
  await page.goto("/register?next=/admin");
  if (isAdminPath(page.url())) {
    return;
  }
  await expect(
    page.getByRole("heading", {
      name: /Create your portfolio|Crea tu portafolio|Maak je portfolio|Build your CV|Construye tu CV|Bouw je CV/i,
    }),
  ).toBeVisible({ timeout: 15_000 });

  await page.locator("#register-name").fill(input.name);
  await page.locator("#register-username").fill(input.username);
  await page.locator("#register-email").fill(input.email);
  await page.locator("#register-password").fill(input.password);

  const signUpResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/sign-up/email") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.locator("#register-form-submit").click();

  try {
    const signUpResponse = await signUpResponsePromise;
    await assertAuthMutationSucceeded(signUpResponse, "sign-up");

    const profileResponse = await page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/cv.upsertProfile") &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );
    await assertAuthMutationSucceeded(profileResponse, "upsertProfile");
  } catch (error) {
    const signedIn = await signInOwner(page, input.email, input.password).catch(
      () => false,
    );
    if (signedIn) return;
    throw error;
  }

  await expectAdminDashboard(page);
}

export async function ensureOwnerAccount(
  page: Page,
  input: RegisterOwnerInput = buildOwnerAccountInput(),
): Promise<void> {
  try {
    const signedIn = await signInOwner(page, input.email, input.password);
    if (signedIn) return;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("session cookie was not applied")
    ) {
      throw error;
    }
  }

  await fillRegisterOwnerForm(page, input);
}

export { portfolioProfile };
