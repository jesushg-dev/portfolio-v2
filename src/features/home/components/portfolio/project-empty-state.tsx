"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import {
  Monitor,
  Database,
  Smartphone,
  Layers,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface ProjectEmptyStateProps {
  type?: "FRONTEND" | "BACKEND" | "MOBILE" | "DESKTOP";
  onReset?: () => void;
}

const FILTER_KEY_MAP = {
  FRONTEND: "filters.frontend",
  BACKEND: "filters.backend",
  MOBILE: "filters.mobile",
  DESKTOP: "filters.desktop",
} as const;

export const ProjectEmptyState: FC<ProjectEmptyStateProps> = ({
  type,
  onReset,
}) => {
  const t = useTranslations("main.portfolio");
  const shouldReduceMotion = useReducedMotion();

  const categoryName = type ? t(FILTER_KEY_MAP[type]) : t("filters.all");
  const isAll = !type;

  const title = isAll ? t("emptyState.allTitle") : t("emptyState.title");
  const description = isAll
    ? t("emptyState.allDescription")
    : t("emptyState.description", { category: categoryName });

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="b-card-glow border-border bg-card relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border p-8 text-center shadow-xs md:p-12"
      role="status"
      aria-live="polite"
    >
      {/* Visual illustration according to type */}
      <div className="border-border/60 bg-muted/40 relative mb-6 flex size-20 items-center justify-center rounded-2xl border shadow-2xs">
        {type === "FRONTEND" && (
          <Monitor className="text-primary size-9" aria-hidden="true" />
        )}
        {type === "BACKEND" && (
          <Database className="text-primary size-9" aria-hidden="true" />
        )}
        {type === "MOBILE" && (
          <Smartphone className="text-primary size-9" aria-hidden="true" />
        )}
        {type === "DESKTOP" && (
          <Layers className="text-primary size-9" aria-hidden="true" />
        )}
        {isAll && (
          <Sparkles className="text-primary size-9" aria-hidden="true" />
        )}
      </div>

      {/* Pill Badge */}
      <span className="border-border/50 bg-muted/60 text-muted-foreground mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
        {categoryName}
      </span>

      {/* Text Info */}
      <h3 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
        {title}
      </h3>
      <p className="text-muted-foreground mt-2.5 max-w-md text-sm leading-relaxed">
        {description}
      </p>

      {/* Reset Action */}
      {onReset && !isAll ? (
        <button
          type="button"
          onClick={onReset}
          className="border-border bg-card hover:bg-muted text-foreground hover:border-primary/50 mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold transition-all hover:shadow-xs active:scale-95"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          <span>{t("emptyState.reset")}</span>
        </button>
      ) : null}
    </motion.div>
  );
};
