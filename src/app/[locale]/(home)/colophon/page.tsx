import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  ColophonPage,
  colophonLinkClassName,
} from "@/features/colophon/components/colophon-page";
import { COLOPHON_CARBON } from "@/features/colophon/data";
import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { type Locale as AppLocale, locales } from "@/i18n/config";
import { isPublicPageLive } from "@/lib/public-preview-pages";
import { ETheme } from "@/utils/constants/theme";

export { generateMetadata } from "./metadata";

interface ColophonRouteProps {
  params: Promise<{ locale: AppLocale }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function ColophonRoute({ params }: ColophonRouteProps) {
  if (!isPublicPageLive("colophon")) notFound();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("main.colophon");

  const externalLink = (href: string, title: string) =>
    function ColophonExternalLink(chunks: ReactNode) {
      return (
        <a
          href={href}
          title={title}
          target="_blank"
          rel="noopener noreferrer"
          className={colophonLinkClassName}
        >
          {chunks}
        </a>
      );
    };

  return (
    <ProcessPageShell>
      <ColophonPage
        labels={{
          eyebrow: t("hero.eyebrow"),
          title: t("hero.title"),
          description: t("hero.description"),
          stackTitle: t("stack.title"),
          stackBody: t.rich("stack.body", {
            nextjs: externalLink("https://nextjs.org", "Next.js"),
            tailwind: externalLink("https://tailwindcss.com", "Tailwind CSS"),
            prisma: externalLink("https://www.prisma.io", "Prisma"),
            mongodb: externalLink("https://www.mongodb.com", "MongoDB"),
            vercel: externalLink("https://vercel.com", "Vercel"),
          }),
          stackMarks: {
            nextjs: t("stack.marks.nextjs"),
            tailwind: t("stack.marks.tailwind"),
            prisma: t("stack.marks.prisma"),
            mongodb: t("stack.marks.mongodb"),
            vercel: t("stack.marks.vercel"),
          },
          typeTitle: t("typography.title"),
          typeBody: t("typography.body"),
          weightLabels: {
            regular: t("typography.weights.regular"),
            medium: t("typography.weights.medium"),
            semibold: t("typography.weights.semibold"),
            bold: t("typography.weights.bold"),
          },
          colorsTitle: t("colors.title"),
          colorsBody: t.rich("colors.body", {
            code: (chunks) => (
              <code className="bg-muted rounded px-1.5 py-0.5 text-[13px]">
                {chunks}
              </code>
            ),
          }),
          paletteLabels: {
            [ETheme.ORANGE_LIGHT]: t("palettes.orangeLight"),
            [ETheme.MAIN_LIGHT]: t("palettes.mainLight"),
            [ETheme.MAIN_DARK]: t("palettes.mainDark"),
            [ETheme.ORANGE_DARK]: t("palettes.orangeDark"),
            [ETheme.CHRISTMAS_LIGHT]: t("palettes.christmasLight"),
            [ETheme.CHRISTMAS_DARK]: t("palettes.christmasDark"),
          },
          shadeLabels: [
            "50",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
          ],
          logoTitle: t("logo.title"),
          logoBody: t("logo.body"),
          logoLightAlt: t("logo.lightAlt"),
          logoDarkAlt: t("logo.darkAlt"),
          carbonTitle: t("carbon.title"),
          carbonBody: t.rich("carbon.body", {
            strong: (chunks) => (
              <strong className="text-foreground font-semibold">
                {chunks}
              </strong>
            ),
            beacon: externalLink(COLOPHON_CARBON.beaconHref, "Digital Beacon"),
            carbon: externalLink(COLOPHON_CARBON.carbonHref, "Website Carbon"),
          }),
          carbonBadge: {
            co2Label: t("carbon.badge.co2", {
              grams: COLOPHON_CARBON.co2Grams,
            }),
            brandLabel: t("carbon.badge.brand"),
            cleanerLabel: t("carbon.badge.cleaner"),
          },
        }}
      />
    </ProcessPageShell>
  );
}
