import { getPublicLocale } from "@/lib/public-site/locale";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

interface Stats {
  yearsExperience: number;
  projectsCount: number;
  certificationsCount: number;
  engineersMentored?: number;
}

interface HeroData {
  fullName: string;
  heroSubtitle: string;
  heroTagline: string;
  heroSummary: string;
  availabilityBadge?: string | null;
}

interface HeroContentProps {
  heroData: HeroData;
  stats: Stats;
  showCvLink?: boolean;
}

export default async function HeroContent({
  heroData,
  stats,
  showCvLink = true,
}: HeroContentProps) {
  const t = await getTranslations({
    locale: await getPublicLocale(),
    namespace: "main.heroMain",
  });
  const { fullName, heroSubtitle, heroTagline, heroSummary } = heroData;

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <div className="flex flex-1 flex-col text-left">
      {heroData.availabilityBadge ? (
        <div className="bg-primary/10 text-primary ring-primary/40 mb-5 inline-flex w-fit items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset sm:text-sm">
          <span className="relative flex size-2">
            <span className="hero-availability-dot bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="hero-availability-dot bg-primary relative inline-flex size-2 rounded-full" />
          </span>
          <span>{heroData.availabilityBadge}</span>
        </div>
      ) : null}

      <div>
        <h1 className="text-foreground text-[clamp(2.375rem,6vw,4.25rem)] leading-[1.05] font-bold tracking-[-0.035em]">
          {t("greeting")}{" "}
          <span className="text-primary font-bold">
            {firstName} {lastName}
          </span>
        </h1>

        {heroSubtitle ? (
          <p className="text-foreground mt-3.5 text-[1.375rem] font-semibold tracking-tight">
            {heroSubtitle}
          </p>
        ) : null}

        {heroSummary || heroTagline ? (
          <p className="text-muted-foreground mt-6 max-w-[46ch] text-[clamp(1.0625rem,2vw,1.25rem)] leading-normal">
            {heroSummary || heroTagline}
          </p>
        ) : null}
      </div>

      {/* At A Glance Card matching Prototype */}
      <div className="glass-card mt-7 max-w-[32.5rem] rounded-[1.25rem] px-[1.375rem] py-[1.125rem]">
        <p className="text-muted-foreground mb-3 text-sm font-medium tracking-wider uppercase">
          {t("atAGlance")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <small className="text-muted-foreground block text-[0.6875rem]">
              {t("availability")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-[-0.02em]">
              {t("immediate")}
            </b>
          </div>
          <div>
            <small className="text-muted-foreground block text-[0.6875rem]">
              {t("yearsExperience")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-[-0.02em] tabular-nums">
              {stats.yearsExperience}
            </b>
          </div>
          <div>
            <small className="text-muted-foreground block text-[0.6875rem]">
              {t("projectsDelivered")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-[-0.02em] tabular-nums">
              {stats.projectsCount}
            </b>
          </div>
          {stats.engineersMentored != null ? (
            <div>
              <small className="text-muted-foreground block text-[0.6875rem]">
                {t("engineersLed")}
              </small>
              <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-[-0.02em] tabular-nums">
                {stats.engineersMentored}
              </b>
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="#portfolio"
          className="btn-primary-glow focus-visible:ring-ring inline-flex min-h-11 cursor-pointer items-center justify-center gap-3 rounded-full px-6 py-2.5 text-sm font-bold focus-visible:ring-2 focus-visible:outline-none"
        >
          {t("seeProjects")}
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </a>
        {showCvLink ? (
          <Link
            href="/curriculum-vitae"
            className="btn-glass focus-visible:ring-ring inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("viewCV")}
          </Link>
        ) : null}
        <a
          href="#contact"
          className="btn-glass focus-visible:ring-ring inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          {t("getInTouch")}
        </a>
      </div>
    </div>
  );
}
