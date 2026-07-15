import type { Locale } from "next-intl";
import { getLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";

const UNAUTHORIZED_MESSAGE = "Unauthorized: userId is required";

/**
 * Ensures `userId` is a non-empty string before it is passed to Prisma.
 * Use as a second line of defense in where-clause builders.
 */
export function assertNonEmptyUserId(
  userId: string | null | undefined,
): asserts userId is string {
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error(UNAUTHORIZED_MESSAGE);
  }
}

/**
 * Returns the authenticated user's ID from the current request session,
 * or `null` if there is no active session.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (typeof userId !== "string" || userId.length === 0) {
    return null;
  }
  return userId;
}

/**
 * Returns the authenticated user's ID for admin server queries.
 * Redirects to login when the session is missing or has no valid user id.
 */
export async function requireAuthenticatedUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    const locale = (await getLocale()) as Locale;
    return redirectToLogin(locale);
  }
  return userId;
}
