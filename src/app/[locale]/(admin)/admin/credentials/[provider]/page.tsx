export { generateMetadata } from "./metadata";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/routing";
import { IntegrationModalPanel } from "@/features/integrations/components/integration-modal-panel";
import { isIntegrationProvider } from "@/features/integrations/lib/integration-paths";

interface IntegrationProviderPageProps {
  params: Promise<{ provider: string }>;
}

export default async function IntegrationProviderPage({
  params,
}: IntegrationProviderPageProps) {
  const { provider } = await params;

  if (!isIntegrationProvider(provider)) {
    notFound();
  }

  const t = await getTranslations("adminCredentials");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/admin/credentials"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          <span>{t("backToIntegrations")}</span>
        </Link>
        <header className="space-y-1">
          <h1 className="text-foreground text-2xl font-bold">
            {t(`providers.${provider}.name`)}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(`providers.${provider}.description`)}
          </p>
        </header>
      </div>

      <IntegrationModalPanel provider={provider} />
    </div>
  );
}
