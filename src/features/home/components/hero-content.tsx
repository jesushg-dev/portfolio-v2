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
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
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
      <motion.div
        variants={item}
        className="border-primary/30 bg-primary/10 mb-7 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
      >
        <span className="relative flex h-2 w-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
          <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
        </span>
        <span className="from-primary to-primary-600 bg-linear-to-r bg-clip-text font-semibold text-transparent">
          {t("availableForOpportunities")}
        </span>
      </motion.div>

      <motion.div variants={item}>
        <p className="text-muted-foreground mb-2 text-lg">{t("greeting")}</p>
        <h1 className="font-display text-foreground mb-3 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
          {firstName}{" "}
          {lastName && (
            <span className="from-primary to-primary-600 bg-linear-to-r bg-clip-text text-transparent">
              {lastName}
            </span>
          )}
        </h1>
        {heroSubtitle && (
          <h2 className="font-display text-foreground mb-4 text-2xl font-semibold sm:text-3xl">
            {mainTitle}{" "}
            {highlightTitle && (
              <span className="text-primary">{highlightTitle}</span>
            )}
          </h2>
        )}
        {heroTagline && (
          <p className="text-primary/80 mb-6 leading-relaxed font-medium">
            {heroTagline}
          </p>
        )}
        {heroSummary && (
          <p className="text-muted-foreground mb-9 max-w-xl leading-relaxed">
            {heroSummary}
          </p>
        )}
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={item}
        className="border-border/50 mb-9 flex flex-wrap gap-x-10 gap-y-5 border-b pb-9"
      >
        <div>
          <p className="font-display text-foreground text-3xl font-bold">
            {stats.yearsExperience}+
          </p>
          <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
            {t("yearsExperience")}
          </p>
        </div>
        <div>
          <p className="font-display text-foreground text-3xl font-bold">
            {stats.projectsCount}+
          </p>
          <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
            {t("projectsDelivered")}
          </p>
        </div>
        <div>
          <p className="font-display text-foreground text-3xl font-bold">
            {stats.certificationsCount}
          </p>
          <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
            {t("certifications")}
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="flex flex-wrap gap-4">
        <Link
          href="/curriculum-vitae"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition"
        >
          {t("viewCV")}
          <Download className="h-4 w-4" />
        </Link>
        <a
          href="#contact"
          className="border-border bg-card/50 text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 font-semibold transition"
        >
          {t("scheduleCall")}
          <ArrowRight className="h-4 w-4" />
        </a>
      </motion.div>
    </motion.div>
  );
}
