import { notFound } from "next/navigation";

import { PublicStatsView } from "@/features/analytics/components/public-stats-view";
import { emptyAnalyticsSummary } from "@/features/analytics/lib/summarize";
import { getAnalyticsSummary } from "@/features/analytics/server/queries";
import { type Locale as AppLocale, locales } from "@/i18n/config";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import { api } from "@/trpc/server";

export { generateMetadata } from "./metadata";

export const revalidate = 7200;

interface StatsRouteProps {
  params: Promise<{ locale: AppLocale }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function StatsRoute({ params }: StatsRouteProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const tenant = await resolvePublicTenant();
  const [traffic, portfolio, services] = await Promise.all([
    tenant
      ? getAnalyticsSummary(tenant.userId, {
          days: 30,
          includeReferrers: false,
        })
      : Promise.resolve(emptyAnalyticsSummary()),
    api.portfolio.getStatsPublic({ locale }),
    api.portfolio.getServicesPublic({ locale }),
  ]);

  return (
    <PublicStatsView
      traffic={traffic}
      portfolio={portfolio}
      services={services.map((service) => ({
        id: service.id,
        title: service.title,
        type: service.type,
      }))}
    />
  );
}
