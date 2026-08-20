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
}

export default async function HeroContent({
  heroData,
  stats,
}: HeroContentProps) {
  const t = await getTranslations("main.heroMain");
  const { fullName, heroSubtitle, heroTagline, heroSummary } = heroData;

  const parts = heroSubtitle.split("&");
  const mainTitle = parts[0]?.trim() || heroSubtitle;
  const highlightTitle = parts[1] ? `& ${parts[1].trim()}` : "";

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <div className="hero-content-rise flex flex-1 flex-col text-left">
      <div className="border-primary/30 bg-primary/10 mb-7 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
        <span className="relative flex h-2 w-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
          <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
        </span>
        <span className="text-primary font-semibold">
          {t("availableForOpportunities")}
        </span>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-lg">{t("greeting")}</p>
        <h1 className="font-display text-foreground mb-3 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
          {firstName}{" "}
          {lastName && <span className="text-primary">{lastName}</span>}
        </h1>
        {heroSubtitle && (
          <h2 className="font-display text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
            {mainTitle}{" "}
            {highlightTitle && (
              <span className="text-primary-800">{highlightTitle}</span>
            )}
          </h2>
        )}
        {heroTagline && (
          <p className="text-foreground mb-6 leading-relaxed font-medium">
            {heroTagline}
          </p>
        )}
        {heroSummary && (
          <p className="text-muted-foreground mb-9 max-w-xl leading-relaxed">
            {heroSummary}
          </p>
        )}
      </div>

      <dl className="border-border/50 mb-9 flex flex-wrap gap-x-10 gap-y-5 border-b pb-9">
        <div>
          <dt className="text-muted-foreground mt-1 text-sm tracking-wider uppercase">
            {t("yearsExperience")}
          </dt>
          <dd className="font-display text-foreground text-3xl font-bold">
            {stats.yearsExperience}+
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground mt-1 text-sm tracking-wider uppercase">
            {t("projectsDelivered")}
          </dt>
          <dd className="font-display text-foreground text-3xl font-bold">
            {stats.projectsCount}+
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground mt-1 text-sm tracking-wider uppercase">
            {t("certifications")}
          </dt>
          <dd className="font-display text-foreground text-3xl font-bold">
            {stats.certificationsCount}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/curriculum-vitae"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition"
        >
          {t("viewCV")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="#contact"
          aria-label={t("scheduleCallAria")}
          className="border-border bg-card/50 text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 font-semibold transition"
        >
          {t("scheduleCall")}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
