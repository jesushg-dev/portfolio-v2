import { type ReactNode } from "react";
import "@/app/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export { generateMetadata } from "./metadata";

import Layout from "@/components/app-layout";
import LcpImagePreload from "@/components/shared/lcp-image-preload";
import DeferredTrpcProvider from "@/components/providers/deferred-trpc-provider";
import { getHeroLcpImageUrl } from "@/features/home/components/hero-lcp-image";
import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import type { Locale as AppLocale } from "@/i18n/config";

export const revalidate = 60;

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
