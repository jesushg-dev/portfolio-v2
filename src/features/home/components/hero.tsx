import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC } from "react";
import { getTranslations } from "next-intl/server";

import { getCachedHeroPublic } from "@/lib/hero/get-cached-hero-public";
import { isPublicCvVisible } from "@/lib/tenant/public-cv";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import { api } from "@/trpc/server";
import HeroEmpty from "./hero-empty";
import HeroContent from "./hero-content";
import HeroPhoto from "./hero-photo";
import { IOSHeroDevice } from "@/components/shared/ios-device/ios-hero-device";
import { initialsFromDisplayName } from "@/lib/site-brand/site-brand";
import LcpImagePreload from "@/components/shared/lcp-image-preload";
import { formatHeroDeviceProfile } from "./hero-device-data";

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

  const [heroData, servicesData] = await Promise.all([
    getCachedHeroPublic(locale),
    api.portfolio.getServicesPublic({ locale }),
  ]);

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

  const deviceProfile = formatHeroDeviceProfile({
    heroSubtitle,
    services: servicesData,
  });

  return (
    <>
      {photoUrl && <LcpImagePreload href={photoUrl} />}
      <section id="top" aria-label={fullName} className="relative w-full">
        <span
          id="about"
          aria-hidden="true"
          className="absolute top-0 scroll-mt-24"
        />
        <IOSHeroDevice
          rotateLabel={t("phone.rotate")}
          profile={{
            name: fullName,
            subtitle: heroSubtitle,
            photo: photoUrl,
            locale,
            initials: initialsFromDisplayName(fullName, 2),
            years: stats.yearsExperience,
            location: heroData.location ?? undefined,
            timezone: heroData.timezone ?? undefined,
            services: deviceProfile.services,
            circuitTitle: deviceProfile.circuitTitle,
            circuitSubtitle: deviceProfile.circuitSubtitle,
            focusTitle: deviceProfile.focusTitle,
            focusSubtitle: deviceProfile.focusSubtitle,
          }}
          staticPortrait={<HeroPhoto heroData={parsedHeroData} />}
          backdrop={
            <>
              {" "}
              {/* Radial Gradient Glow Effect */}
              <div
                className="home-hero-backdrop pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)]"
                aria-hidden="true"
              />
              {/* Subtle Grid Backdrop Overlay */}
              <div
                className="home-hero-backdrop pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(var(--border)_0.0625rem,transparent_0.0625rem),linear-gradient(90deg,var(--border)_0.0625rem,transparent_0.0625rem)] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_35%,black_15%,transparent_75%)] bg-[size:3rem_3rem] opacity-30"
                aria-hidden="true"
              />
            </>
          }
          content={
            <HeroContent
              heroData={parsedHeroData}
              stats={stats}
              showCvLink={showCvLink}
            />
          }
        />
      </section>
    </>
  );
};
export default Hero;
