import "server-only";

export function getServerBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/** Base URL for same-origin internal API calls (never the public auth domain locally). */
export function getInternalServiceBaseUrl(): string {
  if (process.env.VERCEL === "1") {
    return getServerBaseUrl();
  }

  return `http://127.0.0.1:${process.env.PORT ?? 3000}`;
}
