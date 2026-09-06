import { type ReactNode } from "react";
import "@/app/globals.css";

import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export { generateMetadata } from "./metadata";

import Layout from "@/components/app-layout";
import { PageViewBeacon } from "@/features/analytics/components/page-view-beacon";
import { PublicCvVisibleProvider } from "@/components/app-layout/public-cv-visible";
import { ProcessNavPagesProvider } from "@/components/app-layout/process-nav-pages";
import LcpImagePreload from "@/components/shared/lcp-image-preload";
import DeferredTrpcProvider from "@/components/providers/deferred-trpc-provider";
import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import { getCachedSiteBrand } from "@/lib/site-brand/get-cached-site-brand";
import { locales, type Locale as AppLocale } from "@/i18n/config";
import { CV_PDF_MODE_HEADER } from "@/lib/tenant/headers";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { resolveTenant } from "@/lib/tenant/resolve";
import { api } from "@/trpc/server";

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

  const activeLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : "en";
  const heroData = await getCachedHeroPublic(activeLocale);
  const lcpPhotoUrl = heroData?.photoUrl?.trim() || null;
  const cvPublic = isPublicCvVisible(await resolveTenant());
  const siteBrand = await getCachedSiteBrand();
  const processNavPages = await api.processPages.listForNav({
    locale: activeLocale,
  });

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
          <PublicCvVisibleProvider visible={cvPublic}>
            <ProcessNavPagesProvider pages={processNavPages}>
              <Layout
                cvPublic={cvPublic}
                processNavPages={processNavPages}
                siteBrand={siteBrand}
              >
                <PageViewBeacon />
                {children}
              </Layout>
            </ProcessNavPagesProvider>
          </PublicCvVisibleProvider>
          {modal}
        </NuqsAdapter>
      </NextIntlClientProvider>
    </DeferredTrpcProvider>
  );
}
