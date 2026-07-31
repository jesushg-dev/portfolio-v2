"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Calendar } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { useSectionNavigation } from "./use-section-navigation";

interface HeaderCtaBarProps {
  onNavigate?: () => void;
  className?: string;
}

const HeaderCtaBar: FC<HeaderCtaBarProps> = ({ onNavigate, className }) => {
  const t = useTranslations("global.header.nav");
  const { navigateToSection } = useSectionNavigation();

  return (
    <div
      className={cn(
        "border-border/50 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/schedule"
          onClick={onNavigate}
          className="border-border/70 bg-background/80 text-foreground hover:bg-accent/50 inline-flex h-11 min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
        >
          <Calendar aria-hidden className="size-3.5 opacity-80" />
          {t("scheduleCta")}
        </Link>
        <button
          type="button"
          onClick={() => navigateToSection("contact", onNavigate)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors"
        >
          {t("contactCta")}
          <ArrowRight aria-hidden className="size-3.5" />
        </button>
      </div>
      <p className="text-muted-foreground text-sm">{t("scheduleHint")}</p>
    </div>
  );
};

export default HeaderCtaBar;
