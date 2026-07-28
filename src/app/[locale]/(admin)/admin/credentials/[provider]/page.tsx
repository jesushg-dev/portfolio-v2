import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/config";
import { IntegrationModalPanel } from "@/features/integrations/components/integration-modal-panel";
import { isIntegrationProvider } from "@/features/integrations/lib/integration-paths";

interface IntegrationProviderPageProps {
  params: Promise<{ locale: string; provider: string }>;
}

export default async function IntegrationProviderPage({
  params,
}: IntegrationProviderPageProps) {
  const { locale, provider } = await params;
  setRequestLocale(locale as Locale);

  if (!isIntegrationProvider(provider)) {
    notFound();
  }

  const t = await getTranslations("adminCredentials");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-bold">
          {t(`providers.${provider}.name`)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t(`providers.${provider}.description`)}
        </p>
      </header>

      <IntegrationModalPanel provider={provider} />
    </div>
  );
}
