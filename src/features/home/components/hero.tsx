import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import HeroEmpty from "./hero-empty";
import HeroContent from "./hero-content";
import HeroPhoto from "./hero-photo";

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
    locale: await getPublicLocale(),
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
    <section
      id="top"
      aria-label="Home"
      className="bg-card relative flex min-h-screen w-full items-center overflow-hidden"
    >
      {/* Top radial gradient light effect */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60%_70%_at_45%_0%,rgba(99,102,241,.18),transparent)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid w-full items-center gap-12 px-4 pt-28 pb-24 sm:px-6 md:pt-36 md:pb-28 lg:container lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-20">
        <HeroContent
          heroData={parsedHeroData}
          stats={stats}
          showCvLink={showCvLink}
        />
        <HeroPhoto heroData={parsedHeroData} />
      </div>

      {/* Scroll Down Indicator matching Untitled-1.html */}
      <a
        href="#about"
        className="text-muted-foreground hover:text-foreground absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-sm transition-colors lg:flex"
        aria-label={t("scrollDown")}
      >
        <span className="border-border flex h-9 w-6 justify-center rounded-full border pt-1.5">
          <i className="a-wheel bg-muted-foreground h-1.5 w-1 rounded-full" />
        </span>
        {t("scrollDown")}
      </a>
    </section>
  );
};

export default Hero;
