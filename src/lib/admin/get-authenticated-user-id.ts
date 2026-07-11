import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Returns the authenticated user's ID from the current request session,
 * or `null` if there is no active session.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}
