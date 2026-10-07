import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

interface Stats {
  yearsExperience: number;
  projectsCount: number;
  certificationsCount: number;
}

interface HeroData {
  fullName: string;
  heroSubtitle: string;
  heroTagline: string;
  heroSummary: string;
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
  const t = await getTranslations("main.heroMain");
  const { fullName, heroSubtitle, heroTagline, heroSummary } = heroData;

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <div className="flex flex-1 flex-col text-left">
      {/* Availability badge */}
      <div className="border-primary/25 bg-primary/10 text-primary mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold">
        <i
          className="a-dot bg-primary size-2 rounded-full"
          aria-hidden="true"
        />
        <span>{t("availableForOpportunities")}</span>
      </div>

      <div>
        <p className="text-muted-foreground text-base sm:text-lg">
          {t("greeting")}
        </p>
        <h1 className="text-foreground mt-1 text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          {firstName}{" "}
          {lastName ? <span className="text-primary">{lastName}</span> : null}
        </h1>
        {heroSubtitle ? (
          <h2 className="text-foreground mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {heroSubtitle}
          </h2>
        ) : null}
        {heroTagline ? (
          <p className="text-foreground mt-5 max-w-2xl text-base leading-relaxed font-medium sm:text-lg sm:leading-8">
            {heroTagline}
          </p>
        ) : null}
        {heroSummary ? (
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base sm:leading-8">
            {heroSummary}
          </p>
        ) : null}
      </div>

      {/* 3-Column Stats Card */}
      <dl className="border-border/80 bg-card divide-border/80 mt-8 grid w-full max-w-2xl grid-cols-3 divide-x rounded-2xl border shadow-xs sm:rounded-3xl">
        <div className="p-4 sm:p-5">
          <dd className="text-foreground font-mono text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
            {stats.yearsExperience}+
          </dd>
          <dt className="text-muted-foreground mt-1 text-xs font-medium sm:text-sm">
            {t("yearsExperience")}
          </dt>
        </div>
        <div className="p-4 sm:p-5">
          <dd className="text-foreground font-mono text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
            {stats.projectsCount}+
          </dd>
          <dt className="text-muted-foreground mt-1 text-xs font-medium sm:text-sm">
            {t("projectsDelivered")}
          </dt>
        </div>
        <div className="p-4 sm:p-5">
          <dd className="text-foreground font-mono text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
            6
          </dd>
          <dt className="text-muted-foreground mt-1 text-xs font-medium sm:text-sm">
            {t("engineersLed")}
          </dt>
        </div>
      </dl>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {showCvLink ? (
          <Link
            href="/curriculum-vitae"
            className="group bg-primary text-primary-foreground hover:bg-primary/95 inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-7 font-bold shadow-sm transition"
          >
            {t("viewCV")}
            <span className="bg-primary-foreground text-primary flex size-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        ) : null}
        <a
          href="#contact"
          aria-label={t("scheduleCallAria")}
          className="border-border/80 bg-card text-foreground hover:border-primary hover:text-primary inline-flex items-center gap-3 rounded-full border px-7 py-3.5 font-bold shadow-xs transition"
        >
          {t("scheduleCall")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
