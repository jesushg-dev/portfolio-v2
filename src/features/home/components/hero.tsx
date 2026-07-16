import type { FC } from "react";
import { preload } from "react-dom";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/trpc/server";
import HeroEmpty from "./hero-empty";
import HeroContent from "./hero-content";
import HeroPhoto from "./hero-photo";

interface HeroStats {
  yearsExperience: number;
  projectsCount: number;
  certificationsCount: number;
}

interface HeroProps {
  stats: HeroStats;
}

const Hero: FC<HeroProps> = async ({ stats }) => {
  const locale = await getLocale();
  const t = await getTranslations("main.heroMain");

  const heroData = await api.portfolio.getHeroPublic({ locale });

  if (!heroData) {
    return <HeroEmpty />;
  }

  const fullName = heroData.fullName?.trim() ?? "";
  const photoUrl = heroData.photoUrl?.trim() ?? "";
  if (photoUrl) {
    preload(photoUrl, { as: "image", fetchPriority: "high" });
  }
  const heroSubtitle = heroData.heroSubtitle?.trim() ?? "";
  const heroTagline = heroData.heroTagline?.trim() ?? "";
  const heroSummary = heroData.heroSummary?.trim() ?? "";
  const imageAlt = (heroData.imageAlt?.trim() ?? fullName) || "profile";

  const parsedHeroData = {
    fullName,
    photoUrl,
    heroSubtitle,
    heroTagline,
    heroSummary,
    imageAlt,
  };

  return (
    <section
      id="home"
      aria-label="Home"
      className="bg-background relative flex min-h-screen w-full items-center overflow-hidden"
    >
      {/* Starry Background / Glow - Now SSR */}
      <div className="bg-background absolute inset-0 z-0 overflow-hidden">
        {/* Top central glow */}
        <div className="bg-primary/20 absolute -top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-[100%] blur-[100px]" />
      </div>

      <div className="z-10 mx-auto flex w-full max-w-7xl flex-col-reverse items-center gap-16 px-6 pt-32 pb-24 md:pt-40 md:pb-32 lg:flex-row">
        {/* Left Column - Content (Client Component for animations) */}
        <HeroContent heroData={parsedHeroData} stats={stats} />

        {/* Right Column - Photo (Client Component for animations) */}
        <HeroPhoto heroData={parsedHeroData} />
      </div>

      {/* Scroll Down Indicator - Now SSR */}
      <div className="absolute inset-x-0 bottom-8 mx-auto hidden flex-col items-center justify-center gap-2 lg:flex">
        <div className="scroll-indicator" />
        <p className="text-muted-foreground text-xs">{t("scrollDown")}</p>
      </div>
    </section>
  );
};

export default Hero;
