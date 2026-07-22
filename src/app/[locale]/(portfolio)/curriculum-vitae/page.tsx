import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getLocalizedText } from "@/lib/i18n/localized";
import { resolveTenant } from "@/lib/tenant/resolve";
import { db } from "@/server/db";
import type { Locale as AppLocale } from "@/i18n/config";
import CvPageView from "./cv-page-view";

export const dynamic = "force-dynamic";

interface ICvPageProps {
  params: Promise<{ locale: string }>;
}

interface ICvPageSearchProps extends ICvPageProps {
  searchParams: Promise<{ pdf?: string }>;
}

export default async function CvPage({
  params,
  searchParams,
}: ICvPageSearchProps) {
  const { locale } = await params;
  const { pdf } = await searchParams;
  setRequestLocale(locale as Locale);

  return <CvPageView locale={locale} pdfMode={pdf === "1"} />;
}

export async function generateMetadata({
  params,
}: ICvPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "curriculum",
  });

  const tenant = await resolveTenant();
  let title = t("title");
  let description = "";
  if (tenant) {
    const [header, aboutMe] = await Promise.all([
      db.cvHeader.findUnique({ where: { userId: tenant.userId } }),
      db.cvAboutMe.findUnique({ where: { userId: tenant.userId } }),
    ]);
    if (header?.fullName) {
      title = `${header.fullName} - Curriculum Vitae`;
    }
    description = getLocalizedText(
      aboutMe?.aboutMe,
      locale as AppLocale,
      tenant.defaultLocale,
    );
  }

  return {
    title,
    description,
    manifest: "/manifest.json",
    metadataBase: new URL("https://www.jesushg.com"),
  };
}
