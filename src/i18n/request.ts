import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { routing } from "@/i18n/routing-config";

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  // Dev: read from disk so Turbopack does not serve a stale messages JSON module.
  if (process.env.NODE_ENV === "development") {
    const raw = await readFile(
      join(process.cwd(), "messages", `${locale}.json`),
      "utf8",
    );
    return JSON.parse(raw) as Record<string, unknown>;
  }

  return (
    (await import(`../../messages/${locale}.json`)) as {
      default: Record<string, unknown>;
    }
  ).default;
}

export default getRequestConfig(async ({ locale: override }) => {
  // Route Handlers and Server Actions must provide an explicit locale.
  const requested = override ?? (await rootLocale());
  if (!hasLocale(routing.locales, requested)) {
    notFound();
  }

  return {
    locale: requested,
    messages: await loadMessages(requested),
  };
});
