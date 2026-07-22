import { type ReactNode } from "react";
import "@/app/globals.css";

import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "next-intl";

import Layout from "@/components/app-layout";
import LcpImagePreload from "@/components/shared/lcp-image-preload";
import DeferredTrpcProvider from "@/components/providers/deferred-trpc-provider";
import { getHeroLcpImageUrl } from "@/features/home/components/hero-lcp-image";
import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import type { Locale as AppLocale } from "@/i18n/config";
import { getPathname } from "@/i18n/routing";
import { buildSocialMetadata, SITE_URL } from "@/lib/seo/site";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main",
  });

  const title = t("meta.title");
  const description = t("meta.description");
  const pageUrl = new URL(
    getPathname({ locale: locale as AppLocale, href: "/" }),
    SITE_URL,
  ).href;

  return {
    title,
    description,
    keywords: t("meta.keywords"),
    ...buildSocialMetadata({ title, description, url: pageUrl }),
  };
}

export default async function RootLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const heroData = await getCachedHeroPublic(locale as AppLocale);
  const lcpPhotoUrl = heroData?.photoUrl?.trim()
    ? getHeroLcpImageUrl(heroData.photoUrl.trim())
    : null;

  const allMessages = await getMessages();
  const publicMessages = {
    main: allMessages.main,
    global: allMessages.global,
  };

  return (
    <DeferredTrpcProvider>
      <NextIntlClientProvider messages={publicMessages}>
        {lcpPhotoUrl ? <LcpImagePreload href={lcpPhotoUrl} /> : null}
        <Layout>{children}</Layout>
        {modal}
      </NextIntlClientProvider>
    </DeferredTrpcProvider>
  );
}
