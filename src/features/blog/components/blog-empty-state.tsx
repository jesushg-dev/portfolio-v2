"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, Search, RotateCcw, Layers, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

interface BlogEmptyStateProps {
  isFiltered?: boolean;
  activeFilter?: string;
  onReset?: () => void;
}

export const BlogEmptyState: FC<BlogEmptyStateProps> = ({
  isFiltered = false,
  activeFilter,
  onReset,
}) => {
  const t = useTranslations("main.blog");
  const shouldReduceMotion = useReducedMotion();

  const title = isFiltered
    ? t("emptyState.filteredTitle")
    : t("emptyState.title");
  const description = isFiltered
    ? t("emptyState.filteredDescription")
    : t("emptyState.description");
  const badge =
    isFiltered && activeFilter ? activeFilter : t("emptyState.badge");

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="b-card-glow border-border bg-card relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border p-8 text-center shadow-xs md:p-12"
      role="status"
      aria-live="polite"
    >
      <div className="border-border/60 bg-muted/40 relative mb-6 flex size-20 items-center justify-center rounded-2xl border shadow-2xs">
        {isFiltered ? (
          <Search className="text-primary size-9" aria-hidden="true" />
        ) : (
          <BookOpen className="text-primary size-9" aria-hidden="true" />
        )}
      </div>

      <span className="border-border/50 bg-muted/60 text-muted-foreground mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
        {badge}
      </span>

      <h3 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
        {title}
      </h3>
      <p className="text-muted-foreground mt-2.5 max-w-md text-sm leading-relaxed">
        {description}
      </p>

      {isFiltered && onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="border-border bg-card hover:bg-muted text-foreground hover:border-primary/50 mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all hover:shadow-xs active:scale-95"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          <span>{t("emptyState.reset")}</span>
        </button>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={{ pathname: "/blog/series" }}
            className="border-border bg-card hover:bg-muted text-foreground hover:border-primary/50 inline-flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all hover:shadow-xs active:scale-95"
          >
            <Layers className="text-primary size-3.5" aria-hidden="true" />
            <span>{t("browseSeries")}</span>
          </Link>
          <Link
            href="/"
            className="hover:text-foreground text-muted-foreground inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>{t("backToHome")}</span>
          </Link>
        </div>
      )}
    </motion.div>
  );
};
