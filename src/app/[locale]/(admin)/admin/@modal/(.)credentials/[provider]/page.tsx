export { generateMetadata } from "../../../credentials/[provider]/metadata";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { IntegrationModalPanel } from "@/features/integrations/components/integration-modal-panel";
import { isIntegrationProvider } from "@/features/integrations/lib/integration-paths";

interface IntegrationModalPageProps {
  params: Promise<{ provider: string }>;
}

export default async function IntegrationModalPage({
  params,
}: IntegrationModalPageProps) {
  const { provider } = await params;

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
