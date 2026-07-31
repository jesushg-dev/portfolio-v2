export { generateMetadata } from "../../../credentials/[provider]/metadata";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/config";
import { PageDialogWrapper } from "@/components/shared/page-container";
import { IntegrationModalPanel } from "@/features/integrations/components/integration-modal-panel";
import { isIntegrationProvider } from "@/features/integrations/lib/integration-paths";

interface IntegrationModalPageProps {
  params: Promise<{ locale: string; provider: string }>;
}

export default async function IntegrationModalPage({
  params,
}: IntegrationModalPageProps) {
  const { locale, provider } = await params;
  setRequestLocale(locale as Locale);

  if (!isIntegrationProvider(provider)) {
    notFound();
  }

  const t = await getTranslations("adminCredentials");

  return (
    <PageDialogWrapper
      title={t(`providers.${provider}.name`)}
      description={t(`providers.${provider}.description`)}
      className="sm:max-w-5xl"
    >
      <IntegrationModalPanel provider={provider} />
    </PageDialogWrapper>
  );
}
