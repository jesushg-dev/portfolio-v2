import { pathnames, type Locale } from "@/i18n/config";
import type { IntegrationProvider } from "@/lib/integrations/tenant-integrations-service";

export const INTEGRATION_PROVIDERS = [
  "resend",
  "spotify",
  "uploadthing",
  "ai",
  "google-calendar",
] as const satisfies readonly IntegrationProvider[];

export function isIntegrationProvider(
  value: string,
): value is IntegrationProvider {
  return (INTEGRATION_PROVIDERS as readonly string[]).includes(value);
}

export function getIntegrationProviderPath(
  locale: string,
  provider: IntegrationProvider,
): string {
  const entry = pathnames["/admin/credentials/[provider]"];
  const template =
    typeof entry === "string" ? entry : (entry[locale as Locale] ?? entry.en);
  const segment = template.replace("[provider]", provider);
  return `/${locale}${segment.startsWith("/") ? segment : `/${segment}`}`;
}
