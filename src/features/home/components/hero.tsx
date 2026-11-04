import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import HeroEmpty from "./hero-empty";
import HeroContent from "./hero-content";
import HeroPhoto from "./hero-photo";
import LcpImagePreload from "@/components/shared/lcp-image-preload";

interface HeroStats {
  yearsExperience: number;
  projectsCount: number;
  certificationsCount: number;
  engineersMentored?: number;
}

interface HeroProps {
  stats: HeroStats;
}

const Hero: FC<HeroProps> = async ({ stats }) => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.heroMain",
  });

  const heroData = await getCachedHeroPublic(locale);

  if (!heroData) {
    return <HeroEmpty />;
  }

  const showCvLink = isPublicCvVisible(await resolvePublicTenant());

  const fullName = heroData.fullName?.trim() ?? "";
  const photoUrl = heroData.photoUrl?.trim() ?? "";
  const heroSubtitle = heroData.heroSubtitle?.trim() ?? "";
  const heroTagline = heroData.heroTagline?.trim() ?? "";
  const heroSummary = heroData.heroSummary?.trim() ?? "";
  const imageAlt = heroData.imageAlt?.trim()
    ? heroData.imageAlt.trim()
    : fullName
      ? fullName
      : "profile";
  const availabilityBadge = heroData.availabilityBadge?.trim()
    ? heroData.availabilityBadge.trim()
    : null;

  const parsedHeroData = {
    fullName,
    photoUrl,
    heroSubtitle,
    heroTagline,
    heroSummary,
    imageAlt,
    availabilityBadge,
  };

  return (
    <>
      {photoUrl ? <LcpImagePreload href={photoUrl} /> : null}
      <section
        id="top"
        aria-label={fullName}
        className="relative flex min-h-[calc(100vh-3.25rem)] w-full flex-col justify-center overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24"
      >
        {/* Radial Gradient Glow Effect */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)]"
          aria-hidden="true"
        />

        {/* Subtle Grid Backdrop Overlay */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(var(--border)_0.0625rem,transparent_0.0625rem),linear-gradient(90deg,var(--border)_0.0625rem,transparent_0.0625rem)] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_35%,black_15%,transparent_75%)] bg-[size:3rem_3rem] opacity-30"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid w-full items-center gap-12 px-4 sm:px-6 lg:container lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:px-20">
          <HeroContent
            heroData={parsedHeroData}
            stats={stats}
            showCvLink={showCvLink}
          />
          <HeroPhoto heroData={parsedHeroData} />
        </div>

        {/* Scroll Down Indicator matching Prototype */}
        <div className="mt-12 hidden justify-center lg:flex">
          <a
            href="#portfolio"
            className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-2 font-mono text-xs tracking-widest uppercase transition-colors"
            aria-label={t("scrollDown")}
          >
            <span>{t("scrollDown")}</span>
            <span className="from-primary h-9 w-px bg-gradient-to-b to-transparent" />
          </a>
        </div>
      </section>
    </>
  );
};

export default Hero;
