import { type ReactNode } from "react";
import "@/app/globals.css";

import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export { generateMetadata } from "./metadata";

import Layout from "@/components/app-layout";
import LcpImagePreload from "@/components/shared/lcp-image-preload";
import DeferredTrpcProvider from "@/components/providers/deferred-trpc-provider";
import { getHeroLcpImageUrl } from "@/features/home/components/hero-lcp-image";
import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import type { Locale as AppLocale } from "@/i18n/config";
import { CV_PDF_MODE_HEADER } from "@/lib/tenant/headers";

export const revalidate = 60;

/**
 * Unified public site layout (landing + portfolio pages).
 * Soft-nav skill/schedule modals live in `@modal`.
 */
export default async function SiteLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const isPdfMode = (await headers()).get(CV_PDF_MODE_HEADER) === "1";
  if (isPdfMode) {
    return children;
  }

  const heroData = await getCachedHeroPublic(locale as AppLocale);
  const lcpPhotoUrl = heroData?.photoUrl?.trim()
    ? getHeroLcpImageUrl(heroData.photoUrl.trim())
    : null;

  const allMessages = await getMessages();
  const publicMessages = {
    main: allMessages.main,
    global: allMessages.global,
    legal: allMessages.legal,
    certification: allMessages.certification,
    curriculum: allMessages.curriculum,
    themeCustomizer: allMessages.themeCustomizer,
  };

  return (
    <DeferredTrpcProvider>
      <NextIntlClientProvider messages={publicMessages}>
        <NuqsAdapter>
          {lcpPhotoUrl ? <LcpImagePreload href={lcpPhotoUrl} /> : null}
          <Layout>{children}</Layout>
          {modal}
        </NuqsAdapter>
      </NextIntlClientProvider>
    </DeferredTrpcProvider>
  );
}
