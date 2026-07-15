"use client";

import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
};

export default function HeroContent({ heroData, stats }: HeroContentProps) {
  const t = useTranslations("main.heroMain");
  const { fullName, heroSubtitle, heroTagline, heroSummary } = heroData;

  const parts = heroSubtitle.split("&");
  const mainTitle = parts[0]?.trim() || heroSubtitle;
  const highlightTitle = parts[1] ? `& ${parts[1].trim()}` : "";

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-1 flex-col text-left"
    >
      {/* Status Badge */}
      <motion.div variants={item} className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
        </span>
        <span className="bg-linear-to-r from-primary to-primary-600 bg-clip-text font-semibold text-transparent">
          {t("availableForOpportunities")}
        </span>
      </motion.div>

      <motion.div variants={item}>
        <p className="mb-2 text-lg text-muted-foreground">
          {t("greeting")}
        </p>
        <h1 className="mb-3 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
          {firstName} {lastName && <span className="bg-linear-to-r from-primary to-primary-600 bg-clip-text text-transparent">{lastName}</span>}
        </h1>
        {heroSubtitle && (
          <h2 className="mb-4 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {mainTitle} {highlightTitle && <span className="text-primary">{highlightTitle}</span>}
          </h2>
        )}
        {heroTagline && (
          <p className="mb-6 font-medium leading-relaxed text-primary/80">
            {heroTagline}
          </p>
        )}
        {heroSummary && (
          <p className="mb-9 max-w-xl leading-relaxed text-muted-foreground">
            {heroSummary}
          </p>
        )}
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="mb-9 flex flex-wrap gap-x-10 gap-y-5 border-b border-border/50 pb-9">
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{stats.yearsExperience}+</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{t("yearsExperience")}</p>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{stats.projectsCount}+</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{t("projectsDelivered")}</p>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{stats.certificationsCount}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{t("certifications")}</p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="flex flex-wrap gap-4">
        <Link
          href="/curriculum-vitae"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {t("viewCV")}
          <Download className="h-4 w-4" />
        </Link>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/50 px-6 py-3.5 font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground"
        >
          {t("scheduleCall")}
          <ArrowRight className="h-4 w-4" />
        </a>
      </motion.div>
    </motion.div>
  );
}
