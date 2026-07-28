import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/config";
import { IntegrationsPage } from "@/features/integrations/components/integrations-page";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("adminCredentials");
  return {
    title: `${t("title")} | Admin`,
  };
}

export default async function AdminCredentialsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <IntegrationsPage />
    </div>
  );
}
