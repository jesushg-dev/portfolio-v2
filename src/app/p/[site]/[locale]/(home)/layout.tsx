import { type ReactNode } from "react";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import Layout from "@/components/app-layout";
import { PageViewBeacon } from "@/features/analytics/components/page-view-beacon";
import { PublicCvVisibleProvider } from "@/components/app-layout/public-cv-visible";
import { ProcessNavPagesProvider } from "@/components/app-layout/process-nav-pages";
import PublicTrpcProvider from "@/components/providers/public-trpc-provider";
import { getCachedSiteBrand } from "@/lib/site-brand/get-cached-site-brand";
import { locales, type Locale as AppLocale } from "@/i18n/config";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import { api } from "@/trpc/server";

export const revalidate = 7200;

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

  const activeLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : "en";
  const cvPublic = isPublicCvVisible(await resolvePublicTenant());
  const siteBrand = await getCachedSiteBrand();
  const processNavPages = await api.processPages.listForNav({
    locale: activeLocale,
  });

  return (
    <PublicTrpcProvider>
      <NuqsAdapter>
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
    </PublicTrpcProvider>
  );
}
