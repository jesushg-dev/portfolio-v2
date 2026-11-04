import { getPublicLocale } from "@/lib/public-site/locale";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

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
      {/* Availability Status Pill */}
      <div className="bg-primary/10 text-primary mb-5 inline-flex w-fit items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,transparent)] sm:text-sm">
        <span className="relative flex size-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex size-2 rounded-full" />
        </span>
        <span>{heroData.availabilityBadge ?? t("openToWork")}</span>
      </div>

      <div>
        <h1 className="text-foreground text-4xl leading-[1.06] font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {t("greeting")}{" "}
          <span className="text-primary font-bold">
            {firstName} {lastName}
          </span>
        </h1>

        {heroSubtitle ? (
          <p className="text-foreground mt-3 text-xl font-semibold sm:text-2xl">
            {heroSubtitle}
          </p>
        ) : null}

        {heroSummary || heroTagline ? (
          <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed sm:text-lg">
            {heroSummary || heroTagline}
          </p>
        ) : null}
      </div>

      {/* At A Glance Card matching Prototype */}
      <div className="glass-card mt-7 max-w-lg rounded-2xl p-4.5 sm:p-5">
        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
          {t("atAGlance")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <small className="text-muted-foreground block text-xs">
              {t("availability")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-tight">
              {t("immediate")}
            </b>
          </div>
          <div>
            <small className="text-muted-foreground block text-xs">
              {t("yearsExperience")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-tight tabular-nums">
              {stats.yearsExperience}+
            </b>
          </div>
          <div>
            <small className="text-muted-foreground block text-xs">
              {t("projectsDelivered")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-tight tabular-nums">
              {stats.projectsCount}+
            </b>
          </div>
          <div>
            <small className="text-muted-foreground block text-xs">
              {t("engineersLed")}
            </small>
            <b className="text-foreground mt-0.5 block text-lg font-semibold tracking-tight tabular-nums">
              {stats.engineersMentored ?? 6}+
            </b>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="#portfolio"
          className="btn-primary-glow focus-visible:ring-ring inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          {t("seeProjects")}
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
